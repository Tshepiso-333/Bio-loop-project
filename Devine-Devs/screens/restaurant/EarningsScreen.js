<<<<<<< HEAD
import React, { useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const BALANCE = {
  label: 'Available Balance',
  amount: 'R4,280.50',
};

const MARKET_RATES = {
  updatedLabel: 'Updated 2H Ago',
  grades: [
    {
      id: '1',
      grade: 'Grade A',
      rate: 'R1.20',
      unit: '/L',
      change: '+2% vs last month',
      changePositive: true,
      dotColor: '#16A34A',
    },
    {
      id: '2',
      grade: 'Grade B',
      rate: 'R0.90',
      unit: '/L',
      change: 'Stable market',
      changePositive: null, // null = neutral
      dotColor: '#F59E0B',
    },
  ],
};

const AVG_QUALITY = {
  badge: 'High Grade',
  description:
    'Your oil consistently meets Grade A filtration standards.',
};

const RECENT_EARNINGS = [
  {
    id: '1',
    date: 'Oct 24',
    title: 'Collection',
    detail: '42 Liters • Grade A',
    amount: '+R50.40',
    amountDetail: '42 Liters • Grade A',
  },
  {
    id: '2',
    date: 'Oct 18',
    title: 'Collection',
    detail: '38 Liters • Grade A',
    amount: '+R45.60',
    amountDetail: '38 Liters • Grade A',
  },
  {
    id: '3',
    date: 'Oct 11',
    title: 'Collection',
    detail: '50 Liters • Grade B',
    amount: '+R45.00',
    amountDetail: '50 Liters • Grade B',
  },
];

const WITHDRAWAL_HISTORY = [
  {
    id: '1',
    date: 'Oct 05, 2023',
    method: 'Bank Transfer',
    methodIcon: 'business-outline',
    amount: '-R1,200.00',
  },
  {
    id: '2',
    date: 'Sep 20, 2023',
    method: 'ACH',
    methodIcon: 'swap-horizontal-outline',
    amount: '-R850.25',
  },
];

// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  background: '#F4F4EF',
  card: '#FFFFFF',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenDark: '#14532D',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  tabActive: '#16A34A',
  tabInactive: '#94A3B8',
  amber: '#F59E0B',
  positive: '#16A34A',
  negative: '#DC2626',
};

// ─── FONTS ────────────────────────────────────────────────────────────────────

const FONTS = {
  bold: 'Poppins_700Bold',
  semiBold: 'Poppins_600SemiBold',
  medium: 'Poppins_500Medium',
  regular: 'Poppins_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyRegular: 'Inter_400Regular',
};

// ─── ICON HELPER ──────────────────────────────────────────────────────────────

function Icon({ library = 'Ionicons', name, size, color }) {
  if (library === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const [withdrawTab, setWithdrawTab] = useState('withdraw');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant name header */}
        <RestaurantHeader name="KitchenSteward" />

        {/* Balance card */}
        <BalanceCard
          balance={BALANCE}
          activeTab={withdrawTab}
          onTabSelect={setWithdrawTab}
        />

        {/* Market rates */}
        <MarketRatesCard rates={MARKET_RATES} />

        {/* Average quality */}
        <AvgQualityCard quality={AVG_QUALITY} />

        {/* Recent earnings */}
        <RecentEarnings items={RECENT_EARNINGS} />

        {/* Withdrawal history */}
        <WithdrawalHistory items={WITHDRAWAL_HISTORY} />

        <View style={{ height: 16 }} />
      </ScrollView>
=======
import React, { useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  getInitials,
  mapAvgQuality,
  mapBalance,
  mapMarketRates,
  mapRecentEarnings,
  mapWithdrawalHistory,
} from '../../src/utils/restaurantViewModels';

export default function EarningsScreen() {
  const [withdrawTab, setWithdrawTab] = useState('withdraw');
  const { profile } = useProfile();
  const {
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

  const unpaidEarnings = useMemo(
    () => (earnings ?? []).filter((row) => !row.withdrawal_id).reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    [earnings]
  );

  const handleRequestWithdrawal = async () => {
    setRequestingWithdrawal(true);
    try {
      await requestWithdrawal();
      Alert.alert('Withdrawal requested', 'Your request has been sent for review.');
    } catch (err) {
      Alert.alert('Could not request withdrawal', err.message ?? 'Please try again.');
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  const profileInitials = useMemo(
    () => getInitials(profile?.full_name, 'RS'),
    [profile?.full_name]
  );
  const balance = useMemo(() => mapBalance(wallet), [wallet]);
  const marketRatesView = useMemo(() => mapMarketRates(marketRates), [marketRates]);
  const avgQuality = useMemo(() => mapAvgQuality(qualityLogs), [qualityLogs]);
  const recentEarnings = useMemo(() => mapRecentEarnings(earnings), [earnings]);
  const withdrawalHistory = useMemo(
    () => mapWithdrawalHistory(withdrawals),
    [withdrawals]
  );

  return (
    <View style={styles.root}>
      <RestaurantHeader title="Earnings" avatarInitials={profileInitials} />

      <RestaurantRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshRestaurant}
      >
        {loading && !wallet ? <RestaurantLoadingBanner /> : null}

        <BalanceCard
          balance={balance}
          activeTab={withdrawTab}
          onTabSelect={setWithdrawTab}
          unpaidEarnings={unpaidEarnings}
          onRequestWithdrawal={handleRequestWithdrawal}
          requesting={requestingWithdrawal}
        />

        {marketRatesView.grades.length > 0 ? (
          <MarketRatesCard rates={marketRatesView} />
        ) : (
          <RestaurantEmptyBanner message="No market rates available." />
        )}

        <AvgQualityCard quality={avgQuality} />

        {recentEarnings.length > 0 ? (
          <RecentEarnings items={recentEarnings} />
        ) : (
          <RestaurantEmptyBanner message="No earnings recorded yet." />
        )}

        {withdrawalHistory.length > 0 ? (
          <WithdrawalHistory items={withdrawalHistory} />
        ) : (
          <RestaurantEmptyBanner message="No withdrawals yet." />
        )}

        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

<<<<<<< HEAD
function RestaurantHeader({ name }) {
  return (
    <View style={styles.restaurantHeader}>
      <View style={styles.restaurantIcon}>
        <Ionicons name="restaurant-outline" size={18} color={COLORS.green} />
      </View>
      <Text style={styles.restaurantName}>{name}</Text>
      <Pressable style={styles.bellButton}>
        <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
      </Pressable>
    </View>
  );
}

function BalanceCard({ balance, activeTab, onTabSelect }) {
  return (
    <View style={styles.balanceCard}>
      {/* Label */}
      <View style={styles.balanceLabelRow}>
        <Ionicons name="wallet-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.balanceLabel}>{balance.label.toUpperCase()}</Text>
      </View>

      {/* Amount */}
      <Text style={styles.balanceAmount}>{balance.amount}</Text>

      {/* Withdraw / History toggle */}
      <View style={styles.balanceTabRow}>
        <Pressable
          style={[styles.balanceTab, activeTab === 'withdraw' && styles.balanceTabActive]}
=======
function BalanceCard({ balance, activeTab, onTabSelect, unpaidEarnings, onRequestWithdrawal, requesting }) {
  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceLabelRow}>
        <Ionicons name="wallet-outline" size={13} color={REST_COLORS.body} />
        <Text style={styles.balanceLabel}>{balance.label}</Text>
      </View>

      <Text style={styles.balanceAmount}>{balance.amount}</Text>

      <View style={styles.balanceTabRow}>
        <Pressable
          style={({ pressed }) => [
            styles.balanceTab,
            activeTab === 'withdraw' && styles.balanceTabActive,
            pressed && { opacity: 0.85 },
          ]}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          onPress={() => onTabSelect('withdraw')}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={14}
<<<<<<< HEAD
            color={activeTab === 'withdraw' ? '#FFFFFF' : COLORS.textSecondary}
=======
            color={activeTab === 'withdraw' ? REST_COLORS.white : REST_COLORS.body}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          />
          <Text style={[styles.balanceTabText, activeTab === 'withdraw' && styles.balanceTabTextActive]}>
            Withdraw
          </Text>
        </Pressable>

        <Pressable
<<<<<<< HEAD
          style={[styles.balanceTab, activeTab === 'history' && styles.balanceTabActive]}
=======
          style={({ pressed }) => [
            styles.balanceTab,
            activeTab === 'history' && styles.balanceTabActive,
            pressed && { opacity: 0.85 },
          ]}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          onPress={() => onTabSelect('history')}
        >
          <Ionicons
            name="time-outline"
            size={14}
<<<<<<< HEAD
            color={activeTab === 'history' ? '#FFFFFF' : COLORS.textSecondary}
=======
            color={activeTab === 'history' ? REST_COLORS.white : REST_COLORS.body}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          />
          <Text style={[styles.balanceTabText, activeTab === 'history' && styles.balanceTabTextActive]}>
            History
          </Text>
        </Pressable>
      </View>
<<<<<<< HEAD
=======

      {activeTab === 'withdraw' ? (
        <View style={styles.withdrawPanel}>
          <Text style={styles.withdrawPanelText}>R {unpaidEarnings.toFixed(2)} available to withdraw</Text>
          <Pressable
            style={[styles.withdrawRequestBtn, (requesting || unpaidEarnings <= 0) && styles.withdrawRequestBtnDisabled]}
            onPress={onRequestWithdrawal}
            disabled={requesting || unpaidEarnings <= 0}
          >
            <Text style={styles.withdrawRequestBtnText}>
              {requesting ? 'Requesting…' : 'Request withdrawal'}
            </Text>
          </Pressable>
        </View>
      ) : null}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </View>
  );
}

function MarketRatesCard({ rates }) {
  return (
    <View style={styles.card}>
      <View style={styles.marketHeaderRow}>
        <View style={styles.marketTitleRow}>
<<<<<<< HEAD
          <Ionicons name="trending-up-outline" size={15} color={COLORS.textPrimary} />
          <Text style={styles.sectionTitle}>Market Rates</Text>
        </View>
        <View style={styles.updatedBadge}>
          <Ionicons name="refresh-outline" size={10} color={COLORS.textMuted} />
          <Text style={styles.updatedText}>{rates.updatedLabel.toUpperCase()}</Text>
=======
          <Ionicons name="trending-up-outline" size={15} color={REST_COLORS.ink} />
          <Text style={styles.sectionTitle}>Market Rates</Text>
        </View>
        <View style={styles.updatedBadge}>
          <Ionicons name="refresh-outline" size={10} color={REST_COLORS.muted} />
          <Text style={styles.updatedText}>{rates.updatedLabel}</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        </View>
      </View>

      <View style={styles.gradesRow}>
        {rates.grades.map((grade, index) => (
          <View
            key={grade.id}
            style={[styles.gradeCell, index === 1 && styles.gradeCellRight]}
          >
            <View style={styles.gradeLabelRow}>
              <View style={[styles.gradeDot, { backgroundColor: grade.dotColor }]} />
              <Text style={styles.gradeLabel}>{grade.grade}</Text>
            </View>
            <View style={styles.gradeRateRow}>
              <Text style={styles.gradeRate}>{grade.rate}</Text>
              <Text style={styles.gradeUnit}>{grade.unit}</Text>
            </View>
            <Text
              style={[
                styles.gradeChange,
                grade.changePositive === true && styles.gradeChangePositive,
                grade.changePositive === false && styles.gradeChangeNegative,
              ]}
            >
              {grade.change}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AvgQualityCard({ quality }) {
  return (
    <View style={styles.card}>
      <View style={styles.avgQualityLabelRow}>
<<<<<<< HEAD
        <Ionicons name="analytics-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.avgQualityLabel}>Your Avg Quality</Text>
      </View>
      <View style={styles.highGradeBadge}>
        <Ionicons name="star" size={13} color={COLORS.green} />
        <Text style={styles.highGradeText}>{quality.badge.toUpperCase()}</Text>
=======
        <Ionicons name="analytics-outline" size={13} color={REST_COLORS.muted} />
        <Text style={styles.avgQualityLabel}>Your avg quality</Text>
      </View>
      <View style={styles.highGradeBadge}>
        <Ionicons name="star" size={13} color={REST_COLORS.primary} />
        <Text style={styles.highGradeText}>{quality.badge}</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      </View>
      <Text style={styles.avgQualityDesc}>{quality.description}</Text>
    </View>
  );
}

function RecentEarnings({ items }) {
  return (
    <View style={styles.section}>
<<<<<<< HEAD
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="receipt-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
        </View>
        <Pressable style={styles.viewAllRow}>
          <Text style={styles.viewAll}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color={COLORS.green} />
        </Pressable>
=======
      <View style={styles.sectionTitleRow}>
        <Ionicons name="receipt-outline" size={16} color={REST_COLORS.ink} />
        <Text style={styles.sectionTitle}>Recent Earnings</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      </View>

      {items.map((item) => (
        <EarningRow key={item.id} item={item} />
      ))}
    </View>
  );
}

function EarningRow({ item }) {
  return (
    <View style={styles.earningRow}>
<<<<<<< HEAD
      {/* Truck icon */}
      <View style={styles.earningIconWrap}>
        <MaterialCommunityIcons name="truck-outline" size={20} color={COLORS.green} />
      </View>

      {/* Date + detail */}
=======
      <View style={styles.earningIconWrap}>
        <MaterialCommunityIcons name="truck-outline" size={20} color={REST_COLORS.primary} />
      </View>

>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      <View style={styles.earningText}>
        <Text style={styles.earningTitle}>
          <Text style={styles.earningDate}>{item.date} </Text>
          {item.title}
        </Text>
        <Text style={styles.earningDetail}>{item.detail}</Text>
      </View>

<<<<<<< HEAD
      {/* Amount + detail */}
=======
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      <View style={styles.earningRight}>
        <Text style={styles.earningAmount}>{item.amount}</Text>
        <Text style={styles.earningAmountDetail}>{item.amountDetail}</Text>
      </View>
    </View>
  );
}

function WithdrawalHistory({ items }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
<<<<<<< HEAD
        <Ionicons name="swap-vertical-outline" size={16} color={COLORS.textPrimary} />
        <Text style={styles.sectionTitle}>Withdrawal History</Text>
      </View>

      {/* Table header */}
=======
        <Ionicons name="swap-vertical-outline" size={16} color={REST_COLORS.ink} />
        <Text style={styles.sectionTitle}>Withdrawal History</Text>
      </View>

>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
        <Text style={[styles.tableHeaderCell, styles.colMethod]}>Method</Text>
        <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.colDate]}>{item.date}</Text>
          <View style={[styles.tableMethodCell, styles.colMethod]}>
<<<<<<< HEAD
            <Ionicons name={item.methodIcon} size={13} color={COLORS.textSecondary} />
=======
            <Ionicons name={item.methodIcon} size={13} color={REST_COLORS.body} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
            <Text style={styles.tableCell}>{item.method}</Text>
          </View>
          <Text style={[styles.tableCell, styles.colAmount, styles.withdrawalAmount]}>
            {item.amount}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
<<<<<<< HEAD
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  // Restaurant header
  restaurantHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  restaurantIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  restaurantName: { flex: 1, fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  bellButton: { padding: 4 },

  // Balance card
  balanceCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
=======
  root: { flex: 1, backgroundColor: REST_COLORS.page },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },

  // Balance card — the hero of this screen
  balanceCard: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    padding: 24, marginBottom: REST_SPACING.gap,
    borderWidth: 1, borderColor: REST_COLORS.border,
    alignItems: 'center',
    ...REST_SHADOWS.card,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },
  balanceLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 6,
  },
  balanceLabel: {
<<<<<<< HEAD
    fontFamily: FONTS.bodySemiBold, fontSize: 10,
    color: COLORS.textMuted, letterSpacing: 1,
  },
  balanceAmount: {
    fontFamily: FONTS.bold, fontSize: 40,
    color: COLORS.textPrimary, marginBottom: 20,
  },
  balanceTabRow: {
    flexDirection: 'row', gap: 10,
    backgroundColor: COLORS.background,
    borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: COLORS.border,
=======
    fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.body,
  },
  balanceAmount: {
    fontFamily: REST_FONTS.extraBold, fontSize: 44,
    color: REST_COLORS.ink, marginBottom: 20,
  },
  balanceTabRow: {
    flexDirection: 'row', gap: 10,
    backgroundColor: REST_COLORS.surfaceSoft,
    borderRadius: REST_RADII.chip, padding: 4,
    borderWidth: 1, borderColor: REST_COLORS.border,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    alignSelf: 'stretch',
  },
  balanceTab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
  },
<<<<<<< HEAD
  balanceTabActive: { backgroundColor: COLORS.greenDark },
  balanceTabText: {
    fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.textSecondary,
  },
  balanceTabTextActive: { color: '#FFFFFF' },

  // Shared card
  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
=======
  balanceTabActive: { backgroundColor: REST_COLORS.primary },
  balanceTabText: {
    fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.body,
  },
  balanceTabTextActive: { color: REST_COLORS.white },
  withdrawPanel: { marginTop: 14, alignItems: 'center', alignSelf: 'stretch' },
  withdrawPanelText: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.muted, marginBottom: 10 },
  withdrawRequestBtn: {
    backgroundColor: REST_COLORS.primary, borderRadius: 12,
    paddingVertical: 12, alignSelf: 'stretch', alignItems: 'center',
  },
  withdrawRequestBtnDisabled: { opacity: 0.5 },
  withdrawRequestBtnText: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.white },

  // Shared quiet secondary card
  card: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    padding: 16, marginBottom: REST_SPACING.gap,
    borderWidth: 1, borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },

  // Market rates
  marketHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  marketTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updatedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
<<<<<<< HEAD
    backgroundColor: COLORS.background,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  updatedText: {
    fontFamily: FONTS.bodyMedium, fontSize: 9,
    color: COLORS.textMuted, letterSpacing: 0.5,
=======
    backgroundColor: REST_COLORS.surfaceSoft,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: REST_COLORS.border,
  },
  updatedText: {
    fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },
  gradesRow: { flexDirection: 'row' },
  gradeCell: { flex: 1, paddingRight: 12 },
  gradeCellRight: {
    paddingRight: 0, paddingLeft: 12,
<<<<<<< HEAD
    borderLeftWidth: 1, borderLeftColor: COLORS.border,
  },
  gradeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  gradeDot: { width: 8, height: 8, borderRadius: 4 },
  gradeLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.textSecondary },
  gradeRateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1, marginBottom: 4 },
  gradeRate: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.textPrimary },
  gradeUnit: {
    fontFamily: FONTS.bodyMedium, fontSize: 12,
    color: COLORS.textMuted, marginBottom: 3,
  },
  gradeChange: { fontFamily: FONTS.bodyRegular, fontSize: 11, color: COLORS.textMuted },
  gradeChangePositive: { color: COLORS.positive },
  gradeChangeNegative: { color: COLORS.negative },
=======
    borderLeftWidth: 1, borderLeftColor: REST_COLORS.border,
  },
  gradeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  gradeDot: { width: 8, height: 8, borderRadius: 4 },
  gradeLabel: { fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.body },
  gradeRateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1, marginBottom: 4 },
  gradeRate: { fontFamily: REST_FONTS.bold, fontSize: 22, color: REST_COLORS.ink },
  gradeUnit: {
    fontFamily: REST_FONTS.medium, fontSize: 12,
    color: REST_COLORS.muted, marginBottom: 3,
  },
  gradeChange: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },
  gradeChangePositive: { color: REST_COLORS.positive },
  gradeChangeNegative: { color: REST_COLORS.negative },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  // Avg quality
  avgQualityLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 10,
  },
  avgQualityLabel: {
<<<<<<< HEAD
    fontFamily: FONTS.bodySemiBold, fontSize: 10,
    color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
=======
    fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.muted,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },
  highGradeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
<<<<<<< HEAD
    backgroundColor: COLORS.greenLight,
=======
    backgroundColor: REST_COLORS.paleGreen,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 10,
  },
  highGradeText: {
<<<<<<< HEAD
    fontFamily: FONTS.bodySemiBold, fontSize: 12,
    color: COLORS.green, letterSpacing: 0.5,
  },
  avgQualityDesc: {
    fontFamily: FONTS.bodyRegular, fontSize: 13,
    color: COLORS.textSecondary, lineHeight: 19,
  },

  // Shared section wrapper (no card bg — content has its own rows)
  section: { marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.textPrimary },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAll: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.green },
=======
    fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.primary,
  },
  avgQualityDesc: {
    fontFamily: REST_FONTS.medium, fontSize: 13,
    color: REST_COLORS.body, lineHeight: 19,
  },

  // Shared section wrapper
  section: { marginBottom: REST_SPACING.gap },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontFamily: REST_FONTS.bold, fontSize: 16, color: REST_COLORS.ink },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  // Earning rows
  earningRow: {
    flexDirection: 'row', alignItems: 'center',
<<<<<<< HEAD
    backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14,
    marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  earningIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  earningText: { flex: 1 },
  earningTitle: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textPrimary, marginBottom: 2 },
  earningDate: { fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  earningDetail: { fontFamily: FONTS.bodyRegular, fontSize: 11, color: COLORS.textMuted },
  earningRight: { alignItems: 'flex-end' },
  earningAmount: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.positive, marginBottom: 2 },
  earningAmountDetail: { fontFamily: FONTS.bodyRegular, fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
=======
    backgroundColor: REST_COLORS.card,
    borderRadius: 14, padding: 14,
    marginBottom: 8,
    borderWidth: 1, borderColor: REST_COLORS.border,
  },
  earningIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: REST_COLORS.paleGreen,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  earningText: { flex: 1 },
  earningTitle: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.ink, marginBottom: 2 },
  earningDate: { fontFamily: REST_FONTS.semiBold, color: REST_COLORS.ink },
  earningDetail: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },
  earningRight: { alignItems: 'flex-end' },
  earningAmount: { fontFamily: REST_FONTS.bold, fontSize: 15, color: REST_COLORS.positive, marginBottom: 2 },
  earningAmountDetail: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted, textAlign: 'right' },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  // Withdrawal history table
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
<<<<<<< HEAD
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontFamily: FONTS.bodySemiBold, fontSize: 10,
    color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
=======
    borderBottomWidth: 1, borderBottomColor: REST_COLORS.border,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.muted,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
<<<<<<< HEAD
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tableCell: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textPrimary },
  tableMethodCell: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  withdrawalAmount: { fontFamily: FONTS.bodySemiBold, color: COLORS.negative, textAlign: 'right' },
  colDate:   { flex: 2.2 },
  colMethod: { flex: 2.2 },
  colAmount: { flex: 1.5, textAlign: 'right' },
});
=======
    borderBottomWidth: 1, borderBottomColor: REST_COLORS.divider,
  },
  tableCell: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.ink },
  tableMethodCell: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  withdrawalAmount: { fontFamily: REST_FONTS.semiBold, color: REST_COLORS.negative, textAlign: 'right' },
  colDate:   { flex: 2.2 },
  colMethod: { flex: 2.2 },
  colAmount: { flex: 1.5, textAlign: 'right' },
});
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
