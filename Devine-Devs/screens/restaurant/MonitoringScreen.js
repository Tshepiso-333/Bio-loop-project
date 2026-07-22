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

// ─── ICON HELPER ──────────────────────────────────────────────────────────────

function Icon({ library = 'Ionicons', name, size, color }) {
  if (library === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

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
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

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
          <Ionicons name="wifi-outline" size={12} color={REST_COLORS.muted} />
          <Text style={styles.lastPingText}>Last ping: {info.lastPing}</Text>
        </View>
      </View>
    </View>
  );
}

function CapacityDisplay({ percent }) {
  return (
    <View style={styles.capacityBlock}>
      <Text style={styles.capacityLabel}>Current capacity</Text>
      <View style={styles.capacityRow}>
        <Text style={styles.capacityNumber}>{percent}</Text>
        <Text style={styles.capacityUnit}>%</Text>
      </View>
    </View>
  );
}

function OilTrendChart({ data }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const BAR_MAX_HEIGHT = 90;

  return (
    <View style={styles.card}>
      <View style={styles.chartHeaderRow}>
        <View style={styles.chartTitleRow}>
          <Ionicons name="bar-chart-outline" size={16} color={REST_COLORS.ink} />
          <Text style={styles.chartTitle}>Oil Level Trends</Text>
        </View>
        <Text style={styles.chartSubtitle}>Last 7 days</Text>
      </View>

      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * BAR_MAX_HEIGHT;
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
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PredictiveAlert({ alert }) {
  const navigation = useNavigation();
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertTitleRow}>
        <Ionicons name="warning-outline" size={14} color={REST_COLORS.alertText} />
        <Text style={styles.alertTitle}> Predictive alert</Text>
      </View>
      <Text style={styles.alertHours}>{alert.hoursUntilFull} Hours</Text>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Pressable
        style={({ pressed }) => [styles.scheduleButton, pressed && { opacity: 0.85 }]}
        onPress={() => navigation.navigate('SchedulePickup')}
      >
        <Ionicons name="calendar-outline" size={15} color={REST_COLORS.white} />
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
          <Ionicons name="document-text-outline" size={16} color={REST_COLORS.ink} />
          <Text style={styles.logsTitle}>Historical Quality Logs</Text>
        </View>
      </View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.colTimestamp]}>Timestamp</Text>
        <Text style={[styles.tableHeaderCell, styles.colAnalyzed]}>Analyzed{'\n'}by</Text>
        <Text style={[styles.tableHeaderCell, styles.colOil]}>Oil{'\n'}level</Text>
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
        const valueColor = remapStatColor(stat.valueColor);
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
              color={valueColor ?? REST_COLORS.muted}
            />
            <Text style={styles.statCellLabel}>{stat.label}</Text>
            <Text
              style={[
                styles.statCellValue,
                valueColor ? { color: valueColor } : null,
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
  },

  chartHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  colTimestamp: { flex: 2.2 },
  colAnalyzed:  { flex: 2 },
  colOil:       { flex: 1, textAlign: 'right' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
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
