<<<<<<< HEAD
import React from 'react';
import { useNavigation } from '@react-navigation/native';
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

const TANK_INFO = {
  name: 'Tank 01 Monitoring',
  isActive: true,
  lastPing: '2 mins ago',
  currentCapacity: 82,
};

const OIL_TREND_DATA = [
  { day: 'MON', value: 20 },
  { day: 'TUE', value: 32 },
  { day: 'WED', value: 45 },
  { day: 'THU', value: 58 },
  { day: 'FRI', value: 68 },
  { day: 'SAT', value: 80 },
  { day: 'SUN', value: 95 },
];

const PREDICTIVE_ALERT = {
  visible: true,
  hoursUntilFull: 48,
  message:
    'Estimated time until 95% capacity based on current disposal rates. Schedule pickup soon.',
};

const QUALITY_LOGS = [
  { id: '1', timestamp: 'Oct 24,\n08:32 PM', analyzedBy: 'Sensor\nAI v2.4', oilLevel: '1.2%' },
  { id: '2', timestamp: 'Oct 23,\n11:15 AM', analyzedBy: 'Sensor\nAI v2.4', oilLevel: '2.8%' },
  { id: '3', timestamp: 'Oct 22,\n09:45 PM', analyzedBy: 'Sensor\nAI v2.4', oilLevel: '1.1%' },
  { id: '4', timestamp: 'Oct 21,\n07:12 AM', analyzedBy: 'Sensor\nAI v2.4', oilLevel: '5.4%' },
];

const DEVICE_STATS = [
  { label: 'Temperature',  value: '114°F',  valueColor: '#EA580C' },
  { label: 'Connectivity', value: 'Strong', valueColor: '#16A34A' },
  { label: 'Last Pickup',  value: '12 Days', valueColor: null },
  { label: 'Sediment',     value: 'Low',     valueColor: null },
];



// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  background: '#F4F4EF',
  card: '#FFFFFF',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenDark: '#14532D',
  alertBg: '#FFF1F1',
  alertBorder: '#FECACA',
  alertText: '#DC2626',
  alertButton: '#991B1B',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  tabActive: '#16A34A',
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
=======
import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
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
  mapDeviceStats,
  mapMonitoringTankInfo,
  mapOilTrendData,
  mapPredictiveAlert,
  mapQualityLogRows,
} from '../../src/utils/restaurantViewModels';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

// ─── ICON HELPER ──────────────────────────────────────────────────────────────

function Icon({ library = 'Ionicons', name, size, color }) {
  if (library === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

<<<<<<< HEAD
// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function MonitoringScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>Monitoring</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RestaurantHeader name="KitchenSteward" />
        <TankHeader info={TANK_INFO} />
        <CapacityDisplay percent={TANK_INFO.currentCapacity} />
        <OilTrendChart data={OIL_TREND_DATA} />
        {PREDICTIVE_ALERT.visible && <PredictiveAlert alert={PREDICTIVE_ALERT} />}
        <QualityLogs logs={QUALITY_LOGS} />
        <DeviceStatsGrid stats={DEVICE_STATS} />
        <View style={{ height: 16 }} />
      </ScrollView>

      
=======
// The mapper returns legacy emerald for some stat values; remap to theme
// display-side so the view model stays untouched.
const remapStatColor = (color) =>
  color === '#10b981' ? REST_COLORS.primary : color;

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function MonitoringScreen() {
  const { profile } = useProfile();
  const {
    tank,
    tankReadings,
    qualityLogs,
    pickups,
    alerts,
    loading,
    refreshing,
    refreshRestaurant,
  } = useRestaurant();

  const profileInitials = useMemo(
    () => getInitials(profile?.full_name, 'RS'),
    [profile?.full_name]
  );
  const tankInfo = useMemo(() => mapMonitoringTankInfo(tank), [tank]);
  const oilTrendData = useMemo(() => mapOilTrendData(tankReadings), [tankReadings]);
  const predictiveAlert = useMemo(
    () => mapPredictiveAlert(tank, alerts),
    [tank, alerts]
  );
  const qualityLogRows = useMemo(() => mapQualityLogRows(qualityLogs), [qualityLogs]);
  const deviceStats = useMemo(
    () => mapDeviceStats(tank, pickups),
    [tank, pickups]
  );

  return (
    <View style={styles.root}>
      <RestaurantHeader title="Monitoring" avatarInitials={profileInitials} />

      <RestaurantRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshRestaurant}
      >
        {loading && !tank ? <RestaurantLoadingBanner /> : null}

        <TankHeader info={tankInfo} />
        <CapacityDisplay percent={tankInfo.currentCapacity} />
        {oilTrendData.length > 0 ? (
          <OilTrendChart data={oilTrendData} />
        ) : (
          <RestaurantEmptyBanner message="No tank trend readings yet." />
        )}
        {predictiveAlert.visible ? <PredictiveAlert alert={predictiveAlert} /> : null}
        {qualityLogRows.length > 0 ? (
          <QualityLogs logs={qualityLogRows} />
        ) : (
          <RestaurantEmptyBanner message="No quality logs yet." />
        )}
        <DeviceStatsGrid stats={deviceStats} />
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

=======
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
function TankHeader({ info }) {
  return (
    <View style={styles.tankHeaderBlock}>
      <Text style={styles.tankName}>{info.name}</Text>
      <View style={styles.tankBadgeRow}>
        {info.isActive && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>Active (IoT)</Text>
          </View>
        )}
        <View style={styles.lastPingRow}>
<<<<<<< HEAD
          <Ionicons name="wifi-outline" size={12} color={COLORS.textMuted} />
=======
          <Ionicons name="wifi-outline" size={12} color={REST_COLORS.muted} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          <Text style={styles.lastPingText}>Last ping: {info.lastPing}</Text>
        </View>
      </View>
    </View>
  );
}

function CapacityDisplay({ percent }) {
  return (
    <View style={styles.capacityBlock}>
<<<<<<< HEAD
      <Text style={styles.capacityLabel}>Current Capacity</Text>
=======
      <Text style={styles.capacityLabel}>Current capacity</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      <View style={styles.capacityRow}>
        <Text style={styles.capacityNumber}>{percent}</Text>
        <Text style={styles.capacityUnit}>%</Text>
      </View>
    </View>
  );
}

function OilTrendChart({ data }) {
<<<<<<< HEAD
  const maxValue = Math.max(...data.map((d) => d.value));
=======
  const maxValue = Math.max(...data.map((d) => d.value), 1);
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  const BAR_MAX_HEIGHT = 90;

  return (
    <View style={styles.card}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartTitleRow}>
<<<<<<< HEAD
          <Ionicons name="bar-chart-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.chartTitle}>Oil Level Trends</Text>
        </View>
        <Text style={styles.chartSubtitle}>Last 7 Days</Text>
=======
          <Ionicons name="bar-chart-outline" size={16} color={REST_COLORS.ink} />
          <Text style={styles.chartTitle}>Oil Level Trends</Text>
        </View>
        <Text style={styles.chartSubtitle}>Last 7 days</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      </View>

      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * BAR_MAX_HEIGHT;
<<<<<<< HEAD
          const opacity = 0.25 + (index / (data.length - 1)) * 0.75;
          return (
            <View key={item.day} style={styles.barColumn}>
              <View style={{ flex: 1 }} />
              <View style={[styles.bar, { height: barHeight, opacity }]} />
=======
          const isLatest = index === data.length - 1;
          return (
            <View key={item.day} style={styles.barColumn}>
              <View style={{ flex: 1 }} />
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isLatest ? REST_COLORS.primary : REST_COLORS.accent,
                  },
                ]}
              />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

<<<<<<< HEAD
// ── navigation added inside this component so it can use the hook correctly
=======
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
function PredictiveAlert({ alert }) {
  const navigation = useNavigation();
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertTitleRow}>
<<<<<<< HEAD
        <Ionicons name="warning-outline" size={14} color={COLORS.alertText} />
        <Text style={styles.alertTitle}> Predictive Alert</Text>
=======
        <Ionicons name="warning-outline" size={14} color={REST_COLORS.alertText} />
        <Text style={styles.alertTitle}> Predictive alert</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      </View>
      <Text style={styles.alertHours}>{alert.hoursUntilFull} Hours</Text>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Pressable
<<<<<<< HEAD
        style={styles.scheduleButton}
        onPress={() => navigation.navigate('SchedulePickup')}
      >
        <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
=======
        style={({ pressed }) => [styles.scheduleButton, pressed && { opacity: 0.85 }]}
        onPress={() => navigation.navigate('SchedulePickup')}
      >
        <Ionicons name="calendar-outline" size={15} color={REST_COLORS.white} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        <Text style={styles.scheduleButtonText}>Schedule Pickup</Text>
      </Pressable>
    </View>
  );
}

function QualityLogs({ logs }) {
  return (
    <View style={styles.card}>
      <View style={styles.logsHeaderRow}>
        <View style={styles.logsTitleRow}>
<<<<<<< HEAD
          <Ionicons name="document-text-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.logsTitle}>Historical Quality Logs</Text>
        </View>
        <Pressable style={styles.filterButton}>
          <Ionicons name="filter-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </Pressable>
=======
          <Ionicons name="document-text-outline" size={16} color={REST_COLORS.ink} />
          <Text style={styles.logsTitle}>Historical Quality Logs</Text>
        </View>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      </View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.colTimestamp]}>Timestamp</Text>
<<<<<<< HEAD
        <Text style={[styles.tableHeaderCell, styles.colAnalyzed]}>Analyzed{'\n'}By</Text>
        <Text style={[styles.tableHeaderCell, styles.colOil]}>Oil{'\n'}Level</Text>
=======
        <Text style={[styles.tableHeaderCell, styles.colAnalyzed]}>Analyzed{'\n'}by</Text>
        <Text style={[styles.tableHeaderCell, styles.colOil]}>Oil{'\n'}level</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      </View>

      {logs.map((log) => (
        <View key={log.id} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.colTimestamp]}>{log.timestamp}</Text>
          <Text style={[styles.tableCell, styles.colAnalyzed]}>{log.analyzedBy}</Text>
          <Text style={[styles.tableCell, styles.colOil]}>{log.oilLevel}</Text>
        </View>
      ))}
    </View>
  );
}

function DeviceStatsGrid({ stats }) {
  const STAT_ICONS = [
    { name: 'thermometer-outline', library: 'Ionicons' },
    { name: 'wifi-outline',        library: 'Ionicons' },
    { name: 'time-outline',        library: 'Ionicons' },
    { name: 'beaker-outline',      library: 'Ionicons' },
  ];

  return (
    <View style={styles.statsGrid}>
      {stats.map((stat, index) => {
        const isRightCol = index % 2 === 1;
        const isBottomRow = index >= 2;
        const iconConf = STAT_ICONS[index];
<<<<<<< HEAD
=======
        const valueColor = remapStatColor(stat.valueColor);
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        return (
          <View
            key={stat.label}
            style={[
              styles.statCell,
              isRightCol && styles.statCellRight,
              isBottomRow && styles.statCellBottom,
            ]}
          >
            <Icon
              library={iconConf.library}
              name={iconConf.name}
              size={16}
<<<<<<< HEAD
              color={stat.valueColor ?? COLORS.textMuted}
=======
              color={valueColor ?? REST_COLORS.muted}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
            />
            <Text style={styles.statCellLabel}>{stat.label}</Text>
            <Text
              style={[
                styles.statCellValue,
<<<<<<< HEAD
                stat.valueColor ? { color: stat.valueColor } : null,
=======
                valueColor ? { color: valueColor } : null,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
              ]}
            >
              {stat.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

<<<<<<< HEAD


// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  topBarTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.textPrimary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  restaurantHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  restaurantIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  restaurantName: { flex: 1, fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  bellButton: { padding: 4 },

  tankHeaderBlock: { marginBottom: 12 },
  tankName: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.textPrimary, marginBottom: 6 },
  tankBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 5,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  activeBadgeText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green },
  lastPingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastPingText: { fontFamily: FONTS.bodyRegular, fontSize: 11, color: COLORS.textMuted },

  capacityBlock: { marginBottom: 16 },
  capacityLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.textSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2,
  },
  capacityRow: { flexDirection: 'row', alignItems: 'flex-end' },
  capacityNumber: { fontFamily: FONTS.bold, fontSize: 72, color: COLORS.green, lineHeight: 80 },
  capacityUnit: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.green, marginBottom: 10, marginLeft: 4 },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
=======
// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },

  tankHeaderBlock: { marginBottom: 12 },
  tankName: { fontFamily: REST_FONTS.bold, fontSize: 20, color: REST_COLORS.ink, marginBottom: 6 },
  tankBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: REST_COLORS.paleGreen,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 5,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: REST_COLORS.primary },
  activeBadgeText: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.primary },
  lastPingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastPingText: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },

  capacityBlock: { marginBottom: 16 },
  capacityLabel: {
    fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.body, marginBottom: 2,
  },
  capacityRow: { flexDirection: 'row', alignItems: 'flex-end' },
  capacityNumber: { fontFamily: REST_FONTS.extraBold, fontSize: 72, color: REST_COLORS.primary, lineHeight: 80 },
  capacityUnit: { fontFamily: REST_FONTS.extraBold, fontSize: 28, color: REST_COLORS.primary, marginBottom: 10, marginLeft: 4 },

  card: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    padding: 16, marginBottom: REST_SPACING.gap,
    borderWidth: 1, borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },

  chartHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
<<<<<<< HEAD
  chartTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.textPrimary },
  chartSubtitle: { fontFamily: FONTS.bodyRegular, fontSize: 11, color: COLORS.textMuted },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center' },
  bar: { width: '100%', backgroundColor: COLORS.green, borderRadius: 4, marginBottom: 4 },
  barLabel: { fontFamily: FONTS.bodyMedium, fontSize: 9, color: COLORS.textMuted },

  alertCard: {
    backgroundColor: COLORS.alertBg, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.alertBorder,
    padding: 16, marginBottom: 12,
  },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  alertTitle: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.alertText, letterSpacing: 0.6, textTransform: 'uppercase' },
  alertHours: { fontFamily: FONTS.bold, fontSize: 42, color: COLORS.alertText, lineHeight: 48, marginBottom: 6 },
  alertMessage: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textPrimary, lineHeight: 19, marginBottom: 14 },
  scheduleButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.alertButton, paddingVertical: 13, borderRadius: 10,
  },
  scheduleButtonText: { fontFamily: FONTS.semiBold, color: '#FFFFFF', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },

  logsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logsTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.textPrimary },
  filterButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  filterButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.textSecondary },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingBottom: 6, marginBottom: 2,
  },
  tableHeaderCell: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'flex-start' },
  tableCell: { fontFamily: FONTS.bodyRegular, fontSize: 12, color: COLORS.textPrimary, lineHeight: 17 },
=======
  chartTitle: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.ink },
  chartSubtitle: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 4, marginBottom: 4 },
  barLabel: { fontFamily: REST_FONTS.medium, fontSize: 9, color: REST_COLORS.muted },

  alertCard: {
    backgroundColor: REST_COLORS.alertBg, borderRadius: REST_RADII.card,
    borderWidth: 1, borderColor: REST_COLORS.alertBorder,
    padding: 16, marginBottom: REST_SPACING.gap,
  },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  alertTitle: { fontFamily: REST_FONTS.bold, fontSize: 13, color: REST_COLORS.alertText },
  alertHours: { fontFamily: REST_FONTS.extraBold, fontSize: 42, color: REST_COLORS.alertText, lineHeight: 48, marginBottom: 6 },
  alertMessage: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.ink, lineHeight: 19, marginBottom: 14 },
  scheduleButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: REST_COLORS.negative, paddingVertical: 13, borderRadius: REST_RADII.pill,
  },
  scheduleButtonText: { fontFamily: REST_FONTS.bold, color: REST_COLORS.white, fontSize: 13 },

  logsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logsTitle: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.ink },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: REST_COLORS.border,
    paddingBottom: 6, marginBottom: 2,
  },
  tableHeaderCell: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.muted },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: REST_COLORS.divider, alignItems: 'flex-start' },
  tableCell: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.ink, lineHeight: 17 },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  colTimestamp: { flex: 2.2 },
  colAnalyzed:  { flex: 2 },
  colOil:       { flex: 1, textAlign: 'right' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
<<<<<<< HEAD
    backgroundColor: COLORS.card,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 12, overflow: 'hidden',
  },
  statCell: { width: '50%', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statCellRight: { borderLeftWidth: 1, borderLeftColor: COLORS.border },
  statCellBottom: { borderBottomWidth: 0 },
  statCellLabel: {
    fontFamily: FONTS.bodyMedium, fontSize: 10, color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6, marginBottom: 2,
  },
  statCellValue: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.textPrimary },

  
});
=======
    backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.card, borderWidth: 1, borderColor: REST_COLORS.border,
    marginBottom: REST_SPACING.gap, overflow: 'hidden',
  },
  statCell: { width: '50%', padding: 16, borderBottomWidth: 1, borderBottomColor: REST_COLORS.border },
  statCellRight: { borderLeftWidth: 1, borderLeftColor: REST_COLORS.border },
  statCellBottom: { borderBottomWidth: 0 },
  statCellLabel: {
    fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted,
    marginTop: 6, marginBottom: 2,
  },
  statCellValue: { fontFamily: REST_FONTS.bold, fontSize: 18, color: REST_COLORS.ink },
});
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
