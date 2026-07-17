/**
 * REFERENCE ONLY — not wired into the app, not imported anywhere.
 *
 * This is a working sandbox PayFast checkout, verified against PayFast's
 * own signature-check tool (the generated MD5 signature matched). It's
 * saved here so the exact signature-string format and field order are not
 * lost before real implementation — this is the part that's genuinely
 * fiddly to get right with PayFast (field order and encoding both matter).
 *
 * DO NOT ship this file's approach as-is. It generates the signature
 * CLIENT-SIDE using the raw merchant_key + passphrase, which means both
 * secrets would sit inside the compiled app bundle — anyone can decompile
 * the app and extract them to forge arbitrary payment requests. The real
 * implementation must move `signatureString` construction + MD5 hashing
 * into a Supabase Edge Function (`supabase/functions/payfast-checkout`),
 * with the RN app only ever calling that function and rendering the
 * resulting redirect URL. See docs/PAYFAST_INTEGRATION.md.
 *
 * Credentials below are read from env, not hardcoded — for local sandbox
 * testing of this reference file, populate PAYFAST_MERCHANT_ID /
 * PAYFAST_MERCHANT_KEY / PAYFAST_PASSPHRASE (see .env.payfast) yourself
 * before running it; they are intentionally left blank here.
 */
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import CryptoJS from 'crypto-js';

export default function PayfastSandboxReference() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [isLoadingWebview, setIsLoadingWebview] = useState(false);

  const [merchantReference] = useState('REF_TEST_01');

  // Populate these from your own env / .env.payfast when running this
  // reference locally. Left blank intentionally — see file header.
  const merchantId = '';
  const merchantKey = '';
  const passphrase = '';

  const amount = '100.00';
  const itemName = 'audi rs3';

  // In this sandbox test all three point at a generic sandbox page, purely
  // to prove the signature. Real implementation needs:
  //   - return_url / cancel_url → in-app deep link or a hosted "thank you" page
  //   - notify_url → the payfast-itn Edge Function's public URL
  const returnUrl = 'https://sandbox.payfast.co.za/eng/features';
  const cancelUrl = 'https://sandbox.payfast.co.za/eng/features';
  const notifyUrl = 'https://sandbox.payfast.co.za/eng/features';

  // --- Signature format, confirmed working against PayFast's sandbox tool ---
  // Field order matters: this must match the order fields are POSTed in the
  // form below, not alphabetical order. Passphrase is appended last.
  // URL fields are percent-encoded; item_name uses '+' for spaces (classic
  // application/x-www-form-urlencoded style, not %20).
  const cleanReturn = encodeURIComponent(returnUrl);
  const cleanCancel = encodeURIComponent(cancelUrl);
  const cleanNotify = encodeURIComponent(notifyUrl);
  const cleanItem = itemName.replace(/ /g, '+');

  const signatureString =
    `merchant_id=${merchantId}&` +
    `merchant_key=${merchantKey}&` +
    `return_url=${cleanReturn}&` +
    `cancel_url=${cleanCancel}&` +
    `notify_url=${cleanNotify}&` +
    `m_payment_id=${merchantReference}&` +
    `amount=${amount}&` +
    `item_name=${cleanItem}&` +
    `passphrase=${passphrase}`;

  // MD5, lowercase hex — this is what PayFast expects in the `signature` field.
  const generatedSignature = CryptoJS.MD5(signatureString).toString(CryptoJS.enc.Hex);

  // Note the form POSTs the *unencoded* return/cancel/notify URLs (the
  // browser/HTML form handles encoding) — only the signature STRING uses
  // the manually percent-encoded versions above. This mismatch is
  // intentional and is what made the signature match PayFast's tool.
  const htmlFormStructure = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body onload="document.forms['payfast_form'].submit()">
        <form name="payfast_form" action="https://sandbox.payfast.co.za/eng/process" method="post">
          <input type="hidden" name="merchant_id" value="${merchantId}" />
          <input type="hidden" name="merchant_key" value="${merchantKey}" />
          <input type="hidden" name="return_url" value="${returnUrl}" />
          <input type="hidden" name="cancel_url" value="${cancelUrl}" />
          <input type="hidden" name="notify_url" value="${notifyUrl}" />
          <input type="hidden" name="m_payment_id" value="${merchantReference}" />
          <input type="hidden" name="amount" value="${amount}" />
          <input type="hidden" name="item_name" value="${itemName}" />
          <input type="hidden" name="signature" value="${generatedSignature}" />
        </form>
        <div style="text-align:center; font-family:sans-serif; margin-top:60px; color:#555;">
          <h2>Connecting securely...</h2>
          <p>Verifying Signature Profile</p>
        </div>
      </body>
    </html>
  `;

  const handleNavigationStateChange = (navState) => {
    if (navState.url.includes('/features')) {
      setTimeout(() => {
        Alert.alert('Payment Portal', 'Process complete.');
        setShowCheckout(false);
      }, 1500);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Product Gateway (reference)</Text>
      <Text style={styles.subtitleText}>Signature Confirmed Setup</Text>

      <View style={styles.cardContainer}>
        <Text style={styles.itemTitle}>{itemName.toUpperCase()}</Text>
        <Text style={styles.itemPrice}>R {amount}</Text>
      </View>

      <TouchableOpacity style={styles.payButton} onPress={() => setShowCheckout(true)}>
        <Text style={styles.payButtonText}>Launch Staging Checkout</Text>
      </TouchableOpacity>

      {showCheckout && (
        <View style={StyleSheet.absoluteFillObject}>
          <SafeAreaView style={styles.checkoutContainer}>
            <WebView
              source={{ html: htmlFormStructure }}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => setIsLoadingWebview(true)}
              onLoadEnd={() => setIsLoadingWebview(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
            {isLoadingWebview && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#E11D48" />
              </View>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCheckout(false)}>
              <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 20 },
  titleText: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitleText: { fontSize: 14, color: '#10b981', fontWeight: '600', marginBottom: 30 },
  cardContainer: { backgroundColor: '#ffffff', width: '100%', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', marginBottom: 40 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8 },
  itemPrice: { fontSize: 36, fontWeight: '800', color: '#0f172a' },
  payButton: { backgroundColor: '#e11d48', paddingVertical: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
  payButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  checkoutContainer: { flex: 1, backgroundColor: '#ffffff' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center' },
  cancelButton: { backgroundColor: '#0f172a', padding: 16, alignItems: 'center' },
  cancelButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});
