// screens/manufacturer/ManufacturerPaymentScreen.js
//
// Manufacturer pays the platform for oil received (BUSINESS_LOGIC_QUESTIONS.md
// #6/#7) before the trip is marked complete. Real PayFast sandbox checkout:
// payfast-checkout (Edge Function) computes the charge server-side and
// returns a signed auto-submit HTML form, which loads in a WebView pointed
// at PayFast's actual sandbox. payfast-itn (also an Edge Function, public)
// is PayFast's own callback confirming the payment — this screen polls for
// that confirmation rather than trusting the WebView redirect alone. See
// docs/PAYFAST_INTEGRATION.md.
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { startPayfastCheckout, pollForCompletion } from '../../src/services/paymentService';

const THEME = {
  primary: '#10b981',
  primaryDark: '#059669',
  ink: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
};

const currency = (n) => `R${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// payfast-checkout points return/cancel at these distinct marker URLs — the
// WebView's own navigation state is how we detect which one PayFast hit,
// since we're not leaving the app to a system browser.
const RETURN_MARKER = '/process/success';
const CANCEL_MARKER = '/process/cancelled';

export default function ManufacturerPaymentScreen({ route, navigation }) {
  const { pickupId } = route.params ?? {};
  const { pickups = [], confirmDelivery } = useManufacturerContext();

  const pickup = useMemo(() => pickups.find((p) => p.id === pickupId) ?? null, [pickups, pickupId]);

  // summary -> checkout -> confirming -> success | cancelled | error
  const [stage, setStage] = useState('summary');
  const [checkout, setCheckout] = useState(null); // { html, transactionId, amount, breakdown }
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const webviewHandledRef = React.useRef(false);

  const handleStartCheckout = async () => {
    if (!pickup) return;
    setLoadingCheckout(true);
    setErrorMessage(null);
    try {
      const result = await startPayfastCheckout(pickup.id);
      webviewHandledRef.current = false;
      setCheckout(result);
      setStage('checkout');
    } catch (err) {
      Alert.alert('Could not start checkout', err.message ?? 'Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleConfirmedPayment = useCallback(
    async (transactionId) => {
      setStage('confirming');
      try {
        await pollForCompletion(transactionId);
        await confirmDelivery(pickup.id, transactionId);
        setStage('success');
      } catch (err) {
        setErrorMessage(err.message ?? 'Payment did not confirm in time.');
        setStage('error');
      }
    },
    [confirmDelivery, pickup]
  );

  const handleNavigationStateChange = (navState) => {
    if (webviewHandledRef.current || !checkout) return;

    if (navState.url.includes(RETURN_MARKER)) {
      webviewHandledRef.current = true;
      handleConfirmedPayment(checkout.transactionId);
    } else if (navState.url.includes(CANCEL_MARKER)) {
      webviewHandledRef.current = true;
      setStage('cancelled');
    }
  };

  if (!pickup) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>This pickup isn't available anymore.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'checkout' && checkout?.html) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.primaryDark} />
        <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => setStage('summary')}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PayFast</Text>
            <View style={styles.sandboxBadge}>
              <Text style={styles.sandboxBadgeText}>SANDBOX</Text>
            </View>
          </View>
        </LinearGradient>
        <WebView
          source={{ html: checkout.html }}
          onNavigationStateChange={handleNavigationStateChange}
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primaryDark} />
      <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
            disabled={stage === 'confirming'}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.sandboxBadge}>
            <Text style={styles.sandboxBadgeText}>SANDBOX</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {stage === 'success' ? (
          <View style={styles.successWrap}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Payment successful</Text>
            <Text style={styles.successText}>
              You paid {currency(checkout?.amount)} for the delivery from {pickup.restaurants?.name ?? 'the restaurant'}.
              The trip is now marked complete.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.navigate('ManufacturerDashboardScreen')}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : stage === 'confirming' ? (
          <View style={styles.successWrap}>
            <ActivityIndicator size="large" color={THEME.primary} style={{ marginBottom: 20 }} />
            <Text style={styles.successTitle}>Confirming payment...</Text>
            <Text style={styles.successText}>
              Waiting for PayFast to confirm the transaction. This usually takes a few seconds.
            </Text>
          </View>
        ) : stage === 'cancelled' ? (
          <View style={styles.successWrap}>
            <View style={[styles.successIconCircle, { backgroundColor: THEME.muted }]}>
              <Ionicons name="close" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Payment cancelled</Text>
            <Text style={styles.successText}>You cancelled the payment on PayFast. Nothing was charged.</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => setStage('summary')}>
              <Text style={styles.doneButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : stage === 'error' ? (
          <View style={styles.successWrap}>
            <View style={[styles.successIconCircle, { backgroundColor: '#dc2626' }]}>
              <Ionicons name="alert" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Couldn't confirm payment</Text>
            <Text style={styles.successText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => setStage('summary')}>
              <Text style={styles.doneButtonText}>Back to summary</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{pickup.restaurants?.name ?? 'Restaurant'}</Text>
              <Text style={styles.summarySub}>
                {(pickup.actual_volume_liters ?? pickup.estimated_volume_liters ?? 0)}L · Grade {pickup.quality_grade ?? '—'}
              </Text>

              {checkout?.breakdown ? (
                <View style={styles.breakdown}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Oil value</Text>
                    <Text style={styles.breakdownValue}>{currency(checkout.breakdown.grossValue)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Platform fee ({checkout.breakdown.markupPct}%)</Text>
                    <Text style={styles.breakdownValue}>{currency(checkout.breakdown.markupAmount)}</Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownRow}>
                    <Text style={styles.totalLabel}>Total due</Text>
                    <Text style={styles.totalValue}>{currency(checkout.amount)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.sandboxHint}>
                  The exact amount is calculated securely when you start checkout.
                </Text>
              )}
            </View>

            <Text style={styles.sandboxHint}>
              This opens PayFast's real sandbox checkout in-app. Use any PayFast sandbox test card — nothing real is
              charged.
            </Text>

            <TouchableOpacity
              style={[styles.payButton, loadingCheckout && styles.payButtonDisabled]}
              onPress={handleStartCheckout}
              disabled={loadingCheckout}
              activeOpacity={0.85}
            >
              {loadingCheckout ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <Text style={styles.payButtonText}>Pay with PayFast</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: THEME.bg },
  emptyText: { fontSize: 14, color: THEME.muted, textAlign: 'center', marginBottom: 12 },
  backLink: { paddingVertical: 10, paddingHorizontal: 16 },
  backLinkText: { color: THEME.primaryDark, fontWeight: '600' },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBackButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  sandboxBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sandboxBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: { fontSize: 17, fontWeight: '700', color: THEME.ink },
  summarySub: { fontSize: 13, color: THEME.muted, marginTop: 2, marginBottom: 8 },
  breakdown: { marginTop: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { fontSize: 13, color: THEME.muted },
  breakdownValue: { fontSize: 13, color: THEME.ink, fontWeight: '600' },
  breakdownDivider: { height: 1, backgroundColor: THEME.border, marginVertical: 6 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: THEME.ink },
  totalValue: { fontSize: 15, fontWeight: '700', color: THEME.primaryDark },
  sandboxHint: { fontSize: 12, color: THEME.muted, marginBottom: 16, lineHeight: 17 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  successWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 16 },
  successIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: THEME.ink, marginBottom: 10 },
  successText: { fontSize: 14, color: THEME.muted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  doneButton: { backgroundColor: THEME.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14 },
  doneButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
