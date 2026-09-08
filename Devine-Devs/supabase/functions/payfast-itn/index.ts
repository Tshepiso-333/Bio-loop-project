// supabase/functions/payfast-itn/index.ts
//
// The public webhook PayFast calls after a payment completes (or fails).
// This is the ONLY authoritative source of "did the money actually move" —
// never trust the RN app's own claim that a payment succeeded. Verifies the
// signature PayFast sends, then flips the matching payment_transactions row.
// Deliberately does NOT use the withSupabase/apiKey wrapper other functions
// in this project use — PayFast's servers call this directly with no
// Supabase auth at all, so this must accept fully unauthenticated POSTs
// (config.toml already sets verify_jwt = false for this function).
//
// Server-authoritative finalize (closes the gap docs/README.md used to flag):
// once the signature checks out and payment_status is COMPLETE, this now
// also finalizes the pickup itself (status -> completed, completed_at) and
// creates the earnings split, instead of waiting for the manufacturer's app
// to poll payment_transactions and call confirmDeliveryReceived. That client
// call still exists and is now a harmless no-op for an already-completed
// pickup (finalizePickupEarnings in src/services/payoutService.js already
// no-ops if earnings rows for the pickup exist, and this function's own
// finalize below has the same existing-earnings guard). The split math below
// is a deliberate line-for-line port of payoutService.js's
// finalizePickupEarnings — keep the two in sync if either changes.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYFAST_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE")!;

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

// Deno port of payoutService.js's finalizePickupEarnings. Runs with the
// service-role key (bypasses RLS, same as the rest of this function) since
// there is no authenticated user in an ITN callback.
async function finalizePickupOnServer(
  admin: ReturnType<typeof createClient>,
  pickupId: string,
  gatewayReference: string
) {
  const { data: pickup, error: pickupError } = await admin
    .from("pickups")
    .select("id, restaurant_id, collector_id, status, quality_grade, actual_volume_liters, estimated_volume_liters, driver_payout_amount")
    .eq("id", pickupId)
    .maybeSingle();

  if (pickupError) {
    console.error("payfast-itn: failed to load pickup", pickupError);
    return;
  }
  if (!pickup) {
    console.error("payfast-itn: no matching pickup for payment_transactions row", { pickupId });
    return;
  }

  // Already finalized (e.g. the manufacturer's client-side poll won the
  // race and called confirmDeliveryReceived first) — don't double-pay.
  const { data: existingEarnings, error: existingError } = await admin
    .from("earnings")
    .select("id")
    .eq("pickup_id", pickupId)
    .limit(1);

  if (existingError) {
    console.error("payfast-itn: failed to check existing earnings", existingError);
    return;
  }
  if (existingEarnings?.length) {
    return;
  }

  const volume = Number(pickup.actual_volume_liters ?? pickup.estimated_volume_liters ?? 0);
  if (!volume || !pickup.restaurant_id) {
    return;
  }

  let rate = 0;
  if (pickup.quality_grade) {
    const { data: rateRow, error: rateError } = await admin
      .from("market_rates")
      .select("rate_per_liter")
      .eq("grade", pickup.quality_grade)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateError) {
      console.error("payfast-itn: failed to load market rate", rateError);
      return;
    }
    rate = Number(rateRow?.rate_per_liter ?? 0);
  }

  const grossValue = volume * rate;

  const { data: settings, error: settingsError } = await admin
    .from("platform_settings")
    .select("commission_pct, driver_flat_rate_per_pickup")
    .limit(1)
    .maybeSingle();

  if (settingsError) {
    console.error("payfast-itn: failed to load platform settings", settingsError);
    return;
  }

  const commissionPct = Number(settings?.commission_pct ?? 0);
  const driverFlatRate = Number(settings?.driver_flat_rate_per_pickup ?? 0);
  const adminSetDriverPay = pickup.driver_payout_amount;

  const platformCut = grossValue * (commissionPct / 100);
  const driverEarning = pickup.collector_id
    ? Number(adminSetDriverPay ?? driverFlatRate ?? 0)
    : 0;
  const restaurantEarning = Math.max(grossValue - platformCut - driverEarning, 0);

  const rows: Record<string, unknown>[] = [
    {
      restaurant_id: pickup.restaurant_id,
      pickup_id: pickup.id,
      amount: restaurantEarning,
      liters: volume,
      quality_grade: pickup.quality_grade ?? null,
      description: `Pickup ${pickup.id}`,
      gateway_reference: gatewayReference ?? null,
    },
  ];

  if (pickup.collector_id && driverEarning > 0) {
    rows.push({
      collector_id: pickup.collector_id,
      pickup_id: pickup.id,
      amount: driverEarning,
      liters: volume,
      quality_grade: pickup.quality_grade ?? null,
      description: `Collection fee for pickup ${pickup.id}`,
      gateway_reference: gatewayReference ?? null,
    });
  }

  const { error: earningsInsertError } = await admin.from("earnings").insert(rows);
  if (earningsInsertError) {
    console.error("payfast-itn: failed to insert earnings", earningsInsertError);
    return;
  }

  const { error: pickupUpdateError } = await admin
    .from("pickups")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", pickupId);

  if (pickupUpdateError) {
    console.error("payfast-itn: failed to mark pickup completed", pickupUpdateError);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  try {
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);

    // PayFast's ITN signature = MD5 of every posted field (URL-encoded, in
    // the order PayFast sent them), excluding `signature` itself, with the
    // passphrase appended — different construction from the checkout
    // signature (that one's fixed-field-order, this one's "whatever they sent").
    const receivedSignature = params.get("signature") ?? "";
    const pairs: string[] = [];
    for (const [key, value] of params.entries()) {
      if (key === "signature") continue;
      pairs.push(`${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`);
    }
    const signatureString = `${pairs.join("&")}&passphrase=${PAYFAST_PASSPHRASE}`;
    const computedSignature = md5(signatureString);

    const signatureValid = computedSignature === receivedSignature;

    const mPaymentId = params.get("m_payment_id");
    const pfPaymentId = params.get("pf_payment_id");
    const paymentStatus = params.get("payment_status");

    const rawItn = Object.fromEntries(params.entries());

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!mPaymentId) {
      console.error("payfast-itn: missing m_payment_id", rawItn);
      return new Response("missing m_payment_id", { status: 400 });
    }

    if (!signatureValid) {
      // Log but still 200 — PayFast retries on non-200, and we don't want
      // retry storms for a signature we're never going to accept. The
      // transaction is left 'pending' (never marked complete) either way.
      console.error("payfast-itn: signature mismatch", { mPaymentId, rawItn });
      await admin
        .from("payment_transactions")
        .update({ status: "failed", raw_itn: rawItn, signature_verified: false, updated_at: new Date().toISOString() })
        .eq("m_payment_id", mPaymentId);
      return new Response("signature invalid", { status: 200 });
    }

    const newStatus = paymentStatus === "COMPLETE" ? "complete" : "failed";

    const { data: transaction, error } = await admin
      .from("payment_transactions")
      .update({
        status: newStatus,
        pf_payment_id: pfPaymentId,
        signature_verified: true,
        raw_itn: rawItn,
        updated_at: new Date().toISOString(),
      })
      .eq("m_payment_id", mPaymentId)
      .select("id, pickup_id")
      .maybeSingle();

    if (error) {
      console.error("payfast-itn: failed to update transaction", error);
      return new Response("db update failed", { status: 500 });
    }

    if (newStatus === "complete" && transaction?.pickup_id) {
      try {
        await finalizePickupOnServer(admin, transaction.pickup_id, transaction.id);
      } catch (finalizeErr) {
        // Never fail the ITN response over a finalize error — PayFast has
        // already been told the payment was received; log for follow-up
        // instead of retrying the whole webhook (which would keep resending
        // a payment PayFast considers settled).
        console.error("payfast-itn: failed to finalize pickup", finalizeErr);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("payfast-itn: unexpected error", err);
    return new Response("error", { status: 500 });
  }
});
