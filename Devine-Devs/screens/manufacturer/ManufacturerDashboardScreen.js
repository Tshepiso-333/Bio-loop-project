// screens/manufacturer/ManufacturerDashboardScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useAuth } from '../../AuthContext';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { useProfile } from '../../src/hooks/useProfile';
import { getInitials } from '../../src/utils/restaurantViewModels';

// Import all screens
import QualityScreen from './QualityScreen';
// NOTE: File is still ForecastsScreen.js but now exports the Finance screen.
import FinanceScreen from './ForecastsScreen';
import AIChatScreen from './AIChatScreen';
import SuppliersScreen from './SuppliersScreen';
import AlertsScreen from './AlertsScreen';
import ProfileScreen from './ProfileScreen';

// ─── THEME (mirrors restaurantTheme structure for uniformity) ────────────────

const MANU_THEME = {
  colors: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryDarker: '#047857',
    primaryLight: '#D1FAE5',
    paleGreen: '#ECFDF5',
    selectedBg: '#F0FDF4',

    page: '#F9FAFB',
    card: '#FFFFFF',

    ink: '#111827',
    body: '#6B7280',
    muted: '#9CA3AF',
    border: '#E5E7EB',
    divider: '#F3F4F6',

    white: '#FFFFFF',

    gradeA: '#7EE92D',
    gradeB: '#f59e0b',
    gradeC: '#ef4444',

    alertText: '#B91C1C',
    alertBg: '#FEF2F2',
    alertBorder: '#FECACA',
    negative: '#EF4444',

    darkSurface: '#111827',
    darkSurfaceText: '#D1D5DB',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    extraBold: 'System',
  },
  radii: { card: 16, pill: 999, chip: 10 },
  spacing: { screenPadding: 16, cardPadding: 16, gap: 16 },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    header: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    button: {
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

const { colors: C, fonts: F, radii: R, spacing: S, shadows: SH } = MANU_THEME;

// ─── LABELS ──────────────────────────────────────────────────────────────────

const DELIVERY_STATUS_LABELS = {
  scheduled: 'Scheduled',
  pending: 'Scheduled',
  in_transit: 'Driver en route to restaurant',
  arrival: 'Driver at restaurant',
  in_progress: 'Collecting',
  collected: 'On the way to you',
  arrived_manufacturer: 'Driver arrived',
  completed: 'Delivered',
};

const DELIVERY_STATUS_COLORS = {
  collected: C.gradeA,
  arrived_manufacturer: C.gradeB,
  completed: C.gradeA,
};

// ─── ICON HELPER ─────────────────────────────────────────────────────────────

function Icon({ name, size, color }) {
  return <Ionicons name={name} size={size} color={color} />;
}

// ─── NAV ICONS ───────────────────────────────────────────────────────────────

const HomeIcon = ({ color = C.body, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <Path
      d="M9 21V12h6v9"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AIChatIcon = ({ size = 28 }) => (
  <Image
    source={require('../../assets/BioLoop_Logo.png')}
    style={{ width: size, height: size, borderRadius: size / 2 }}
    resizeMode="cover"
  />
);

const SuppliersIcon = ({ color = C.body, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="8" cy="7" r="3" stroke={color} strokeWidth={1.6} />
    <Circle cx="16" cy="7" r="3" stroke={color} strokeWidth={1.6} />
    <Path
      d="M3 18v-2a4 4 0 014-4h2a4 4 0 014 4v2"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <Path
      d="M15 18v-2a4 4 0 014-4h2a4 4 0 014 4v2"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </Svg>
);

const ChartIcon = ({ color = C.body, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={1.6} />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={1.6} />
    <Line x1="9" y1="21" x2="9" y2="12" stroke={color} strokeWidth={1.6} />
    <Line x1="15" y1="21" x2="15" y2="12" stroke={color} strokeWidth={1.6} />
    <Line x1="21" y1="21" x2="21" y2="16" stroke={color} strokeWidth={1.6} />
    <Line x1="3" y1="21" x2="3" y2="16" stroke={color} strokeWidth={1.6} />
  </Svg>
);

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const ManufacturerDashboardScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const {
    manufacturer,
    inventory,
    tanks,
    forecasts,
    pickups,
    alerts,
    loading,
    refreshManufacturer,
    updateAlertReadStatus,
  } = useManufacturerContext();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('home');

  const latestUnreadAlert = useMemo(() => {
    const unread = (alerts || []).filter((a) => !a.is_read);
    if (!unread.length) return null;
    return [...unread].sort(
      (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
    )[0];
  }, [alerts]);

  const ALERT_CATEGORY_TAB = {
    quality: 'quality',
    delivery: 'home',
    inventory: 'home',
  };

  const handlePressAlertBanner = async () => {
    if (!latestUnreadAlert) return;
    const targetTab = ALERT_CATEGORY_TAB[latestUnreadAlert.category] ?? 'alerts';
    try {
      await updateAlertReadStatus(latestUnreadAlert.id, true);
    } catch (err) {
      console.error('Error marking alert read:', err.message);
    }
    setSelectedTab(targetTab);
  };

  const handleDismissAlertBanner = async () => {
    if (!latestUnreadAlert) return;
    try {
      await updateAlertReadStatus(latestUnreadAlert.id, true);
    } catch (err) {
      console.error('Error dismissing alert:', err.message);
    }
  };

  const profileInitials = useMemo(
    () =>
      getInitials(
        profile?.full_name ?? manufacturer?.contact_person ?? manufacturer?.name,
        'MF'
      ),
    [profile, manufacturer]
  );

  const currentStock = inventory?.current_stock_liters ?? 0;
  const stockIncrease = inventory?.stock_change_pct ?? 0;
  const thisWeekVolume = forecasts?.[0]?.total_volume_liters ?? 0;
  const weeklyDeliveries = (pickups || []).length;

  const weeklyData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals = days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});
    (pickups || []).forEach((p) => {
      if (!p.pickup_date) return;
      const date = new Date(p.pickup_date);
      if (Number.isNaN(date.getTime())) return;
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      if (totals[day] !== undefined) {
        totals[day] += p.estimated_volume_liters ?? p.actual_volume_liters ?? 0;
      }
    });
    return days.map((day) => ({ day, volume: totals[day] }));
  })();

  const sevenDayForecast = forecasts?.find((f) => f.period_days === 7) || null;
  const qualityDistribution = sevenDayForecast
    ? [
        { name: 'Grade A', value: sevenDayForecast.grade_a_pct ?? 0, color: C.gradeA },
        { name: 'Grade B', value: sevenDayForecast.grade_b_pct ?? 0, color: C.gradeB },
        { name: 'Grade C', value: sevenDayForecast.grade_c_pct ?? 0, color: C.gradeC },
      ]
    : [];

  const sortedPickups = [...(pickups || [])].sort((a, b) => {
    const aWaiting = a.status === 'arrived_manufacturer' ? 0 : 1;
    const bWaiting = b.status === 'arrived_manufacturer' ? 0 : 1;
    return aWaiting - bWaiting;
  });

  const upcomingDeliveries = sortedPickups.slice(0, 3).map((p) => ({
    id: p.id,
    restaurant: p.restaurants?.name ?? 'Unknown',
    volume: p.estimated_volume_liters ?? p.actual_volume_liters ?? 0,
    quality: p.quality_grade ?? '—',
    eta: p.pickup_time_start ?? '—',
    status: p.status ?? 'scheduled',
  }));

  const onRefresh = () => {
    if (refreshManufacturer) refreshManufacturer();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getQualityColor = (q) =>
    q === 'B' ? C.gradeB : q === 'C' ? C.gradeC : C.gradeA;
  const getQualityBgColor = (q) =>
    q === 'B' ? `${C.gradeB}20` : q === 'C' ? `${C.gradeC}20` : `${C.gradeA}20`;

  // ─── HEADER (WHITE — clean, professional, easy to tap) ───────────────────

  const MainHeader = () => {
    if (selectedTab !== 'home') return null;
    const unreadCount = alerts?.filter((a) => !a.is_read).length || 0;

    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={C.card} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerContent}>
            {/* Left — logo + name */}
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
                <Text style={styles.companyName}>Manufacturer Portal</Text>
              </View>
            </View>

            {/* Right — notifications + profile */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setSelectedTab('alerts')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={22} color={C.ink} />
                {unreadCount > 0 && (
                  <View style={styles.notificationDot}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileCircle}
                onPress={() => setSelectedTab('profile')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Text style={styles.profileInitial}>{profileInitials}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </>
    );
  };

  // ─── CHARTS ──────────────────────────────────────────────────────────────

  const PieChart = () => {
    const segments = qualityDistribution.map((item) => ({
      percentage: item.value,
      color: item.color,
      label: item.name,
    }));
    let cumulativeAngle = 0;

    return (
      <View style={styles.pieContainer}>
        <View style={styles.pieWrapper}>
          <View style={styles.pieRing}>
            {segments.map((segment, index) => {
              const angle = (segment.percentage / 100) * 360;
              const startAngle = cumulativeAngle;
              cumulativeAngle += angle;
              return (
                <View
                  key={index}
                  style={[
                    styles.pieSegment,
                    {
                      backgroundColor: segment.color,
                      transform: [{ rotate: `${startAngle}deg` }],
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.pieCenter}>
            <Text style={styles.pieCenterText}>100%</Text>
            <Text style={styles.pieCenterSubtext}>Total</Text>
          </View>
        </View>
      </View>
    );
  };

  const WeeklyAreaChart = () => {
    const maxVolume = Math.max(...weeklyData.map((d) => d.volume), 1);
    return (
      <View style={styles.areaChart}>
        {weeklyData.map((item, index) => {
          const height = maxVolume > 0 ? (item.volume / maxVolume) * 120 : 0;
          return (
            <View key={index} style={styles.areaBarWrapper}>
              <View style={styles.areaBarContainer}>
                <View
                  style={[styles.areaBar, { height, backgroundColor: C.gradeA }]}
                />
              </View>
              <Text style={styles.areaBarLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── SMALL REUSABLES ─────────────────────────────────────────────────────

  const StatCard = ({ iconName, value, label, sub }) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon name={iconName} size={16} color={C.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );

  const SectionHeader = ({ title, action, onPress }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity
          onPress={onPress}
          style={({ pressed }) => pressed && { opacity: 0.85 }}
        >
          <Text style={styles.viewAllText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // ─── CONTENT ─────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (selectedTab) {
      case 'home':
        return (
          <>
            {/* Unread alert banner */}
            {latestUnreadAlert && (
              <TouchableOpacity
                style={styles.alertBanner}
                onPress={handlePressAlertBanner}
                activeOpacity={0.85}
              >
                <View style={styles.alertBannerIcon}>
                  <Ionicons name="notifications" size={18} color={C.white} />
                </View>
                <View style={styles.alertBannerBody}>
                  <Text style={styles.alertBannerTitle} numberOfLines={1}>
                    {latestUnreadAlert.title}
                  </Text>
                  <Text style={styles.alertBannerMessage} numberOfLines={2}>
                    {latestUnreadAlert.message}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.alertBannerClose}
                  onPress={handleDismissAlertBanner}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={C.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Stat row */}
            <View style={styles.statRow}>
              <StatCard
                iconName="water-outline"
                label="Current Stock"
                value={`${currentStock.toLocaleString()} L`}
                sub={`↑ ${stockIncrease}%`}
              />
              <StatCard
                iconName="cube-outline"
                label="This Week"
                value={`${thisWeekVolume.toLocaleString()} L`}
                sub={`${weeklyDeliveries} deliveries`}
              />
            </View>

            {/* 1. INCOMING DELIVERIES */}
            <View style={styles.section}>
              <SectionHeader
                title="Incoming Deliveries"
                action="View All →"
                onPress={() => setSelectedTab('suppliers')}
              />
              <View style={styles.deliveriesList}>
                {upcomingDeliveries.map((delivery) => (
                  <TouchableOpacity
                    key={delivery.id}
                    style={styles.deliveryCard}
                    onPress={() => setSelectedTab('suppliers')}
                    activeOpacity={0.9}
                  >
                    <View style={styles.deliveryContent}>
                      <View style={styles.deliveryInfo}>
                        <Text style={styles.restaurantName}>{delivery.restaurant}</Text>
                        <View style={styles.deliveryMeta}>
                          <View style={styles.volumeContainer}>
                            <Ionicons name="water-outline" size={12} color={C.muted} />
                            <Text style={styles.volumeText}>{delivery.volume}L</Text>
                          </View>
                          <View
                            style={[
                              styles.qualityTag,
                              { backgroundColor: getQualityBgColor(delivery.quality) },
                            ]}
                          >
                            <Text
                              style={[
                                styles.qualityTagText,
                                { color: getQualityColor(delivery.quality) },
                              ]}
                            >
                              Grade {delivery.quality}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.deliveryTimeInfo}>
                        <Text style={styles.etaText}>{delivery.eta}</Text>
                        <View style={styles.statusContainer}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor:
                                  DELIVERY_STATUS_COLORS[delivery.status] ?? C.muted,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  DELIVERY_STATUS_COLORS[delivery.status] ?? C.body,
                              },
                            ]}
                          >
                            {DELIVERY_STATUS_LABELS[delivery.status] ?? 'Scheduled'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {delivery.status === 'arrived_manufacturer' && (
                      <TouchableOpacity
                        style={styles.confirmReceivedBtn}
                        onPress={() =>
                          navigation.navigate('ManufacturerPayment', {
                            pickupId: delivery.id,
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Ionicons name="card-outline" size={16} color={C.white} />
                        <Text style={styles.confirmReceivedBtnText}>
                          Confirm Received & Pay
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. QUALITY DISTRIBUTION */}
            <View style={styles.section}>
              <SectionHeader
                title="Quality Distribution"
                action="View Details →"
                onPress={() => setSelectedTab('quality')}
              />
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedTab('quality')}
                activeOpacity={0.9}
              >
                <View style={styles.qualityStats}>
                  {qualityDistribution.map((item, index) => (
                    <View key={index} style={styles.qualityStatItem}>
                      <View
                        style={[
                          styles.qualityIconWrap,
                          { backgroundColor: `${item.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={
                            item.name === 'Grade A'
                              ? 'trending-up'
                              : 'alert-circle-outline'
                          }
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <Text style={styles.qualityPercentage}>{item.value}%</Text>
                      <Text style={styles.qualityLabel}>{item.name}</Text>
                    </View>
                  ))}
                </View>
                <PieChart />
              </TouchableOpacity>
            </View>

            {/* 3. WEEKLY COLLECTION */}
            <View style={styles.section}>
              <SectionHeader title="Weekly Collection" action="Last 7 days" />
              <View style={styles.card}>
                <WeeklyAreaChart />
              </View>
            </View>
          </>
        );
      case 'quality':
        return <QualityScreen navigation={navigation} />;
      case 'finance':
        return <FinanceScreen navigation={navigation} />;
      case 'ai-chat':
        return <AIChatScreen navigation={navigation} />;
      case 'suppliers':
        return <SuppliersScreen navigation={navigation} />;
case 'alerts':
  return (
    <AlertsScreen
      navigation={navigation}
      onBack={() => setSelectedTab('home')}
    />
  );
      case 'profile':
        return <ProfileScreen 
        navigation={navigation}
        onBack={() => setSelectedTab('home')} />;
      default:
        return null;
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <MainHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>{renderContent()}</View>
      </ScrollView>

      <View
        style={[styles.bottomNav, { paddingBottom: Math.max(8, insets.bottom) }]}
      >
        <NavItem
          label="Home"
          active={selectedTab === 'home'}
          onPress={() => setSelectedTab('home')}
          renderIcon={(c) => <HomeIcon color={c} size={24} />}
        />
        <NavItem
          label="Quality"
          active={selectedTab === 'quality'}
          onPress={() => setSelectedTab('quality')}
          renderIcon={(c) => <ChartIcon color={c} size={24} />}
        />
        <NavItem
          label="AI Chat"
          center
          active={selectedTab === 'ai-chat'}
          onPress={() => setSelectedTab('ai-chat')}
          renderIcon={() => <AIChatIcon size={28} />}
        />
        <NavItem
          label="Finance"
          active={selectedTab === 'finance'}
          onPress={() => setSelectedTab('finance')}
          renderIcon={(c) => <Ionicons name="cash-outline" size={24} color={c} />}
        />
        <NavItem
          label="Suppliers"
          active={selectedTab === 'suppliers'}
          onPress={() => setSelectedTab('suppliers')}
          renderIcon={(c) => <SuppliersIcon color={c} size={24} />}
        />
      </View>
    </View>
  );
};

// ─── NAV ITEM ────────────────────────────────────────────────────────────────

function NavItem({ label, active, onPress, renderIcon, center }) {
  const color = active ? C.primary : C.body;
  return (
    <TouchableOpacity
      style={[styles.navItem, center && styles.navItemCenter]}
      onPress={onPress}
    >
      <View
        style={[
          styles.navIconContainer,
          active && styles.activeNavIcon,
          center && styles.aiChatIconContainer,
        ]}
      >
        {renderIcon(color)}
      </View>
      <Text style={[styles.navLabel, active && styles.activeNavLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  content: { flex: 1 },

  // ─── Header (WHITE) ──────────────────────────────────────────────────────
  header: {
    backgroundColor: C.card,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...SH.header,
  },
  headerContent: {
    paddingHorizontal: S.screenPadding,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  logoImage: { width: 40, height: 40, borderRadius: 20 },
  appName: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.ink,
    fontWeight: '700',
  },
  companyName: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.body,
    marginTop: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    padding: 8,
    position: 'relative',
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: C.negative,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.white,
  },
  notificationBadgeText: { fontSize: 9, fontWeight: '700', color: C.white },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  profileInitial: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.ink,
    fontWeight: '700',
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: S.screenPadding,
    marginTop: S.gap,
    padding: 12,
    borderRadius: R.card,
    backgroundColor: C.darkSurface,
    gap: 10,
    ...SH.card,
  },
  alertBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBannerBody: { flex: 1 },
  alertBannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.white,
    marginBottom: 2,
    fontWeight: '700',
  },
  alertBannerMessage: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.darkSurfaceText,
    lineHeight: 16,
  },
  alertBannerClose: { padding: 4 },

  // Stat row
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: S.gap,
    paddingHorizontal: S.screenPadding,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...SH.card,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.muted,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.ink,
    fontWeight: '600',
  },
  statSub: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.primary,
    marginTop: 4,
  },

  // Section
  section: { paddingHorizontal: S.screenPadding, marginTop: S.gap + 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.ink,
    fontWeight: '700',
  },
  viewAllText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.primary,
    fontWeight: '600',
  },

  // Generic card
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: S.cardPadding,
    borderWidth: 1,
    borderColor: C.border,
    ...SH.card,
  },

  // Quality
  qualityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  qualityStatItem: { alignItems: 'center' },
  qualityIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityPercentage: {
    fontFamily: F.bold,
    fontSize: 20,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 2,
  },
  qualityLabel: { fontFamily: F.medium, fontSize: 12, color: C.body },

  // Pie
  pieContainer: { alignItems: 'center', marginTop: 4 },
  pieWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pieRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  pieSegment: { position: 'absolute', width: '100%', height: '100%' },
  pieCenter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    top: 30,
    left: 30,
    ...SH.card,
  },
  pieCenterText: {
    fontFamily: F.extraBold,
    fontSize: 24,
    fontWeight: '700',
    color: C.ink,
  },
  pieCenterSubtext: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.body,
    marginTop: 2,
  },

  // Weekly chart
  areaChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  areaBarWrapper: { alignItems: 'center', width: 40 },
  areaBarContainer: { height: 130, justifyContent: 'flex-end', marginBottom: 8 },
  areaBar: { width: 32, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  areaBarLabel: { fontFamily: F.medium, fontSize: 12, color: C.body },

  // Deliveries
  deliveriesList: { gap: 12 },
  deliveryCard: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    ...SH.card,
  },
  deliveryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: { flex: 1 },
  restaurantName: {
    fontFamily: F.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: C.ink,
    marginBottom: 6,
  },
  deliveryMeta: { flexDirection: 'row', gap: 8 },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.divider,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  volumeText: { fontFamily: F.medium, fontSize: 12, color: C.body },
  qualityTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  qualityTagText: { fontFamily: F.semiBold, fontSize: 12, fontWeight: '600' },
  deliveryTimeInfo: { alignItems: 'flex-end' },
  etaText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    fontWeight: '600',
    color: C.ink,
    marginBottom: 4,
  },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: F.medium, fontSize: 11 },
  confirmReceivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: R.pill,
    backgroundColor: C.primary,
    ...SH.button,
  },
  confirmReceivedBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: C.card,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  navItem: { alignItems: 'center', gap: 2, flex: 1 },
  navItemCenter: { alignItems: 'center', gap: 2, flex: 1, marginTop: -20 },
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiChatIconContainer: {
    backgroundColor: C.selectedBg,
    borderWidth: 2,
    borderColor: C.primary,
  },
  activeNavIcon: { backgroundColor: `${C.primary}20` },
  navLabel: { fontFamily: F.medium, fontSize: 10, color: C.body, marginTop: 1 },
  activeNavLabel: { color: C.primary, fontWeight: '600' },
});

export default ManufacturerDashboardScreen;