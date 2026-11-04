import { supabase } from '../../supabase';

// Real PayFast sandbox integration. The RN app never touches the merchant
// key/passphrase — payfast-checkout (Supabase Edge Function) computes the
// charge server-side, builds the signed auto-submit HTML form, and returns
// it for a WebView to load. payfast-itn (also an Edge Function, public,
// no Supabase auth) is PayFast's own callback — it's the only authoritative
// confirmation that money actually moved. See docs/PAYFAST_INTEGRATION.md.

/**
 * Starts a checkout: asks payfast-checkout to compute the charge for this
 * pickup and build a signed PayFast payment form. Returns
 * { html, transactionId, mPaymentId, amount } — `html` is meant for a
 * WebView's `source={{ html }}`.
 */
export async function startPayfastCheckout(pickupId) {
  const { data, error } = await supabase.functions.invoke('payfast-checkout', {
    body: { pickupId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

/**
 * Settles a delivery in the background — no gateway round-trip, nothing for
 * the user to look at. The charge is computed server-side by the SAME maths
 * payfast-checkout uses, so earnings, payouts and the ledger are unaffected;
 * only the trip out to PayFast's branded checkout is skipped.
 *
 * The row it writes is marked (`SIM-` prefix, `raw_itn.simulated`,
 * `signature_verified` left false) so it can't be mistaken for money that
 * actually moved. The real PayFast path above is still live and is one flag
 * away — see USE_SIMULATED_PAYMENT in ManufacturerPaymentScreen.
 *
 * Returns { transactionId, amount, breakdown, simulated: true }.
 */
export async function settlePaymentInBackground(pickupId) {
  const { data, error } = await supabase.functions.invoke('simulate-payment', {
    body: { pickupId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getPaymentTransaction(transactionId) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * PayFast's sandbox ITN usually arrives within a few seconds of the WebView
 * reaching the return URL, but it's an async webhook, not part of the
 * request/response the app sees — so once the WebView shows "payment done",
 * this polls payment_transactions until payfast-itn has flipped it to
 * 'complete' (or 'failed'), instead of trusting the redirect alone.
 */
export async function pollForCompletion(transactionId, { intervalMs = 2000, timeoutMs = 30000 } = {}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const transaction = await getPaymentTransaction(transactionId);
    if (transaction?.status === 'complete') return transaction;
    if (transaction?.status === 'failed') throw new Error('PayFast reported this payment failed.');
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Still waiting on PayFast to confirm this payment — check back shortly, it should complete on its own.');
}

export default {
  startPayfastCheckout,
  settlePaymentInBackground,
  getPaymentTransaction,
  pollForCompletion,
};
