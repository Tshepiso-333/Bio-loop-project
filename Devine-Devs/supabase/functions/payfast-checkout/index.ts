// supabase/functions/payfast-checkout/index.ts
//
// Called by the manufacturer's app (ManufacturerPaymentScreen) with just a
// pickupId. Everything security-sensitive happens here, server-side:
//   - the charge amount is computed from the DB (market_rates + platform_settings),
//     never trusted from the client — a client could otherwise send any amount
//   - the caller is verified to actually own the manufacturer on this pickup
//   - the PayFast signature is built using the real merchant_key + passphrase,
//     which never touch the RN app bundle (see docs/PAYFAST_INTEGRATION.md)
//
// Returns an auto-submitting HTML form (same structure verified against
// PayFast's sandbox signature-check tool in
// docs/payfast-reference/sandbox-checkout-reference.jsx) for the app to load
// into a WebView.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PAYFAST_MERCHANT_ID = Deno.env.get("PAYFAST_MERCHANT_ID")!;
const PAYFAST_MERCHANT_KEY = Deno.env.get("PAYFAST_MERCHANT_KEY")!;
const PAYFAST_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE")!;
const PAYFAST_PROCESS_URL = Deno.env.get("PAYFAST_PROCESS_URL") ?? "https://sandbox.payfast.co.za/eng/process";

const RETURN_URL = "https://sandbox.payfast.co.za/eng/process/success";
const CANCEL_URL = "https://sandbox.payfast.co.za/eng/process/cancelled";

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { pickupId } = await req.json();
    if (!pickupId) return jsonResponse({ error: "pickupId required" }, 400);

    // Service-role client: bypasses RLS so we can look up the pickup and
    // write the transaction row regardless of the caller's own policies —
    // ownership is checked manually below instead.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: pickup, error: pickupError } = await admin
      .from("pickups")
      .select("id, restaurant_id, manufacturer_id, actual_volume_liters, estimated_volume_liters, quality_grade, restaurants(name), manufacturers(id, name, owner_user_id)")
      .eq("id", pickupId)
      .maybeSingle();

    if (pickupError) throw pickupError;
    if (!pickup) return jsonResponse({ error: "Pickup not found" }, 404);
    if (pickup.manufacturers?.owner_user_id !== user.id) {
      return jsonResponse({ error: "You do not own this pickup's manufacturer" }, 403);
    }

    const volume = Number(pickup.actual_volume_liters ?? pickup.estimated_volume_liters ?? 0);

    const { data: rateRow } = await admin
      .from("market_rates")
      .select("rate_per_liter")
      .eq("grade", pickup.quality_grade)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const rate = Number(rateRow?.rate_per_liter ?? 0);

    const { data: settings } = await admin.from("platform_settings").select("manufacturer_markup_pct").limit(1).maybeSingle();
    const markupPct = Number(settings?.manufacturer_markup_pct ?? 10);

    const grossValue = volume * rate;
    const totalCharge = grossValue + grossValue * (markupPct / 100);

    if (!totalCharge || totalCharge <= 0) {
      return jsonResponse({ error: "Computed charge is zero — check volume/grade/market rate for this pickup" }, 400);
    }

    // Reuse an existing pending transaction for this pickup if one's already
    // been created (e.g. the manufacturer backed out of the WebView and
    // re-opened the payment screen) instead of creating a new row each time.
    const { data: existing } = await admin
      .from("payment_transactions")
      .select("*")
      .eq("pickup_id", pickupId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const mPaymentId = existing?.m_payment_id ?? `PICKUP-${pickupId.slice(0, 8)}-${Date.now()}`;
    const amount = totalCharge.toFixed(2);
    const itemName = `Oil delivery - ${pickup.restaurants?.name ?? "restaurant"}`;

    let transactionId: string;
    if (existing) {
      transactionId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await admin
        .from("payment_transactions")
        .insert({
          pickup_id: pickupId,
          manufacturer_id: pickup.manufacturers.id,
          amount: totalCharge,
          item_name: itemName,
          status: "pending",
          m_payment_id: mPaymentId,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      transactionId = inserted.id;
    }

    // --- Signature format verified against PayFast's sandbox tool ---
    // Field order matters (must match the form's field order, not
    // alphabetical). Passphrase is appended last. URL fields are
    // percent-encoded; item_name uses '+' for spaces.
    const cleanReturn = encodeURIComponent(RETURN_URL);
    const cleanCancel = encodeURIComponent(CANCEL_URL);
    const cleanNotify = encodeURIComponent(`${SUPABASE_URL}/functions/v1/payfast-itn`);
    const cleanItem = itemName.replace(/ /g, "+");

    const signatureString =
      `merchant_id=${PAYFAST_MERCHANT_ID}&` +
      `merchant_key=${PAYFAST_MERCHANT_KEY}&` +
      `return_url=${cleanReturn}&` +
      `cancel_url=${cleanCancel}&` +
      `notify_url=${cleanNotify}&` +
      `m_payment_id=${mPaymentId}&` +
      `amount=${amount}&` +
      `item_name=${cleanItem}&` +
      `passphrase=${PAYFAST_PASSPHRASE}`;

    const signature = md5(signatureString);

    const html = `
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body onload="document.forms['payfast_form'].submit()">
          <form name="payfast_form" action="${PAYFAST_PROCESS_URL}" method="post">
            <input type="hidden" name="merchant_id" value="${PAYFAST_MERCHANT_ID}" />
            <input type="hidden" name="merchant_key" value="${PAYFAST_MERCHANT_KEY}" />
            <input type="hidden" name="return_url" value="${RETURN_URL}" />
            <input type="hidden" name="cancel_url" value="${CANCEL_URL}" />
            <input type="hidden" name="notify_url" value="${SUPABASE_URL}/functions/v1/payfast-itn" />
            <input type="hidden" name="m_payment_id" value="${mPaymentId}" />
            <input type="hidden" name="amount" value="${amount}" />
            <input type="hidden" name="item_name" value="${itemName}" />
            <input type="hidden" name="signature" value="${signature}" />
          </form>
          <div style="text-align:center; font-family:sans-serif; margin-top:60px; color:#555;">
            <h2>Connecting to PayFast...</h2>
          </div>
        </body>
      </html>
    `;

    return jsonResponse({
      html,
      transactionId,
      mPaymentId,
      amount: totalCharge,
      breakdown: { volume, rate, grossValue, markupPct, markupAmount: grossValue * (markupPct / 100) },
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
