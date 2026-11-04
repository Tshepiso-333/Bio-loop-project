// supabase/functions/simulate-payment/index.ts
//
// SIMULATED payment. No money moves. No gateway is contacted.
//
// Why this exists (team decision 2026-11-02): the PayFast sandbox puts its own
// branded checkout in front of the user, which is slow, occasionally down, and
// shows a "SANDBOX" banner — none of which anyone wants to see in a demo. This
// settles the pickup in the background instead, so the manufacturer taps Pay
// once and lands on a success screen.
//
// It deliberately reuses the SAME server-side amount calculation as
// payfast-checkout — market_rates by grade, plus manufacturer_markup_pct —
// so the money that flows through earnings, payouts and the platform ledger is
// identical to the real path. Only the gateway round-trip is skipped.
//
// The real PayFast gateway stays in the app and stays deployed — both
// payfast-checkout and payfast-itn are live and working. This is the path the
// UI uses by default; flip USE_SIMULATED_PAYMENT in ManufacturerPaymentScreen
// to send people through the real checkout again.
//
// The row it writes is marked three ways, so a background settlement can never
// be mistaken for money that actually moved:
//   m_payment_id        starts with "SIM-"  (real ones start with "PICKUP-")
//   raw_itn             { simulated: true, ... }
//   signature_verified  stays false — nothing was signed, and saying otherwise
//                       would be a lie in the one column that exists to prove
//                       a payment was verified
// Anything reconciling real money must exclude these.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    // Same auth gate as the real checkout: a signed-in user, who must own the
    // manufacturer on this pickup. Simulated or not, nobody gets to settle
    // someone else's delivery.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const pickupId = body?.pickupId;
    if (!pickupId) return jsonResponse({ error: "pickupId is required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: pickup, error: pickupError } = await admin
      .from("pickups")
      .select(
        "id, restaurant_id, manufacturer_id, actual_volume_liters, estimated_volume_liters, quality_grade, status, restaurants(name), manufacturers(id, name, owner_user_id)",
      )
      .eq("id", pickupId)
      .maybeSingle();

    if (pickupError || !pickup) return jsonResponse({ error: "Pickup not found" }, 404);

    if (pickup.manufacturers?.owner_user_id !== user.id) {
      return jsonResponse({ error: "This pickup is not yours to pay for" }, 403);
    }

    if (pickup.status === "completed") {
      return jsonResponse({ error: "This delivery has already been paid for" }, 409);
    }

    // --- identical maths to payfast-checkout ---
    const volume = Number(pickup.actual_volume_liters ?? pickup.estimated_volume_liters ?? 0);

    const { data: rateRow } = await admin
      .from("market_rates")
      .select("rate_per_liter")
      .eq("grade", pickup.quality_grade)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const rate = Number(rateRow?.rate_per_liter ?? 0);

    const { data: settings } = await admin
      .from("platform_settings")
      .select("manufacturer_markup_pct")
      .limit(1)
      .maybeSingle();
    const markupPct = Number(settings?.manufacturer_markup_pct ?? 10);

    const grossValue = volume * rate;
    const totalCharge = grossValue + grossValue * (markupPct / 100);

    if (!totalCharge || totalCharge <= 0) {
      return jsonResponse(
        { error: "Computed charge is zero — check volume/grade/market rate for this pickup" },
        400,
      );
    }

    // Reuse a pending row if the manufacturer backed out earlier, so one
    // delivery never ends up with two transactions.
    const { data: existing } = await admin
      .from("payment_transactions")
      .select("id")
      .eq("pickup_id", pickupId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const itemName = `Oil delivery - ${pickup.restaurants?.name ?? "restaurant"}`;
    const mPaymentId = `SIM-${String(pickupId).slice(0, 8)}-${Date.now()}`;
    const nowIso = new Date().toISOString();

    let transactionId: string;

    if (existing) {
      const { data: updated, error: updateError } = await admin
        .from("payment_transactions")
        .update({
          amount: totalCharge,
          item_name: itemName,
          status: "complete",
          m_payment_id: mPaymentId,
          raw_itn: { simulated: true, settled_at: nowIso, note: 'Background settlement — no gateway round-trip.' },
          updated_at: nowIso,
        })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (updateError) throw updateError;
      transactionId = updated.id;
    } else {
      const { data: inserted, error: insertError } = await admin
        .from("payment_transactions")
        .insert({
          pickup_id: pickupId,
          manufacturer_id: pickup.manufacturers.id,
          amount: totalCharge,
          item_name: itemName,
          status: "complete",
          m_payment_id: mPaymentId,
          raw_itn: { simulated: true, settled_at: nowIso, note: 'Background settlement — no gateway round-trip.' },
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      transactionId = inserted.id;
    }

    // The pickup itself is NOT completed here. The app calls confirmDelivery()
    // next, exactly as it does after a real payment, so the completion path —
    // and the earnings and payouts the DB triggers off it — stays one code
    // path whichever way the money was taken.
    return jsonResponse({
      simulated: true,
      transactionId,
      mPaymentId,
      amount: totalCharge,
      breakdown: {
        volume,
        rate,
        grossValue,
        markupPct,
        markupAmount: grossValue * (markupPct / 100),
      },
    });
  } catch (err) {
    console.error("simulate-payment: unexpected error", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
