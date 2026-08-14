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
// Known limitation (see docs/PAYFAST_INTEGRATION.md): this does NOT also
// finalize the pickup/earnings — that still happens client-side in
// ManufacturerPaymentScreen after it polls payment_transactions and sees
// 'complete'. A fully server-authoritative version would trigger that here
// too, but this app has no server beyond these two functions, and
// duplicating payoutService.js's calculation logic in Deno risked the two
// implementations drifting apart. Flagged, not silently skipped.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYFAST_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE")!;

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
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

    const { error } = await admin
      .from("payment_transactions")
      .update({
        status: newStatus,
        pf_payment_id: pfPaymentId,
        signature_verified: true,
        raw_itn: rawItn,
        updated_at: new Date().toISOString(),
      })
      .eq("m_payment_id", mPaymentId);

    if (error) {
      console.error("payfast-itn: failed to update transaction", error);
      return new Response("db update failed", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("payfast-itn: unexpected error", err);
    return new Response("error", { status: 500 });
  }
});
