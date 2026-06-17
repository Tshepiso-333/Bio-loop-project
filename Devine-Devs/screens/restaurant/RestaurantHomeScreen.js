import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../AuthContext';
import { useProfile } from '../../src/hooks/useProfile';
import { useRestaurant } from '../../src/hooks/useRestaurant';
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

// ─── COLORS (Keeping red for alerts, updating green to theme) ─────────────────

const COLORS = {
  background: '#F4F4EF',
  card: '#FFFFFF',
  green: '#10b981',
  greenLight: '#D1FAE5',
  greenDark: '#059669',
  alertBg: '#FFF1F1',
  alertBorder: '#FECACA',
  alertText: '#DC2626',
  alertButton: '#991B1B',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  progressTrack: '#E2E8F0',
  iconOrange: '#FEF3C7',
  iconGreen: '#D1FAE5',
  iconBlue: '#DBEAFE',
  tabActive: '#10b981',
  tabInactive: '#94A3B8',
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

export default function RestaurantHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOut } = useAuth();
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

  // Header Component with Logo, Notifications, and Profile
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
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/BioLoop_Logo.png')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.appName}>BioLoop</Text>
              <Text style={styles.companyName}>Restaurant Portal</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerSignOutButton} onPress={signOut}>
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            </Pressable>
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
        {loading && !tankData ? <RestaurantLoadingBanner /> : null}
        {!loading && !restaurant ? (
          <RestaurantEmptyBanner message="No restaurant profile linked to this account yet." />
        ) : null}

        {tankData ? <TankCard data={tankData} /> : null}
        {pickupAlert.visible ? (
          <PickupAlert
            alert={pickupAlert}
            onSchedule={() => navigation.navigate('SchedulePickup')}
          />
        ) : null}

        <View style={styles.statRow}>
          <StatCard label="Oil Grade" value={stats.oilGrade} iconBg={COLORS.iconOrange} iconName="water" iconColor="#D97706" />
          <StatCard label="Est. Earnings" value={stats.estimatedEarnings} iconBg={COLORS.iconGreen} iconName="cash-outline" iconColor={COLORS.green} />
          <StatCard label="Last Pickup" value={stats.lastPickupDate} iconBg={COLORS.iconBlue} iconName="truck-outline" iconColor="#2563EB" iconLibrary="MaterialCommunityIcons" />
        </View>

        {recentActivity.length > 0 ? (
          <RecentActivity items={recentActivity} icons={activityIcons} />
        ) : (
          <RestaurantEmptyBanner message="No recent activity yet." />
        )}
        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function TankCard({ data }) {
  return (
    <View style={styles.card}>
      <View style={styles.tankHeaderRow}>
        <Text style={styles.tankLabel}>{data.label.toUpperCase()}</Text>
        <Pressable style={styles.aiButton}>
          <Ionicons name="sparkles-outline" size={12} color={COLORS.green} />
          <Text style={styles.aiButtonText}>AI Analysis</Text>
        </Pressable>
      </View>
      <Text style={styles.tankPercent}>{data.fillPercent}%</Text>
      <Text style={styles.tankStatus}>{data.statusText}</Text>
      <Text style={styles.tankNote}>
        {data.statusNote}{' '}
        <Text style={styles.tankNoteBold}>{data.estimatedDays} days.</Text>
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${data.fillPercent}%` }]} />
      </View>
      <View style={styles.tankMetaRow}>
        <View>
          <Text style={styles.tankMetaLabel}>Current Volume</Text>
          <Text style={styles.tankMetaValue}>{data.currentVolume.toLocaleString()} Liters</Text>
        </View>
        <View>
          <Text style={styles.tankMetaLabel}>Temperature</Text>
          <Text style={styles.tankMetaValue}>{data.temperature}° F</Text>
        </View>
      </View>
    </View>
  );
}

function PickupAlert({ alert, onSchedule }) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertTitleRow}>
        <Ionicons name="warning-outline" size={15} color={COLORS.alertText} />
        <Text style={styles.alertTitle}> {alert.title.toUpperCase()}</Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Pressable style={styles.scheduleButton} onPress={onSchedule}>
        <Text style={styles.scheduleButtonText}>Schedule Now</Text>
        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function StatCard({ label, value, iconBg, iconName, iconColor, iconLibrary = 'Ionicons' }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Icon library={iconLibrary} name={iconName} size={16} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function RecentActivity({ items, icons }) {
  return (
    <View style={styles.activitySection}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        <Pressable>
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
    item.badgeType === 'percent' ? styles.badgePercent
    : item.badgeType === 'money' ? styles.badgeMoney
    : styles.badgeLabel;
  const badgeTextStyle =
    item.badgeType === 'percent' ? styles.badgePercentText
    : item.badgeType === 'money' ? styles.badgeMoneyText
    : styles.badgeLabelText;

  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIconWrap, { backgroundColor: iconConfig.bg }]}>
        <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
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
  root: { flex: 1, backgroundColor: COLORS.background },
  
  // Header Styles - Matching manufacturer/driver with notifications
  header: {
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  companyName: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSignOutButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(220,38,38,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tankHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tankLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.textSecondary, letterSpacing: 0.8 },
  aiButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.greenLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  aiButtonText: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.green },
  tankPercent: { fontFamily: FONTS.bold, fontSize: 52, color: COLORS.green, lineHeight: 58 },
  tankStatus: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.greenDark, marginBottom: 6 },
  tankNote: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 },
  tankNoteBold: { fontFamily: FONTS.bodySemiBold, color: COLORS.textPrimary },
  progressTrack: { height: 10, backgroundColor: COLORS.progressTrack, borderRadius: 6, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 6 },
  tankMetaRow: { flexDirection: 'row', gap: 40 },
  tankMetaLabel: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: COLORS.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  tankMetaValue: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },

  alertCard: {
    backgroundColor: COLORS.alertBg, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.alertBorder,
    padding: 16, marginBottom: 12,
  },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.alertText, letterSpacing: 0.6 },
  alertMessage: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textPrimary, lineHeight: 19, marginBottom: 14 },
  scheduleButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.alertButton, paddingVertical: 12, borderRadius: 10,
  },
  scheduleButtonText: { fontFamily: FONTS.semiBold, color: '#FFFFFF', fontSize: 14 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontFamily: FONTS.bodyMedium, fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textPrimary },

  activitySection: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  activityTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  viewAll: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.green },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  activityIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityText: { flex: 1 },
  activityRowTitle: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textPrimary, marginBottom: 2 },
  activityRowSub: { fontFamily: FONTS.bodyRegular, fontSize: 11, color: COLORS.textMuted },

  badgePercent: { backgroundColor: COLORS.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgePercentText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green },
  badgeLabel: { backgroundColor: COLORS.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeLabelText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green },
  badgeMoney: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeMoneyText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.greenDark },
});
