// Devine-Devs/screens/driver/DriverHomeScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import DriverHeader, { getDriverInitials } from '../../src/driver/components/DriverHeader';
import DriverStatusBadge from '../../src/driver/components/DriverStatusBadge';
import {
  DriverEmptyBanner,
  DriverLoadingBanner,
  DriverRefreshScrollView,
} from '../../src/components/DriverScreenStates';
import {
  DRV_COLORS,
  DRV_FONTS,
  DRV_RADII,
  DRV_SHADOWS,
  DRV_SPACING,
  DRV_STATUS,
} from '../../src/driver/driverTheme';

const PickupCard = ({ item, onPress }) => {
  // Same `|| pending` fallback as DriverStatusBadge — the DB can return a status
  // that is not a key in DRV_STATUS, and this renders inside a .map().
  const accent = (DRV_STATUS[item.status] || DRV_STATUS.pending).fg;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.pickupCard,
        { borderLeftColor: accent },
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <View style={styles.pickupIcon}>
        <Ionicons name="storefront-outline" size={20} color={DRV_COLORS.primary} />
      </View>
      <View style={styles.pickupInfo}>
        <Text style={styles.pickupName}>{item.name}</Text>
        <Text style={styles.pickupAddress}>{item.address}</Text>
        <Text style={styles.pickupTime}>{item.time} · {item.estimatedLiters}L est.</Text>
      </View>
      <View style={styles.pickupRight}>
        <DriverStatusBadge status={item.status} />
        <Ionicons name="chevron-forward" size={16} color={DRV_COLORS.muted} style={{ marginTop: 6 }} />
      </View>
    </Pressable>
  );
};

export default function DriverHomeScreen({ navigation }) {
  const {
    collector,
    pickups = [],
    stats,
    wallet,
    earnings = [],
    loading,
    refreshing,
    refreshCollector,
    toggleDutyStatus,
    requestWithdrawal,
  } = useCollectorContext();
  const completedStops = (pickups || []).filter((pickup) => pickup.status === 'completed').length;
  const totalStops = (pickups || []).length;
  const totalLiters = stats?.total_liters ?? collector?.total_liters ?? 0;
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const unpaidEarnings = earnings
    .filter((row) => !row.withdrawal_id)
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  const onDuty = !!collector?.is_on_duty;
  const withdrawDisabled = requestingWithdrawal || unpaidEarnings <= 0;
  // Not selected by getCollectorStats today, so it is usually undefined. Show the
  // figure only when the backend actually supplies one rather than "+—%".
  const weeklyChange = stats?.weeklyChange;

  const handleToggleDuty = async (value) => {
    setTogglingDuty(true);
    try {
      await toggleDutyStatus(value);
    } catch (err) {
      Alert.alert('Could not update status', err.message ?? 'Please try again.');
    } finally {
      setTogglingDuty(false);
    }
  };

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

  const todayPickups = (pickups || []).slice(0, 3).map(p => ({
    id: p.id,
    name: p.restaurants?.name ?? 'Unknown',
    address: p.restaurants?.address ?? '',
    time: p.pickup_time_start || '',
    estimatedLiters: p.estimated_volume_liters ?? p.actual_volume_liters ?? 0,
    status: p.status ?? 'pending',
  }));

  return (
    <View style={styles.container}>
      <DriverHeader
        variant="home"
        avatarInitials={getDriverInitials(collector?.full_name)}
      />

      <DriverRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshCollector}
      >
        {loading && pickups.length === 0 ? <DriverLoadingBanner /> : null}

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Good day,</Text>
          <Text style={styles.welcomeName}>{collector?.full_name ?? 'Driver'}</Text>
          <Text style={styles.welcomeRoute}>{stats?.route_name ?? collector?.route_name ?? ''} · {stats?.district ?? collector?.district ?? ''}</Text>
        </View>

        {/* On-duty toggle — the most consequential control on the screen */}
        <View style={styles.dutyCard}>
          <View style={styles.dutyLeft}>
            <View
              style={[
                styles.dutyDot,
                { backgroundColor: onDuty ? DRV_COLORS.primary : DRV_COLORS.muted },
              ]}
            />
            <View style={styles.dutyText}>
              <Text style={styles.dutyLabel}>{onDuty ? 'On duty' : 'Off duty'}</Text>
              <Text style={styles.dutySub}>{onDuty ? 'You can be assigned pickups' : 'Turn on to receive assignments'}</Text>
            </View>
          </View>
          <Switch
            value={!!collector?.is_on_duty}
            onValueChange={handleToggleDuty}
            disabled={togglingDuty}
            trackColor={{ true: DRV_COLORS.primary, false: DRV_COLORS.border }}
          />
        </View>

        {/* Earnings */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Wallet balance</Text>
          <Text style={styles.walletValue}>R {Number(wallet?.balance ?? 0).toFixed(2)}</Text>
          <Text style={styles.walletSub}>R {unpaidEarnings.toFixed(2)} unpaid</Text>
          <Pressable
            style={({ pressed }) => [
              styles.withdrawBtn,
              withdrawDisabled && styles.withdrawBtnDisabled,
              pressed && !withdrawDisabled && { opacity: 0.85 },
            ]}
            onPress={handleRequestWithdrawal}
            disabled={withdrawDisabled}
          >
            <Text style={[styles.withdrawBtnText, withdrawDisabled && styles.withdrawBtnTextDisabled]}>
              {requestingWithdrawal ? 'Requesting…' : 'Request withdrawal'}
            </Text>
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="water-outline" size={22} color={DRV_COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{totalLiters} L</Text>
            <Text style={styles.statLabel}>Collected today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="location-outline" size={22} color={DRV_COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{completedStops}/{totalStops}</Text>
            <Text style={styles.statLabel}>Stops remaining</Text>
          </View>
        </View>

        {/* Weekly Card */}
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyLeft}>
            <View style={styles.weeklyIconWrap}>
              <Ionicons name="bar-chart-outline" size={20} color={DRV_COLORS.primary} />
            </View>
            <View>
              <Text style={styles.weeklyTitle}>Weekly total</Text>
              <Text style={styles.weeklySub}>{totalLiters}L · {totalStops} stops</Text>
            </View>
          </View>
          {weeklyChange != null ? (
            <Text style={styles.weeklyChange}>+{weeklyChange}%</Text>
          ) : null}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's pickups</Text>
          <Text style={styles.sectionCount}>{(pickups || []).length} scheduled</Text>
        </View>

        {/* Pickup Cards */}
        {todayPickups.map(item => (
          <PickupCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('DriverCollections')}
          />
        ))}

        {!loading && todayPickups.length === 0 ? <DriverEmptyBanner /> : null}

        {/* View All Button */}
        <Pressable
          style={({ pressed }) => [styles.viewAllBtn, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('DriverCollections')}
        >
          <Text style={styles.viewAllText}>View all pickups</Text>
          <Ionicons name="arrow-forward-outline" size={16} color={DRV_COLORS.white} />
        </Pressable>

        <View style={{ height: 30 }} />
      </DriverRefreshScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DRV_COLORS.page,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DRV_SPACING.screenPadding,
  },

  welcomeSection: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: DRV_COLORS.body,
    fontFamily: DRV_FONTS.medium,
  },
  welcomeName: {
    fontSize: 28,
    color: DRV_COLORS.ink,
    marginTop: 4,
    fontFamily: DRV_FONTS.extraBold,
  },
  welcomeRoute: {
    fontSize: 14,
    color: DRV_COLORS.body,
    marginTop: 4,
    fontFamily: DRV_FONTS.medium,
  },

  // Duty toggle — first card below the header, and the heaviest thing above the fold.
  dutyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: DRV_SPACING.gap,
    backgroundColor: DRV_COLORS.card,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: DRV_SPACING.cardPadding,
    ...DRV_SHADOWS.card,
  },
  dutyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dutyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dutyText: { flex: 1 },
  dutyLabel: { fontFamily: DRV_FONTS.bold, fontSize: 16, color: DRV_COLORS.ink },
  dutySub: { fontFamily: DRV_FONTS.medium, fontSize: 12, color: DRV_COLORS.body, marginTop: 2 },

  // Wallet — the hero card.
  walletCard: {
    marginTop: DRV_SPACING.gap,
    backgroundColor: DRV_COLORS.card,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: DRV_SPACING.cardPadding,
    ...DRV_SHADOWS.card,
  },
  walletLabel: { fontFamily: DRV_FONTS.medium, fontSize: 13, color: DRV_COLORS.body },
  walletValue: {
    fontFamily: DRV_FONTS.extraBold,
    fontSize: 32,
    color: DRV_COLORS.ink,
    marginTop: 4,
  },
  walletSub: { fontFamily: DRV_FONTS.medium, fontSize: 12, color: DRV_COLORS.body, marginTop: 2 },
  withdrawBtn: {
    marginTop: 16,
    backgroundColor: DRV_COLORS.primary,
    borderRadius: DRV_RADII.pill,
    paddingVertical: 13,
    alignItems: 'center',
    ...DRV_SHADOWS.button,
  },
  withdrawBtnDisabled: {
    backgroundColor: DRV_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  withdrawBtnText: { fontFamily: DRV_FONTS.bold, fontSize: 14, color: DRV_COLORS.white },
  withdrawBtnTextDisabled: { color: DRV_COLORS.muted },

  statsRow: {
    flexDirection: 'row',
    paddingTop: DRV_SPACING.gap,
    gap: DRV_SPACING.gap,
  },
  statCard: {
    flex: 1,
    backgroundColor: DRV_COLORS.card,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: 16,
    alignItems: 'center',
    ...DRV_SHADOWS.card,
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: DRV_FONTS.extraBold,
    fontSize: 22,
    color: DRV_COLORS.ink,
  },
  statLabel: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.body,
    marginTop: 4,
  },

  weeklyCard: {
    marginTop: DRV_SPACING.gap,
    backgroundColor: DRV_COLORS.card,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...DRV_SHADOWS.card,
  },
  weeklyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyTitle: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 14,
    color: DRV_COLORS.ink,
  },
  weeklySub: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.body,
    marginTop: 2,
  },
  weeklyChange: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 16,
    color: DRV_COLORS.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: DRV_SPACING.gap,
  },
  sectionTitle: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 18,
    color: DRV_COLORS.ink,
  },
  sectionCount: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 13,
    color: DRV_COLORS.muted,
  },

  pickupCard: {
    backgroundColor: DRV_COLORS.card,
    marginBottom: 10,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    ...DRV_SHADOWS.card,
  },
  pickupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickupInfo: {
    flex: 1,
  },
  pickupName: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 15,
    color: DRV_COLORS.ink,
  },
  pickupAddress: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.body,
    marginTop: 2,
  },
  pickupTime: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.muted,
    marginTop: 2,
  },
  pickupRight: {
    alignItems: 'flex-end',
  },

  viewAllBtn: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: DRV_COLORS.primary,
    borderRadius: DRV_RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    ...DRV_SHADOWS.button,
  },
  viewAllText: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 14,
    color: DRV_COLORS.white,
  },
});
