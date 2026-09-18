import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
  formatRelativeTime,
  getInitials,
  mapTankCardData,
} from '../../src/utils/restaurantViewModels';
import MoneyPop, { parseAmountFromAlert } from '../../src/components/MoneyPop';

// ─── HOME DISPLAY MAPPERS ───────────────────────────────────────────────────────

const ACTIVE_COLLECTION_STATUSES = [
  'pending',
  'assigned',
  'scheduled',
  'in_transit',
  'arrival',
  'in_progress',
  'collected',
  'arrived_manufacturer',
];

function mapCollectionStatus(pickups = []) {
  const pickup =
    pickups.find((item) => ACTIVE_COLLECTION_STATUSES.includes(item.status)) ??
    pickups[0] ??
    null;

  if (!pickup) {
    return {
      title: 'Your tank is being monitored.',
      detail: 'Collection requests and updates will appear in Pickups.',
      icon: 'pulse-outline',
      tone: 'neutral',
    };
  }

  const driverName = pickup.collectors?.full_name ?? null;

  switch (pickup.status) {
    case 'pending':
    case 'assigned':
    case 'scheduled':
      return driverName
        ? {
            title: 'Driver assigned.',
            detail: `${driverName} is assigned to this collection.`,
            icon: 'person-circle-outline',
            tone: 'active',
          }
        : {
            title: "We're arranging your pickup.",
            detail: 'Your request is recorded. Driver details will appear once assigned.',
            icon: 'calendar-outline',
            tone: 'active',
          };
    case 'in_transit':
      return {
        title: 'Driver on the way.',
        detail: driverName
          ? `${driverName} is travelling to your restaurant.`
          : 'The assigned driver is in transit.',
        icon: 'car-outline',
        tone: 'active',
      };
    case 'arrival':
      return {
        title: 'Driver has arrived.',
        detail: driverName
          ? `${driverName} has arrived for the collection.`
          : 'The driver has arrived for the collection.',
        icon: 'location-outline',
        tone: 'active',
      };
    case 'in_progress':
      return {
        title: 'Collection in progress.',
        detail: 'The collection is currently being recorded.',
        icon: 'sync-outline',
        tone: 'active',
      };
    case 'collected':
      return {
        title: 'Oil collected.',
        detail: 'The collection is on its way to the manufacturer.',
        icon: 'checkmark-circle-outline',
        tone: 'active',
      };
    case 'arrived_manufacturer':
      return {
        title: 'Oil arrived at the manufacturer.',
        detail: 'The delivery is awaiting its recorded completion state.',
        icon: 'business-outline',
        tone: 'active',
      };
    case 'completed':
      return {
        title: 'Collection completed.',
        detail: 'The latest collection is recorded as complete.',
        icon: 'checkmark-done-circle-outline',
        tone: 'complete',
      };
    case 'cancelled':
      return {
        title: 'Pickup cancelled.',
        detail: 'There is no active collection for this request.',
        icon: 'close-circle-outline',
        tone: 'cancelled',
      };
    default:
      return {
        title: 'Your tank is being monitored.',
        detail: 'Open Pickups to see the latest recorded collection details.',
        icon: 'pulse-outline',
        tone: 'neutral',
      };
  }
}

function mapHomeTankData(tank) {
  const mapped = mapTankCardData(tank);
  if (!mapped) return null;

  const rawFillPercent = Number(tank?.fill_percent);
  const hasFillPercent =
    tank?.fill_percent !== null &&
    tank?.fill_percent !== undefined &&
    Number.isFinite(rawFillPercent);
  const fillPercent = hasFillPercent ? mapped.fillPercent : null;

  let statusText = tank?.status_text ?? null;
  if (!statusText && fillPercent != null) {
    statusText = fillPercent >= 85 ? 'Pickup threshold reached' : 'Tank is being monitored';
  }

  return {
    ...mapped,
    fillPercent,
    statusText: statusText ?? 'Tank status unavailable',
    lastUpdatedLabel: tank?.last_updated ? formatRelativeTime(tank.last_updated) : null,
  };
}

function mapEarningsSummary(earnings = []) {
  const amounts = earnings
    .map((earning) => earning?.amount)
    .filter((amount) => amount !== null && amount !== undefined && amount !== '')
    .map((amount) => Number(amount))
    .filter((amount) => Number.isFinite(amount));

  if (amounts.length === 0) {
    return {
      amount: '—',
      detail: 'No recorded earnings yet. Payment status appears in Earnings.',
    };
  }

  return {
    amount: formatCurrency(amounts.reduce((sum, amount) => sum + amount, 0)),
    detail: 'Not an estimate or proof of payment. See Earnings for payment status.',
  };
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function RestaurantHomeScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const {
    tank,
    earnings,
    pickups,
    loading,
    refreshing,
    refreshRestaurant,
    restaurant,
    alerts = [],
    markAlertRead,
  } = useRestaurant();

  const profileInitials = useMemo(
    () => getInitials(profile?.full_name ?? restaurant?.name, 'RS'),
    [profile?.full_name, restaurant?.name]
  );

  const profileImageUrl = restaurant?.profile_image_url ?? profile?.profile_image_url;

  const tankData = useMemo(() => mapHomeTankData(tank), [tank]);
  const collectionStatus = useMemo(() => mapCollectionStatus(pickups), [pickups]);
  const earningsSummary = useMemo(() => mapEarningsSummary(earnings), [earnings]);
  // "You've been paid" moment: newest unread payout alert written by the DB
  // (earnings_auto_payout). Dismiss = mark read, so it shows once.
  const payoutAlert = useMemo(
    () =>
      (alerts || [])
        .filter((a) => !a.is_read && /payout/i.test(`${a?.title ?? ''}`))
        .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))[0] ?? null,
    [alerts]
  );

  return (
    <View style={styles.root}>
      <RestaurantHeader
        variant="home"
        avatarInitials={profileInitials}
        avatarUrl={profileImageUrl}
        isVerified={restaurant?.is_verified}
        onAvatarPress={() => navigation.getParent()?.navigate('Profile')}
      />

      <RestaurantRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshRestaurant}
      >
        {loading && !tankData ? <RestaurantLoadingBanner /> : null}
        {!loading && !restaurant ? (
          <RestaurantEmptyBanner message="No restaurant profile linked to this account yet." />
        ) : null}

        {restaurant ? (
          <>
            <SectionLabel>Collection status</SectionLabel>
            <CollectionStatusCard
              status={collectionStatus}
              onPress={() => navigation.navigate('Pickups')}
            />

            <SectionLabel>Oil tank</SectionLabel>
            {tankData ? (
              <TankCard
                data={tankData}
                onPress={() => navigation.getParent()?.navigate('Monitoring')}
              />
            ) : (
              <RestaurantEmptyBanner message="No oil tank is connected to this restaurant yet." />
            )}

            <SectionLabel>Earnings</SectionLabel>
            <EarningsSummaryCard
              summary={earningsSummary}
              onPress={() => navigation.navigate('Earnings')}
            />
          </>
        ) : null}
        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
      <MoneyPop
        visible={!!payoutAlert}
        amount={parseAmountFromAlert(payoutAlert)}
        title="You have been paid"
        subtitle="Your share of the last pickup was paid out instantly."
        ctaLabel="Great"
        onDismiss={() => payoutAlert && markAlertRead?.(payoutAlert.id)}
      />
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const RING_SIZE = 156;
const RING_STROKE = 13;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function TankRing({ fillPercent, lastDistanceCm }) {
  const hasFillPercent = Number.isFinite(fillPercent);
  const clamped = hasFillPercent ? Math.min(100, Math.max(0, fillPercent)) : null;
  const dashOffset = hasFillPercent
    ? RING_CIRCUMFERENCE * (1 - clamped / 100)
    : RING_CIRCUMFERENCE;

  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={REST_COLORS.accent}
          strokeOpacity={0.35}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {hasFillPercent ? (
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={REST_COLORS.primary}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            fill="none"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPercent}>
          {lastDistanceCm != null ? `${lastDistanceCm} cm` : '— cm'}
        </Text>
        <Text style={styles.ringCaption}>Sensor reading</Text>
      </View>
    </View>
  );
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function CollectionStatusCard({ status, onPress }) {
  const isCancelled = status.tone === 'cancelled';
  const iconColor = isCancelled ? REST_COLORS.alertText : REST_COLORS.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open pickups"
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        isCancelled && styles.summaryCardCancelled,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.summaryIcon, isCancelled && styles.summaryIconCancelled]}>
        <Ionicons name={status.icon} size={22} color={iconColor} />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryTitle}>{status.title}</Text>
        <Text style={styles.summaryDetail}>{status.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={REST_COLORS.muted} />
    </Pressable>
  );
}

function TankCard({ data, onPress }) {
  const hasFillPercent = data.fillPercent != null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open tank monitoring"
      onPress={onPress}
      style={({ pressed }) => [styles.tankCard, pressed && styles.cardPressed]}
    >
      <View style={styles.tankHeaderRow}>
        <Text style={styles.tankLabel}>{data.label}</Text>
        <View style={styles.capacityBadge}>
          <Text style={styles.capacityBadgeText}>
            {hasFillPercent ? `${Math.round(data.fillPercent)}% capacity` : 'Capacity unavailable'}
          </Text>
        </View>
      </View>

      <TankRing
        fillPercent={data.fillPercent}
        lastDistanceCm={data.lastDistanceCm}
      />

      <Text style={styles.tankStatus}>{data.statusText}</Text>
      <Text style={styles.sensorUpdated}>
        {data.lastUpdatedLabel
          ? `Sensor updated ${data.lastUpdatedLabel}`
          : 'Sensor update time unavailable'}
      </Text>

      <View style={styles.openMonitoringRow}>
        <Text style={styles.openMonitoringText}>View monitoring</Text>
        <Ionicons name="arrow-forward" size={15} color={REST_COLORS.primary} />
      </View>
    </Pressable>
  );
}

function EarningsSummaryCard({ summary, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open earnings"
      onPress={onPress}
      style={({ pressed }) => [styles.earningsCard, pressed && styles.cardPressed]}
    >
      <View style={styles.earningsIcon}>
        <Ionicons name="cash-outline" size={22} color={REST_COLORS.primary} />
      </View>
      <View style={styles.earningsText}>
        <Text style={styles.earningsLabel}>Recorded earnings</Text>
        <Text style={styles.earningsAmount}>{summary.amount}</Text>
        <Text style={styles.earningsDetail}>{summary.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={REST_COLORS.muted} />
    </Pressable>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },

  sectionLabel: {
    fontFamily: REST_FONTS.bold,
    fontSize: 15,
    color: REST_COLORS.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  cardPressed: { opacity: 0.94 },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.card,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },
  summaryCardCancelled: {
    backgroundColor: REST_COLORS.alertBg,
    borderColor: REST_COLORS.alertBorder,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: REST_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconCancelled: { backgroundColor: REST_COLORS.alertBg },
  summaryText: { flex: 1 },
  summaryTitle: {
    fontFamily: REST_FONTS.bold,
    fontSize: 16,
    color: REST_COLORS.ink,
    marginBottom: 3,
  },
  summaryDetail: {
    fontFamily: REST_FONTS.medium,
    fontSize: 12,
    lineHeight: 18,
    color: REST_COLORS.body,
  },

  tankCard: {
    backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.card,
    padding: REST_SPACING.cardPadding,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    alignItems: 'center',
    ...REST_SHADOWS.card,
  },
  tankHeaderRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  tankLabel: {
    flex: 1,
    fontFamily: REST_FONTS.bold,
    fontSize: 15,
    color: REST_COLORS.ink,
  },
  capacityBadge: {
    backgroundColor: REST_COLORS.paleGreen,
    borderRadius: REST_RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  capacityBadgeText: {
    fontFamily: REST_FONTS.semiBold,
    fontSize: 11,
    color: REST_COLORS.primary,
  },
  ringWrap: { justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPercent: {
    fontFamily: REST_FONTS.extraBold,
    fontSize: 34,
    color: REST_COLORS.ink,
  },
  ringCaption: {
    fontFamily: REST_FONTS.medium,
    fontSize: 12,
    color: REST_COLORS.body,
    marginTop: -2,
  },
  tankStatus: {
    fontFamily: REST_FONTS.bold,
    fontSize: 18,
    color: REST_COLORS.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  sensorUpdated: {
    fontFamily: REST_FONTS.medium,
    fontSize: 12,
    color: REST_COLORS.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  openMonitoringRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: REST_COLORS.divider,
    paddingTop: 14,
  },
  openMonitoringText: {
    fontFamily: REST_FONTS.semiBold,
    fontSize: 13,
    color: REST_COLORS.primary,
  },

  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.card,
    padding: 16,
    marginBottom: REST_SPACING.gap,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },
  earningsIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: REST_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsText: { flex: 1 },
  earningsLabel: {
    fontFamily: REST_FONTS.medium,
    fontSize: 12,
    color: REST_COLORS.body,
    marginBottom: 2,
  },
  earningsAmount: {
    fontFamily: REST_FONTS.extraBold,
    fontSize: 24,
    color: REST_COLORS.ink,
    marginBottom: 2,
  },
  earningsDetail: {
    fontFamily: REST_FONTS.medium,
    fontSize: 11,
    lineHeight: 16,
    color: REST_COLORS.muted,
  },
});
