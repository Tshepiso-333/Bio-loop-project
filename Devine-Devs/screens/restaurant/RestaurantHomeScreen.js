import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  getInitials,
  mapActivityItems,
  mapHomeStats,
  mapPickupAlert,
  mapTankCardData,
} from '../../src/utils/restaurantViewModels';

// ─── ICON HELPER ──────────────────────────────────────────────────────────────

function Icon({ library = 'Ionicons', name, size, color }) {
  if (library === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function RestaurantHomeScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const {
    tank,
    alerts,
    qualityLogs,
    earnings,
    pickups,
    activityLogs,
    loading,
    refreshing,
    refreshRestaurant,
    restaurant,
  } = useRestaurant();

  const profileInitials = useMemo(
    () => getInitials(profile?.full_name ?? restaurant?.name, 'RS'),
    [profile?.full_name, restaurant?.name]
  );

  const profileImageUrl = restaurant?.profile_image_url ?? profile?.profile_image_url;

  const tankData = useMemo(() => mapTankCardData(tank), [tank]);
  const pickupAlert = useMemo(() => mapPickupAlert(alerts, tank), [alerts, tank]);
  const stats = useMemo(
    () => mapHomeStats({ qualityLogs, earnings, pickups }),
    [qualityLogs, earnings, pickups]
  );
  const { items: recentActivity, icons: activityIcons } = useMemo(
    () => mapActivityItems(activityLogs),
    [activityLogs]
  );

  return (
    <View style={styles.root}>
      <RestaurantHeader
        variant="home"
        avatarInitials={profileInitials}
        avatarUrl={profileImageUrl}
        isVerified={restaurant?.is_verified}
        onAvatarPress={() => navigation.navigate('RestaurantTabs', { screen: 'Profile' })}
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

        {tankData ? <TankCard data={tankData} /> : null}
        {pickupAlert.visible ? (
          <PickupAlert
            alert={pickupAlert}
            urgent={(tankData?.fillPercent ?? 0) >= 80}
            onSchedule={() => navigation.navigate('SchedulePickup')}
          />
        ) : null}

        <View style={styles.statRow}>
          <StatCard label="Oil grade" value={stats.oilGrade} iconName="water" />
          <StatCard label="Est. earnings" value={stats.estimatedEarnings} iconName="cash-outline" />
          <StatCard
            label="Last pickup"
            value={stats.lastPickupDate}
            iconName="truck-outline"
            iconLibrary="MaterialCommunityIcons"
          />
        </View>

        {recentActivity.length > 0 ? (
          <RecentActivity
            items={recentActivity}
            icons={activityIcons}
            onViewAll={() => navigation.navigate('RestaurantTabs', { screen: 'Pickups' })}
          />
        ) : (
          <RestaurantEmptyBanner message="No recent activity yet." />
        )}
        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const RING_SIZE = 156;
const RING_STROKE = 13;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function TankRing({ fillPercent }) {
  const clamped = Math.min(100, Math.max(0, fillPercent));
  const dashOffset = RING_CIRCUMFERENCE * (1 - clamped / 100);

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
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPercent}>{fillPercent}%</Text>
        <Text style={styles.ringCaption}>Full</Text>
      </View>
    </View>
  );
}

function TankCard({ data }) {
  return (
    <View style={styles.card}>
      <Text style={styles.tankLabel}>{data.label}</Text>
      <TankRing fillPercent={data.fillPercent} />
      <Text style={styles.tankStatus}>{data.statusText}</Text>
      <Text style={styles.tankNote}>
        {data.statusNote}{' '}
        <Text style={styles.tankNoteBold}>{data.estimatedDays} days.</Text>
      </Text>
      <View style={styles.tankDivider} />
      <View style={styles.tankMetaRow}>
        <View style={styles.tankMetaItem}>
          <Text style={styles.tankMetaLabel}>Current volume</Text>
          <Text style={styles.tankMetaValue}>{data.currentVolume.toLocaleString()} Liters</Text>
        </View>
        <View style={styles.tankMetaItem}>
          <Text style={styles.tankMetaLabel}>Temperature</Text>
          <Text style={styles.tankMetaValue}>{data.temperature}°C</Text>
        </View>
      </View>
    </View>
  );
}

function PickupAlert({ alert, urgent = false, onSchedule }) {
  return (
    <View style={[styles.alertCard, urgent ? styles.alertCardUrgent : styles.alertCardCalm]}>
      <View style={styles.alertTitleRow}>
        <Ionicons
          name={urgent ? 'warning-outline' : 'calendar-outline'}
          size={15}
          color={urgent ? REST_COLORS.alertText : REST_COLORS.primary}
        />
        <Text style={[styles.alertTitle, { color: urgent ? REST_COLORS.alertText : REST_COLORS.primary }]}>
          {' '}{alert.title}
        </Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.scheduleButton,
          urgent && styles.scheduleButtonUrgent,
          pressed && { opacity: 0.85 },
        ]}
        onPress={onSchedule}
      >
        <Text style={styles.scheduleButtonText}>Schedule Now</Text>
        <Ionicons name="arrow-forward" size={15} color={REST_COLORS.white} />
      </Pressable>
    </View>
  );
}

function StatCard({ label, value, iconName, iconLibrary = 'Ionicons' }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon library={iconLibrary} name={iconName} size={16} color={REST_COLORS.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function RecentActivity({ items, icons, onViewAll }) {
  return (
    <View style={styles.activitySection}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        <Pressable onPress={onViewAll} style={({ pressed }) => pressed && { opacity: 0.85 }}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>
      {items.map((item, index) => (
        <ActivityRow key={item.id} item={item} iconConfig={icons[index % icons.length]} />
      ))}
    </View>
  );
}

function ActivityRow({ item, iconConfig }) {
  const badgeStyle =
    item.badgeType === 'money' ? styles.badgeMoney : styles.badgeLabel;
  const badgeTextStyle =
    item.badgeType === 'money' ? styles.badgeMoneyText : styles.badgeLabelText;

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIconWrap}>
        <Ionicons name={iconConfig.name} size={18} color={REST_COLORS.primary} />
      </View>
      <View style={styles.activityText}>
        <Text style={styles.activityRowTitle}>{item.title}</Text>
        <Text style={styles.activityRowSub}>{item.subtitle}</Text>
      </View>
      <View style={badgeStyle}>
        <Text style={badgeTextStyle}>{item.badge}</Text>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },

  card: {
    backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.card,
    padding: REST_SPACING.cardPadding,
    marginBottom: REST_SPACING.gap,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    alignItems: 'center',
    ...REST_SHADOWS.card,
  },
  tankLabel: {
    alignSelf: 'flex-start',
    fontFamily: REST_FONTS.semiBold,
    fontSize: 13,
    color: REST_COLORS.body,
    marginBottom: 12,
  },

  ringWrap: { justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPercent: { fontFamily: REST_FONTS.extraBold, fontSize: 38, color: REST_COLORS.ink },
  ringCaption: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.body, marginTop: -2 },

  tankStatus: { fontFamily: REST_FONTS.bold, fontSize: 20, color: REST_COLORS.ink, marginBottom: 4 },
  tankNote: {
    fontFamily: REST_FONTS.medium,
    fontSize: 13,
    color: REST_COLORS.body,
    textAlign: 'center',
    marginBottom: 14,
  },
  tankNoteBold: { fontFamily: REST_FONTS.semiBold, color: REST_COLORS.ink },
  tankDivider: { alignSelf: 'stretch', height: 1, backgroundColor: REST_COLORS.divider, marginBottom: 14 },
  tankMetaRow: { alignSelf: 'stretch', flexDirection: 'row' },
  tankMetaItem: { flex: 1 },
  tankMetaLabel: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.muted, marginBottom: 2 },
  tankMetaValue: { fontFamily: REST_FONTS.semiBold, fontSize: 15, color: REST_COLORS.ink },

  alertCard: {
    borderRadius: REST_RADII.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: REST_SPACING.gap,
  },
  alertCardUrgent: {
    backgroundColor: REST_COLORS.alertBg,
    borderColor: REST_COLORS.alertBorder,
  },
  alertCardCalm: {
    backgroundColor: REST_COLORS.selectedBg,
    borderColor: REST_COLORS.border,
  },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontFamily: REST_FONTS.bold, fontSize: 13 },
  alertMessage: {
    fontFamily: REST_FONTS.medium,
    fontSize: 13,
    color: REST_COLORS.ink,
    lineHeight: 19,
    marginBottom: 14,
  },
  scheduleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: REST_COLORS.primary,
    paddingVertical: 12,
    borderRadius: REST_RADII.pill,
    ...REST_SHADOWS.button,
  },
  scheduleButtonUrgent: { backgroundColor: REST_COLORS.negative, shadowColor: REST_COLORS.negative },
  scheduleButtonText: { fontFamily: REST_FONTS.bold, color: REST_COLORS.white, fontSize: 14 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: REST_SPACING.gap },
  statCard: {
    flex: 1,
    backgroundColor: REST_COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: REST_COLORS.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted, marginBottom: 2 },
  statValue: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.ink },

  activitySection: {
    backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.card,
    padding: 16,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activityTitle: { fontFamily: REST_FONTS.bold, fontSize: 15, color: REST_COLORS.ink },
  viewAll: { fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.primary },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: REST_COLORS.divider,
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: REST_COLORS.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityText: { flex: 1 },
  activityRowTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.ink, marginBottom: 2 },
  activityRowSub: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },

  badgeLabel: {
    backgroundColor: REST_COLORS.paleGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeLabelText: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.primary },
  badgeMoney: {
    backgroundColor: REST_COLORS.selectedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeMoneyText: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.primary },
});
