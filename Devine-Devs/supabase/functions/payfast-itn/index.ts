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
// Server-authoritative finalize: once the signature checks out and
// payment_status is COMPLETE, this also marks the pickup completed instead of
// waiting for the manufacturer's app to poll and call confirmDeliveryReceived.
// The earnings split itself is NOT computed here (it used to be) — the DB
// trigger trg_pickups_auto_earnings (docs/migrations/047) fires on the
// status flip and is the single authority for the grade-based
// restaurant/driver/platform split, reading this payment's amount as the
// pool. The manufacturer's client call is a harmless no-op afterwards.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYFAST_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE")!;

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

// Marks the pickup completed (idempotent — skips if already completed).
// Runs with the service-role key since there is no authenticated user in an
// ITN callback. The DB trigger does the money from here.
async function finalizePickupOnServer(
  admin: ReturnType<typeof createClient>,
  pickupId: string
) {
  const { data: pickup, error: pickupError } = await admin
    .from("pickups")
    .select("id, status")
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
  if (pickup.status === "completed") {
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
        await finalizePickupOnServer(admin, transaction.pickup_id);
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
