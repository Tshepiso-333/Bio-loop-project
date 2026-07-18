import React, { useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  } = useRestaurant();

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
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function BalanceCard({ balance, activeTab, onTabSelect }) {
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
          onPress={() => onTabSelect('withdraw')}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={14}
            color={activeTab === 'withdraw' ? REST_COLORS.white : REST_COLORS.body}
          />
          <Text style={[styles.balanceTabText, activeTab === 'withdraw' && styles.balanceTabTextActive]}>
            Withdraw
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.balanceTab,
            activeTab === 'history' && styles.balanceTabActive,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => onTabSelect('history')}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={activeTab === 'history' ? REST_COLORS.white : REST_COLORS.body}
          />
          <Text style={[styles.balanceTabText, activeTab === 'history' && styles.balanceTabTextActive]}>
            History
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MarketRatesCard({ rates }) {
  return (
    <View style={styles.card}>
      <View style={styles.marketHeaderRow}>
        <View style={styles.marketTitleRow}>
          <Ionicons name="trending-up-outline" size={15} color={REST_COLORS.ink} />
          <Text style={styles.sectionTitle}>Market Rates</Text>
        </View>
        <View style={styles.updatedBadge}>
          <Ionicons name="refresh-outline" size={10} color={REST_COLORS.muted} />
          <Text style={styles.updatedText}>{rates.updatedLabel}</Text>
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
        <Ionicons name="analytics-outline" size={13} color={REST_COLORS.muted} />
        <Text style={styles.avgQualityLabel}>Your avg quality</Text>
      </View>
      <View style={styles.highGradeBadge}>
        <Ionicons name="star" size={13} color={REST_COLORS.primary} />
        <Text style={styles.highGradeText}>{quality.badge}</Text>
      </View>
      <Text style={styles.avgQualityDesc}>{quality.description}</Text>
    </View>
  );
}

function RecentEarnings({ items }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="receipt-outline" size={16} color={REST_COLORS.ink} />
        <Text style={styles.sectionTitle}>Recent Earnings</Text>
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
      <View style={styles.earningIconWrap}>
        <MaterialCommunityIcons name="truck-outline" size={20} color={REST_COLORS.primary} />
      </View>

      <View style={styles.earningText}>
        <Text style={styles.earningTitle}>
          <Text style={styles.earningDate}>{item.date} </Text>
          {item.title}
        </Text>
        <Text style={styles.earningDetail}>{item.detail}</Text>
      </View>

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
        <Ionicons name="swap-vertical-outline" size={16} color={REST_COLORS.ink} />
        <Text style={styles.sectionTitle}>Withdrawal History</Text>
      </View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
        <Text style={[styles.tableHeaderCell, styles.colMethod]}>Method</Text>
        <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.colDate]}>{item.date}</Text>
          <View style={[styles.tableMethodCell, styles.colMethod]}>
            <Ionicons name={item.methodIcon} size={13} color={REST_COLORS.body} />
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
  },
  balanceLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 6,
  },
  balanceLabel: {
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
    alignSelf: 'stretch',
  },
  balanceTab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
  },
  balanceTabActive: { backgroundColor: REST_COLORS.primary },
  balanceTabText: {
    fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.body,
  },
  balanceTabTextActive: { color: REST_COLORS.white },

  // Shared quiet secondary card
  card: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    padding: 16, marginBottom: REST_SPACING.gap,
    borderWidth: 1, borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },

  // Market rates
  marketHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  marketTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updatedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: REST_COLORS.surfaceSoft,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: REST_COLORS.border,
  },
  updatedText: {
    fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted,
  },
  gradesRow: { flexDirection: 'row' },
  gradeCell: { flex: 1, paddingRight: 12 },
  gradeCellRight: {
    paddingRight: 0, paddingLeft: 12,
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

  // Avg quality
  avgQualityLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 10,
  },
  avgQualityLabel: {
    fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.muted,
  },
  highGradeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: REST_COLORS.paleGreen,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 10,
  },
  highGradeText: {
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

  // Earning rows
  earningRow: {
    flexDirection: 'row', alignItems: 'center',
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

  // Withdrawal history table
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: REST_COLORS.border,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.muted,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: REST_COLORS.divider,
  },
  tableCell: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.ink },
  tableMethodCell: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  withdrawalAmount: { fontFamily: REST_FONTS.semiBold, color: REST_COLORS.negative, textAlign: 'right' },
  colDate:   { flex: 2.2 },
  colMethod: { flex: 2.2 },
  colAmount: { flex: 1.5, textAlign: 'right' },
});
