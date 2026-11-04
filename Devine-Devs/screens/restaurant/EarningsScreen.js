import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useProfile } from '../../src/hooks/useProfile';
import { useRestaurant } from '../../src/hooks/useRestaurant';
import RestaurantHeader from '../../src/restaurant/components/RestaurantHeader';
import {
  REST_COLORS,
  REST_FONTS,
  REST_RADII,
  REST_SHADOWS,
  REST_SPACING,
} from '../../src/restaurant/restaurantTheme';
import {
  RestaurantEmptyBanner,
  RestaurantLoadingBanner,
  RestaurantRefreshScrollView,
} from '../../src/components/RestaurantScreenStates';
import {
  formatCurrency,
  formatLongDate,
  getInitials,
} from '../../src/utils/restaurantViewModels';

function getFiniteAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function sumKnownAmounts(rows = []) {
  const amounts = rows.map((row) => getFiniteAmount(row.amount)).filter((amount) => amount !== null);
  return amounts.length > 0 ? amounts.reduce((sum, amount) => sum + amount, 0) : null;
}

function formatRateDate(value) {
  if (!value) return 'Update date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Update date unavailable';
  return date.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMethod(method) {
  if (!method) return 'Method unavailable';
  if (method === 'manual') return 'Manual withdrawal';
  return String(method)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapFinancialSummary(wallet, earnings, withdrawals) {
  const available = getFiniteAmount(wallet?.balance);
  const recorded = sumKnownAmounts(earnings);
  const pendingRows = withdrawals.filter((withdrawal) => withdrawal.status === 'pending');
  const completedRows = withdrawals.filter((withdrawal) => withdrawal.status === 'approved');

  return {
    available,
    recorded,
    pendingAmount: sumKnownAmounts(pendingRows),
    pendingCount: pendingRows.length,
    completedAmount: sumKnownAmounts(completedRows),
    completedCount: completedRows.length,
  };
}

function mapEarningRows(earnings, withdrawals) {
  const withdrawalsById = new Map(withdrawals.map((withdrawal) => [withdrawal.id, withdrawal]));

  return earnings.map((earning) => {
    const withdrawal = earning.withdrawal_id
      ? withdrawalsById.get(earning.withdrawal_id)
      : null;
    const amount = getFiniteAmount(earning.amount);
    const liters = getFiniteAmount(earning.liters);

    let status = { label: 'Recorded earning', tone: 'neutral' };
    if (!earning.withdrawal_id) status = { label: 'Available to withdraw', tone: 'available' };
    else if (withdrawal?.status === 'pending') status = { label: 'Withdrawal pending', tone: 'pending' };
    else if (withdrawal?.status === 'approved') status = { label: 'Payment completed', tone: 'success' };
    else if (withdrawal?.status === 'rejected') status = { label: 'Withdrawal rejected', tone: 'error' };
    else status = { label: 'Linked to withdrawal', tone: 'neutral' };

    return {
      id: String(earning.id),
      date: formatLongDate(earning.created_at),
      amount: amount === null ? 'Amount unavailable' : formatCurrency(amount),
      detail: [
        liters === null ? null : `${liters.toLocaleString('en-ZA')} litres`,
        earning.quality_grade ? `Grade ${earning.quality_grade}` : null,
      ].filter(Boolean).join(' · '),
      status,
      references: [
        { label: 'Earning reference', value: earning.id },
        { label: 'Pickup reference', value: earning.pickup_id },
        { label: 'Withdrawal reference', value: earning.withdrawal_id },
        { label: 'Payment reference', value: earning.gateway_reference },
        { label: 'Recorded description', value: earning.description },
      ].filter((item) => item.value),
    };
  });
}

function mapWithdrawalRows(withdrawals) {
  return withdrawals.map((withdrawal) => {
    const amount = getFiniteAmount(withdrawal.amount);
    // 'approved' is the DB's word, inherited from a manual review step that no
    // longer exists — payouts are instant. To the person reading this the money
    // is already in their account, so the label says so.
    const statusMap = {
      pending: { title: 'Payout on its way', label: 'Sending', tone: 'pending' },
      approved: { title: 'Paid out', label: 'Paid', tone: 'success' },
      rejected: { title: 'Payout failed', label: 'Failed', tone: 'error' },
    };
    const status = statusMap[withdrawal.status] ?? {
      title: 'Withdrawal update',
      label: withdrawal.status ? formatMethod(withdrawal.status) : 'Status unavailable',
      tone: 'neutral',
    };

    return {
      id: String(withdrawal.id),
      date: formatLongDate(withdrawal.created_at),
      amount: amount === null ? 'Amount unavailable' : formatCurrency(amount),
      method: formatMethod(withdrawal.method),
      ...status,
      references: [
        { label: 'Withdrawal reference', value: withdrawal.id },
        // The mapped label, not the raw DB value — otherwise this line reads
        // "approved" directly beneath a badge that says "Paid".
        { label: 'Status', value: status.label },
        { label: 'Recorded method', value: withdrawal.method },
      ].filter((item) => item.value),
    };
  });
}

function mapRates(marketRates) {
  const seenGrades = new Set();
  const rates = [];

  [...marketRates]
    .sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime();
      const rightTime = new Date(right.created_at).getTime();
      return (
        (Number.isNaN(rightTime) ? 0 : rightTime) -
        (Number.isNaN(leftTime) ? 0 : leftTime)
      );
    })
    .forEach((rate) => {
      const grade = rate.grade ? String(rate.grade) : null;
      const amount = getFiniteAmount(rate.rate_per_liter);
      if (!grade || amount === null || seenGrades.has(grade) || rates.length >= 3) return;
      seenGrades.add(grade);
      rates.push({
        id: String(rate.id ?? grade),
        grade: grade.startsWith('Grade') ? grade : `Grade ${grade}`,
        amount: `${formatCurrency(amount)}/L`,
        recordedAt: formatRateDate(rate.created_at),
        change: rate.change_label && !/current/i.test(rate.change_label)
          ? rate.change_label
          : 'Recorded rate',
      });
    });

  return rates;
}

function mapLatestQuality(qualityLogs) {
  const latest = qualityLogs[0];
  if (!latest?.grade) return null;
  const grade = String(latest.grade);
  return {
    grade: grade.startsWith('Grade') ? grade : `Grade ${grade}`,
    detail: latest.notes ?? 'Latest quality result recorded for this restaurant.',
    date: formatLongDate(latest.created_at),
  };
}

export default function EarningsScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const {
    restaurant,
    wallet,
    marketRates,
    qualityLogs,
    earnings,
    withdrawals,
    loading,
    refreshing,
    refreshRestaurant,
    requestWithdrawal,
  } = useRestaurant();
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);

  const profileInitials = useMemo(() => getInitials(profile?.full_name, 'RS'), [profile?.full_name]);
  const summary = useMemo(
    () => mapFinancialSummary(wallet, earnings, withdrawals),
    [wallet, earnings, withdrawals]
  );
  const earningRows = useMemo(() => mapEarningRows(earnings, withdrawals), [earnings, withdrawals]);
  const withdrawalRows = useMemo(() => mapWithdrawalRows(withdrawals), [withdrawals]);
  const rates = useMemo(() => mapRates(marketRates), [marketRates]);
  const quality = useMemo(() => mapLatestQuality(qualityLogs), [qualityLogs]);
  const unpaidEarnings = useMemo(
    () => earnings
      .filter((earning) => !earning.withdrawal_id)
      .reduce((sum, earning) => sum + Number(earning.amount ?? 0), 0),
    [earnings]
  );
  // Newest approved payout, for the "paid automatically" card. withdrawals
  // already arrive newest-first from the service, but sort defensively rather
  // than depend on that ordering from here.
  const lastPayout = useMemo(() => {
    const paid = (withdrawals ?? []).filter((item) => item?.status === 'approved');
    if (paid.length === 0) return null;
    return paid
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, [withdrawals]);

  const handleRequestWithdrawal = async () => {
    setRequestingWithdrawal(true);
    try {
      await requestWithdrawal();
      Alert.alert('Withdrawal paid', 'Your balance has been paid out instantly.');
    } catch (err) {
      Alert.alert('Could not request withdrawal', err.message ?? 'Please try again.');
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  return (
    <View style={styles.root}>
      <RestaurantHeader
        title="Earnings"
        avatarInitials={profileInitials}
        onAvatarPress={() => navigation.getParent()?.navigate('Profile')}
      />
      <RestaurantRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshRestaurant}
      >
        {loading && !wallet && earnings.length === 0 ? <RestaurantLoadingBanner /> : null}

        <FinancialSummary summary={summary} />
        <WithdrawalAction
          available={unpaidEarnings}
          lastPayout={lastPayout}
          requesting={requestingWithdrawal}
          disabled={requestingWithdrawal || unpaidEarnings <= 0}
          onPress={handleRequestWithdrawal}
        />

        <SectionLabel title="Recorded earnings" subtitle="What you earned from each collection." />
        {earningRows.length > 0 ? earningRows.map((earning) => (
          <EarningRow key={earning.id} earning={earning} />
        )) : <RestaurantEmptyBanner message="No earnings have been recorded yet." />}

        <SectionLabel title="Payments and withdrawals" subtitle="Paid out automatically after each trip." />
        {withdrawalRows.length > 0 ? withdrawalRows.map((withdrawal) => (
          <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />
        )) : <RestaurantEmptyBanner message="No withdrawal or payment history yet." />}

        <SectionLabel
          title="Documents"
          subtitle="Download your payouts or your collection history as a PDF."
        />
        {/* Documents moved to Profile (team decision 2026-11-02). */}

        <SectionLabel title="Market rates" subtitle="Current price per litre, by grade." />
        {rates.length > 0 ? <MarketRatesCard rates={rates} /> : (
          <RestaurantEmptyBanner message="No market rates are available." />
        )}

        <SectionLabel title="Quality information" />
        {quality ? <QualityCard quality={quality} /> : (
          <RestaurantEmptyBanner message="No quality result has been recorded yet." />
        )}

        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
    </View>
  );
}

function FinancialSummary({ summary }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryEyebrow}>Financial overview</Text>
      <View style={styles.primaryAmountRow}>
        <View style={styles.primaryAmountBlock}>
          <Text style={styles.amountLabel}>Recorded earnings</Text>
          <Text style={styles.recordedAmount}>
            {summary.recorded === null ? 'No earnings yet' : formatCurrency(summary.recorded)}
          </Text>
        </View>
        <View style={styles.availableBlock}>
          <Text style={styles.availableLabel}>Available</Text>
          <Text style={styles.availableAmount}>
            {summary.available === null ? 'Unavailable' : formatCurrency(summary.available)}
          </Text>
        </View>
      </View>
      <Text style={styles.summaryNote}>
        Recorded earnings are not automatically paid earnings. Payment status appears below.
      </Text>

      {summary.pendingCount > 0 || summary.completedCount > 0 ? (
        <View style={styles.paymentSummaryRow}>
          {summary.pendingCount > 0 ? (
            <PaymentSummary
              label="Pending payments"
              count={summary.pendingCount}
              amount={summary.pendingAmount}
              tone="pending"
            />
          ) : null}
          {summary.completedCount > 0 ? (
            <PaymentSummary
              label="Completed payments"
              count={summary.completedCount}
              amount={summary.completedAmount}
              tone="success"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function PaymentSummary({ label, count, amount, tone }) {
  return (
    <View style={styles.paymentSummary}>
      <View style={[styles.statusDot, tone === 'success' && styles.statusDotSuccess]} />
      <Text style={styles.paymentSummaryLabel}>{label}</Text>
      <Text style={styles.paymentSummaryAmount}>
        {amount === null ? 'Amount unavailable' : formatCurrency(amount)}
      </Text>
      <Text style={styles.paymentSummaryCount}>{count} recorded</Text>
    </View>
  );
}

// Payouts are automatic: earnings_auto_payout (migration 036, extended to
// drivers in 075) creates an approved withdrawal the moment an earning is
// written, so a restaurant's available balance is 0 essentially always.
//
// This card used to be a "Withdraw available earnings" button, which meant it
// permanently read "There is currently no balance available to withdraw" and
// sat there disabled — describing working instant payouts as if the money were
// missing. It now states the actual policy and shows the last payout, and only
// falls back to a claim button if an unpaid balance ever does appear, which
// would mean the auto-payout trigger did not fire.
function WithdrawalAction({ available, lastPayout, requesting, disabled, onPress }) {
  const needsClaim = (available ?? 0) > 0;

  if (!needsClaim) {
    return (
      <View style={styles.withdrawCard}>
        <View style={styles.withdrawText}>
          <Text style={styles.withdrawTitle}>Payouts are automatic</Text>
          <Text style={styles.withdrawDetail}>
            {lastPayout
              ? `Your share is paid out the moment a collection completes. No request needed. Last payout ${formatCurrency(lastPayout.amount)} on ${formatLongDate(lastPayout.created_at)}.`
              : 'Your share is paid out the moment a collection completes. Nothing to request.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.withdrawCard}>
      <View style={styles.withdrawText}>
        <Text style={styles.withdrawTitle}>Unpaid balance</Text>
        <Text style={styles.withdrawDetail}>
          {`${formatCurrency(available)} did not pay out automatically. Claim it here.`}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.withdrawButton,
          disabled && styles.withdrawButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.withdrawButtonText}>{requesting ? 'Paying…' : 'Claim'}</Text>
      </Pressable>
    </View>
  );
}

function SectionLabel({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function StatusBadge({ status }) {
  return (
    <View style={[
      styles.statusBadge,
      status.tone === 'success' && styles.statusBadgeSuccess,
      status.tone === 'error' && styles.statusBadgeError,
    ]}>
      <Text style={[
        styles.statusBadgeText,
        status.tone === 'success' && styles.statusBadgeTextSuccess,
        status.tone === 'error' && styles.statusBadgeTextError,
      ]}>
        {status.label}
      </Text>
    </View>
  );
}

function EarningRow({ earning }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionTopRow}>
        <View style={styles.transactionIcon}>
          <Ionicons name="leaf-outline" size={19} color={REST_COLORS.primary} />
        </View>
        <View style={styles.transactionText}>
          <Text style={styles.transactionTitle}>Oil collection earning</Text>
          <Text style={styles.transactionDate}>{earning.date}</Text>
        </View>
        <Text style={styles.transactionAmount}>{earning.amount}</Text>
      </View>
      <View style={styles.transactionMetaRow}>
        <StatusBadge status={earning.status} />
        {earning.detail ? <Text style={styles.transactionDetail}>{earning.detail}</Text> : null}
      </View>
      {earning.references.length > 0 ? (
        <DetailDisclosure
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          references={earning.references}
        />
      ) : null}
    </View>
  );
}

function WithdrawalRow({ withdrawal }) {
  const [expanded, setExpanded] = useState(false);
  const status = { label: withdrawal.label, tone: withdrawal.tone };
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionTopRow}>
        <View style={styles.transactionIcon}>
          <Ionicons name="business-outline" size={19} color={REST_COLORS.body} />
        </View>
        <View style={styles.transactionText}>
          <Text style={styles.transactionTitle}>{withdrawal.title}</Text>
          <Text style={styles.transactionDate}>{withdrawal.date} · {withdrawal.method}</Text>
        </View>
        <Text style={styles.transactionAmount}>{withdrawal.amount}</Text>
      </View>
      <StatusBadge status={status} />
      {withdrawal.references.length > 0 ? (
        <DetailDisclosure
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          references={withdrawal.references}
        />
      ) : null}
    </View>
  );
}

function DetailDisclosure({ expanded, onToggle, references }) {
  return (
    <View style={styles.disclosureBlock}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.disclosureButton, pressed && styles.pressed]}>
        <Text style={styles.disclosureButtonText}>{expanded ? 'Hide transaction details' : 'Show transaction details'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={REST_COLORS.muted} />
      </Pressable>
      {expanded ? (
        <View style={styles.referenceList}>
          {references.map((reference) => (
            <View key={`${reference.label}-${reference.value}`} style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>{reference.label}</Text>
              <Text selectable style={styles.referenceValue}>{String(reference.value)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MarketRatesCard({ rates }) {
  return (
    <View style={styles.card}>
      {rates.map((rate, index) => (
        <View key={rate.id} style={[styles.rateRow, index < rates.length - 1 && styles.rateRowBorder]}>
          <View style={styles.rateText}>
            <Text style={styles.rateGrade}>{rate.grade}</Text>
            <Text style={styles.rateDate}>Recorded {rate.recordedAt}</Text>
            <Text style={styles.rateChange}>{rate.change}</Text>
          </View>
          <Text style={styles.rateAmount}>{rate.amount}</Text>
        </View>
      ))}
    </View>
  );
}

function QualityCard({ quality }) {
  return (
    <View style={styles.card}>
      <View style={styles.qualityRow}>
        <View style={styles.qualityIcon}>
          <Ionicons name="analytics-outline" size={20} color={REST_COLORS.primary} />
        </View>
        <View style={styles.qualityText}>
          <Text style={styles.qualityGrade}>{quality.grade}</Text>
          <Text style={styles.qualityDate}>Recorded {quality.date}</Text>
          <Text style={styles.qualityDetail}>{quality.detail}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },
  summaryCard: { backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: REST_COLORS.border, ...REST_SHADOWS.card },
  summaryEyebrow: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.muted, marginBottom: 12 },
  primaryAmountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  primaryAmountBlock: { flex: 1 },
  amountLabel: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.body, marginBottom: 3 },
  recordedAmount: { fontFamily: REST_FONTS.extraBold, fontSize: 29, lineHeight: 36, color: REST_COLORS.ink },
  availableBlock: { minWidth: 105, backgroundColor: REST_COLORS.surfaceSoft, borderRadius: REST_RADII.chip, padding: 11 },
  availableLabel: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted, marginBottom: 3 },
  availableAmount: { fontFamily: REST_FONTS.bold, fontSize: 16, color: REST_COLORS.ink },
  summaryNote: { fontFamily: REST_FONTS.medium, fontSize: 10, lineHeight: 15, color: REST_COLORS.muted, marginTop: 12 },
  paymentSummaryRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: REST_COLORS.divider, paddingTop: 14, marginTop: 14 },
  paymentSummary: { flex: 1, backgroundColor: REST_COLORS.page, borderRadius: REST_RADII.chip, padding: 11 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: REST_COLORS.muted, marginBottom: 7 },
  statusDotSuccess: { backgroundColor: REST_COLORS.positive },
  paymentSummaryLabel: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.body },
  paymentSummaryAmount: { fontFamily: REST_FONTS.bold, fontSize: 16, color: REST_COLORS.ink, marginTop: 3 },
  paymentSummaryCount: { fontFamily: REST_FONTS.medium, fontSize: 9, color: REST_COLORS.muted, marginTop: 2 },
  withdrawCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, borderWidth: 1, borderColor: REST_COLORS.border, padding: 14, marginBottom: 22 },
  withdrawText: { flex: 1 },
  withdrawTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.ink },
  withdrawDetail: { fontFamily: REST_FONTS.medium, fontSize: 10, lineHeight: 15, color: REST_COLORS.muted, marginTop: 3 },
  withdrawButton: { backgroundColor: REST_COLORS.primary, borderRadius: REST_RADII.pill, paddingHorizontal: 15, paddingVertical: 9 },
  withdrawButtonDisabled: { backgroundColor: REST_COLORS.muted },
  withdrawButtonText: { fontFamily: REST_FONTS.bold, fontSize: 11, color: REST_COLORS.white },
  sectionHeader: { marginTop: 4, marginBottom: 9 },
  sectionTitle: { fontFamily: REST_FONTS.bold, fontSize: 15, color: REST_COLORS.ink },
  sectionSubtitle: { fontFamily: REST_FONTS.medium, fontSize: 10, lineHeight: 15, color: REST_COLORS.muted, marginTop: 2 },
  transactionCard: { backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, borderWidth: 1, borderColor: REST_COLORS.border, padding: 14, marginBottom: 10 },
  transactionTopRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  transactionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: REST_COLORS.paleGreen, alignItems: 'center', justifyContent: 'center' },
  transactionText: { flex: 1 },
  transactionTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.ink },
  transactionDate: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted, marginTop: 3 },
  transactionAmount: { fontFamily: REST_FONTS.bold, fontSize: 15, color: REST_COLORS.ink, textAlign: 'right' },
  transactionMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 11 },
  transactionDetail: { flex: 1, fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted, textAlign: 'right' },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: REST_COLORS.surfaceSoft, borderRadius: REST_RADII.pill, paddingHorizontal: 9, paddingVertical: 4, marginTop: 11 },
  statusBadgeSuccess: { backgroundColor: REST_COLORS.paleGreen },
  statusBadgeError: { backgroundColor: REST_COLORS.alertBg },
  statusBadgeText: { fontFamily: REST_FONTS.semiBold, fontSize: 9, color: REST_COLORS.body },
  statusBadgeTextSuccess: { color: REST_COLORS.positive },
  statusBadgeTextError: { color: REST_COLORS.negative },
  disclosureBlock: { borderTopWidth: 1, borderTopColor: REST_COLORS.divider, marginTop: 11, paddingTop: 8 },
  disclosureButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
  disclosureButtonText: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.body },
  referenceList: { marginTop: 8, gap: 8 },
  referenceRow: { backgroundColor: REST_COLORS.page, borderRadius: 8, padding: 8 },
  referenceLabel: { fontFamily: REST_FONTS.semiBold, fontSize: 9, color: REST_COLORS.muted, marginBottom: 2 },
  referenceValue: { fontFamily: REST_FONTS.medium, fontSize: 9, lineHeight: 13, color: REST_COLORS.body },
  card: { backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: REST_COLORS.border, ...REST_SHADOWS.card },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rateRowBorder: { borderBottomWidth: 1, borderBottomColor: REST_COLORS.divider, paddingBottom: 14, marginBottom: 6 },
  rateText: { flex: 1 },
  rateGrade: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.ink },
  rateDate: { fontFamily: REST_FONTS.medium, fontSize: 9, color: REST_COLORS.muted, marginTop: 3 },
  rateChange: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.body, marginTop: 3 },
  rateAmount: { fontFamily: REST_FONTS.bold, fontSize: 17, color: REST_COLORS.ink },
  qualityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  qualityIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: REST_COLORS.paleGreen, alignItems: 'center', justifyContent: 'center' },
  qualityText: { flex: 1 },
  qualityGrade: { fontFamily: REST_FONTS.bold, fontSize: 16, color: REST_COLORS.ink },
  qualityDate: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted, marginTop: 2 },
  qualityDetail: { fontFamily: REST_FONTS.medium, fontSize: 11, lineHeight: 17, color: REST_COLORS.body, marginTop: 5 },
  pressed: { opacity: 0.85 },
});
