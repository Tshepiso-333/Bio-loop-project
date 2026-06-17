import React, { useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../src/hooks/useProfile';
import { useRestaurant } from '../../src/hooks/useRestaurant';
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

// ─── THEME COLOURS (matching manufacturer) ───────────────────────────────────

const COLORS = {
  background: '#F4F4EF',
  card: '#FFFFFF',
  green: '#10b981',
  greenLight: '#D1FAE5',
  greenDark: '#059669',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  tabActive: '#10b981',
  tabInactive: '#94A3B8',
  amber: '#F59E0B',
  positive: '#10b981',
  negative: '#DC2626',
};

const FONTS = {
  bold: 'Poppins_700Bold',
  semiBold: 'Poppins_600SemiBold',
  medium: 'Poppins_500Medium',
  regular: 'Poppins_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyRegular: 'Inter_400Regular',
};

function Icon({ library = 'Ionicons', name, size, color }) {
  if (library === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
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

  // Header Component with Notifications and Profile
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />
      <LinearGradient
        colors={[COLORS.green, COLORS.greenDark, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              <View style={styles.notificationDot} />
            </Pressable>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{profileInitials}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.root}>
      <Header />

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
        <Ionicons name="wallet-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.balanceLabel}>{balance.label.toUpperCase()}</Text>
      </View>

      <Text style={styles.balanceAmount}>{balance.amount}</Text>

      <View style={styles.balanceTabRow}>
        <Pressable
          style={[styles.balanceTab, activeTab === 'withdraw' && styles.balanceTabActive]}
          onPress={() => onTabSelect('withdraw')}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={14}
            color={activeTab === 'withdraw' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.balanceTabText, activeTab === 'withdraw' && styles.balanceTabTextActive]}>
            Withdraw
          </Text>
        </Pressable>

        <Pressable
          style={[styles.balanceTab, activeTab === 'history' && styles.balanceTabHistoryActive]}
          onPress={() => onTabSelect('history')}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={activeTab === 'history' ? '#FFFFFF' : COLORS.textSecondary}
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
          <Ionicons name="trending-up-outline" size={15} color={COLORS.textPrimary} />
          <Text style={styles.sectionTitle}>Market Rates</Text>
        </View>
        <View style={styles.updatedBadge}>
          <Ionicons name="refresh-outline" size={10} color={COLORS.textMuted} />
          <Text style={styles.updatedText}>{rates.updatedLabel.toUpperCase()}</Text>
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
        <Ionicons name="analytics-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.avgQualityLabel}>Your Avg Quality</Text>
      </View>
      <View style={styles.highGradeBadge}>
        <Ionicons name="star" size={13} color={COLORS.green} />
        <Text style={styles.highGradeText}>{quality.badge.toUpperCase()}</Text>
      </View>
      <Text style={styles.avgQualityDesc}>{quality.description}</Text>
    </View>
  );
}

function RecentEarnings({ items }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="receipt-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
        </View>
        <Pressable style={styles.viewAllRow}>
          <Text style={styles.viewAll}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color={COLORS.green} />
        </Pressable>
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
        <MaterialCommunityIcons name="truck-outline" size={20} color={COLORS.green} />
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
        <Ionicons name="swap-vertical-outline" size={16} color={COLORS.textPrimary} />
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
            <Ionicons name={item.methodIcon} size={13} color={COLORS.textSecondary} />
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
  root: { flex: 1, backgroundColor: COLORS.background },
  
  // Header Styles
  header: {
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Balance card
  balanceCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  balanceLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 6,
  },
  balanceLabel: {
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
    alignSelf: 'stretch',
  },
  balanceTab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
  },
  balanceTabActive: { backgroundColor: COLORS.greenDark },
  balanceTabHistoryActive: { backgroundColor: '#EA580C' }, // Orange for history tab
  balanceTabText: {
    fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.textSecondary,
  },
  balanceTabTextActive: { color: '#FFFFFF' },

  // Shared card
  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },

  // Market rates
  marketHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  marketTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updatedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  updatedText: {
    fontFamily: FONTS.bodyMedium, fontSize: 9,
    color: COLORS.textMuted, letterSpacing: 0.5,
  },
  gradesRow: { flexDirection: 'row' },
  gradeCell: { flex: 1, paddingRight: 12 },
  gradeCellRight: {
    paddingRight: 0, paddingLeft: 12,
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

  // Avg quality
  avgQualityLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 10,
  },
  avgQualityLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 10,
    color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  highGradeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 10,
  },
  highGradeText: {
    fontFamily: FONTS.bodySemiBold, fontSize: 12,
    color: COLORS.green, letterSpacing: 0.5,
  },
  avgQualityDesc: {
    fontFamily: FONTS.bodyRegular, fontSize: 13,
    color: COLORS.textSecondary, lineHeight: 19,
  },

  // Shared section wrapper
  section: { marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.textPrimary },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAll: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.green },

  // Earning rows
  earningRow: {
    flexDirection: 'row', alignItems: 'center',
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

  // Withdrawal history table
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontFamily: FONTS.bodySemiBold, fontSize: 10,
    color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tableCell: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textPrimary },
  tableMethodCell: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  withdrawalAmount: { fontFamily: FONTS.bodySemiBold, color: COLORS.negative, textAlign: 'right' },
  colDate:   { flex: 2.2 },
  colMethod: { flex: 2.2 },
  colAmount: { flex: 1.5, textAlign: 'right' },
});