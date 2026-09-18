import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
  formatDateTimeMultiline,
  formatRelativeTime,
  getInitials,
} from '../../src/utils/restaurantViewModels';

const OPEN_PICKUP_STATUSES = [
  'pending', 'assigned', 'scheduled', 'in_transit', 'arrival', 'in_progress',
  'collected', 'arrived_manufacturer',
];

function getFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapTankSummary(tank) {
  if (!tank) return null;
  const capacity = getFiniteNumber(tank.fill_percent);
  const distance = getFiniteNumber(tank.last_distance_cm);
  const lastUpdated = tank.last_updated ? new Date(tank.last_updated) : null;
  const hasValidUpdate = lastUpdated && !Number.isNaN(lastUpdated.getTime());
  const ageHours = hasValidUpdate ? (Date.now() - lastUpdated.getTime()) / 3600000 : null;
  const relativeUpdate = hasValidUpdate ? formatRelativeTime(tank.last_updated) : null;

  return {
    name: tank.name ?? 'Tank monitoring',
    capacity,
    distance,
    isActive: tank.is_active === true,
    connectionLabel: tank.is_active === true ? 'Tank connected' : 'Tank not marked active',
    freshnessTitle: relativeUpdate ? `Updated ${relativeUpdate}` : 'Update time unavailable',
    freshnessDetail: ageHours !== null && ageHours >= 24
      ? 'This sensor reading may be out of date and is not real-time.'
      : relativeUpdate
        ? 'Latest recorded sensor update.'
        : 'Sensor freshness cannot be confirmed.',
    isStale: ageHours === null || ageHours >= 24,
  };
}

function mapOilHistory(tankReadings = []) {
  return [...tankReadings]
    .map((reading, index) => {
      const value = getFiniteNumber(reading.fill_percent);
      const date = new Date(reading.recorded_at);
      if (value === null || value < 0 || Number.isNaN(date.getTime())) return null;
      return {
        id: String(reading.id ?? reading.recorded_at ?? index),
        timestamp: date.getTime(),
        day: date.toLocaleDateString('en-ZA', { weekday: 'short' }).toUpperCase(),
        value,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 7)
    .reverse();
}

function mapForecast(tank) {
  const days = getFiniteNumber(tank?.estimated_days_until_full);
  const hasPrediction = days !== null && days > 0;
  return {
    value: hasPrediction ? `${days} day${days === 1 ? '' : 's'}` : 'Prediction unavailable',
    detail: hasPrediction
      ? 'Based on the forecast currently recorded for this tank.'
      : 'There is not enough recorded data for a trustworthy forecast.',
  };
}

function mapQualityRows(qualityLogs = []) {
  return qualityLogs.slice(0, 6).map((log) => {
    const impurity = getFiniteNumber(log.impurity_pct);
    return {
      id: String(log.id),
      timestamp: formatDateTimeMultiline(log.created_at),
      analyzedBy: log.analyzed_by ?? 'Not analyzed',
      impurity: impurity === null ? 'Unavailable' : `${impurity}%`,
    };
  });
}

function mapDeviceDetails(tank, pickups = []) {
  const fahrenheit = getFiniteNumber(tank?.temperature_f);
  const lastCompletedPickup = pickups.find((pickup) => pickup.status === 'completed');
  const pickupDateValue = lastCompletedPickup?.completed_at ?? lastCompletedPickup?.pickup_date;
  const pickupDate = pickupDateValue ? new Date(pickupDateValue) : null;
  const pickupDateIsValid = pickupDate && !Number.isNaN(pickupDate.getTime());
  const sediment = tank?.sediment_level;

  return [
    {
      label: 'Temperature',
      value: fahrenheit === null ? 'Unavailable' : `${Math.round((fahrenheit - 32) * 5 / 9)}°C`,
      icon: 'thermometer-outline',
    },
    {
      label: 'Connection',
      value: tank?.connectivity ? String(tank.connectivity) : 'Unavailable',
      icon: 'wifi-outline',
    },
    {
      label: 'Last collection',
      value: pickupDateIsValid ? formatRelativeTime(pickupDateValue) : 'Unavailable',
      icon: 'time-outline',
    },
    {
      label: 'Sediment',
      value: sediment === null || sediment === undefined || sediment === '' ? 'Unavailable' : String(sediment),
      icon: 'beaker-outline',
    },
  ];
}

export default function MonitoringScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const { tank, tankReadings, qualityLogs, pickups, loading, refreshing, refreshRestaurant } = useRestaurant();

  const profileInitials = useMemo(() => getInitials(profile?.full_name, 'RS'), [profile?.full_name]);
  const tankSummary = useMemo(() => mapTankSummary(tank), [tank]);
  const oilHistory = useMemo(() => mapOilHistory(tankReadings), [tankReadings]);
  const forecast = useMemo(() => mapForecast(tank), [tank]);
  const qualityRows = useMemo(() => mapQualityRows(qualityLogs), [qualityLogs]);
  const deviceDetails = useMemo(() => mapDeviceDetails(tank, pickups), [tank, pickups]);
  const hasOpenPickup = useMemo(
    () => pickups.some((pickup) => OPEN_PICKUP_STATUSES.includes(pickup.status)),
    [pickups]
  );

  return (
    <View style={styles.root}>
      <RestaurantHeader
        title="Monitoring"
        avatarInitials={profileInitials}
        onAvatarPress={() => navigation.navigate('Profile')}
        showBack
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('RestaurantTabs', { screen: 'Home' });
        }}
      />
      <RestaurantRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshRestaurant}
      >
        {loading && !tank ? <RestaurantLoadingBanner /> : null}
        {tankSummary ? <TankSummaryCard summary={tankSummary} /> : !loading ? (
          <RestaurantEmptyBanner message="No oil tank is connected to this restaurant yet." />
        ) : null}

        <SectionLabel>Tank history</SectionLabel>
        {oilHistory.length > 0 ? <OilTrendChart data={oilHistory} /> : (
          <RestaurantEmptyBanner message="No valid tank history readings yet." />
        )}

        <ForecastCard forecast={forecast} />
        <PickupActionCard
          hasOpenPickup={hasOpenPickup}
          onPress={() => {
            if (hasOpenPickup) navigation.navigate('RestaurantTabs', { screen: 'Pickups' });
            else navigation.navigate('SchedulePickup');
          }}
        />

        <SectionLabel>Quality history</SectionLabel>
        {qualityRows.length > 0 ? <QualityLogs logs={qualityRows} /> : (
          <RestaurantEmptyBanner message="No quality logs yet." />
        )}

        <SectionLabel>Device information</SectionLabel>
        <DeviceDetailsGrid details={deviceDetails} />
        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
    </View>
  );
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function TankSummaryCard({ summary }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.tankNameRow}>
        <View style={styles.tankNameText}>
          <Text style={styles.tankEyebrow}>Oil tank</Text>
          <Text style={styles.tankName}>{summary.name}</Text>
        </View>
        <View style={[styles.connectionBadge, !summary.isActive && styles.connectionBadgeInactive]}>
          <View style={[styles.connectionDot, !summary.isActive && styles.connectionDotInactive]} />
          <Text style={[styles.connectionText, !summary.isActive && styles.connectionTextInactive]}>
            {summary.connectionLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.capacityLabel}>Tank capacity</Text>
      <Text style={styles.capacityValue}>
        {summary.capacity === null ? 'Unavailable' : `${Math.round(summary.capacity)}%`}
      </Text>

      <View style={styles.sensorRow}>
        <SensorDetail
          icon="resize-outline"
          label="Last sensor reading"
          value={summary.distance === null ? 'Unavailable' : `${summary.distance} cm`}
        />
        <SensorDetail
          icon={summary.isStale ? 'alert-circle-outline' : 'time-outline'}
          label="Sensor freshness"
          value={summary.freshnessTitle}
          detail={summary.freshnessDetail}
        />
      </View>
    </View>
  );
}

function SensorDetail({ icon, label, value, detail }) {
  return (
    <View style={styles.sensorDetail}>
      <Ionicons name={icon} size={17} color={REST_COLORS.primary} />
      <Text style={styles.sensorLabel}>{label}</Text>
      <Text style={styles.sensorValue}>{value}</Text>
      {detail ? <Text style={styles.sensorNote}>{detail}</Text> : null}
    </View>
  );
}

function OilTrendChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Recorded tank levels</Text>
        <Text style={styles.cardSubtitle}>Latest 7 readings</Text>
      </View>
      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const height = Math.max(2, (item.value / maxValue) * 84);
          const isLatest = index === data.length - 1;
          return (
            <View key={item.id} style={styles.barColumn}>
              <View style={{ flex: 1 }} />
              <Text style={styles.barValue}>{Math.round(item.value)}%</Text>
              <View style={[styles.bar, { height, backgroundColor: isLatest ? REST_COLORS.primary : REST_COLORS.accent }]} />
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ForecastCard({ forecast }) {
  return (
    <View style={styles.card}>
      <View style={styles.forecastTitleRow}>
        <Ionicons name="analytics-outline" size={18} color={REST_COLORS.primary} />
        <Text style={styles.cardTitle}>Tank forecast</Text>
      </View>
      <Text style={styles.forecastValue}>{forecast.value}</Text>
      <Text style={styles.forecastDetail}>{forecast.detail}</Text>
    </View>
  );
}

function PickupActionCard({ hasOpenPickup, onPress }) {
  return (
    <View style={styles.pickupActionCard}>
      <View style={styles.pickupActionText}>
        <Text style={styles.pickupActionTitle}>
          {hasOpenPickup ? 'A collection is already recorded.' : 'Need to arrange a collection?'}
        </Text>
        <Text style={styles.pickupActionDetail}>
          {hasOpenPickup ? 'Follow its latest status in Pickups.' : 'Choose a date using the existing pickup scheduler.'}
        </Text>
      </View>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.pickupActionButton, pressed && styles.pressed]}>
        <Text style={styles.pickupActionButtonText}>{hasOpenPickup ? 'View pickup' : 'Schedule'}</Text>
      </Pressable>
    </View>
  );
}

function QualityLogs({ logs }) {
  return (
    <View style={styles.card}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.colTimestamp]}>Recorded</Text>
        <Text style={[styles.tableHeaderCell, styles.colAnalyzed]}>Analyzed by</Text>
        <Text style={[styles.tableHeaderCell, styles.colImpurity]}>Impurity</Text>
      </View>
      {logs.map((log) => (
        <View key={log.id} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.colTimestamp]}>{log.timestamp}</Text>
          <Text style={[styles.tableCell, styles.colAnalyzed]}>{log.analyzedBy}</Text>
          <Text style={[styles.tableCell, styles.colImpurity]}>{log.impurity}</Text>
        </View>
      ))}
    </View>
  );
}

function DeviceDetailsGrid({ details }) {
  return (
    <View style={styles.detailsGrid}>
      {details.map((detail, index) => (
        <View key={detail.label} style={[styles.detailCell, index % 2 === 1 && styles.detailCellRight, index >= 2 && styles.detailCellBottom]}>
          <Ionicons name={detail.icon} size={16} color={REST_COLORS.muted} />
          <Text style={styles.detailCellLabel}>{detail.label}</Text>
          <Text style={styles.detailCellValue}>{detail.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },
  sectionLabel: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.ink, marginBottom: 8, marginTop: 4 },
  summaryCard: { backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: REST_COLORS.border, ...REST_SHADOWS.card },
  tankNameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 22 },
  tankNameText: { flex: 1 },
  tankEyebrow: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted, marginBottom: 2 },
  tankName: { fontFamily: REST_FONTS.bold, fontSize: 19, color: REST_COLORS.ink },
  connectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: REST_COLORS.paleGreen, borderRadius: REST_RADII.pill, paddingHorizontal: 8, paddingVertical: 5 },
  connectionBadgeInactive: { backgroundColor: REST_COLORS.page },
  connectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: REST_COLORS.primary },
  connectionDotInactive: { backgroundColor: REST_COLORS.muted },
  connectionText: { fontFamily: REST_FONTS.semiBold, fontSize: 9, color: REST_COLORS.primary },
  connectionTextInactive: { color: REST_COLORS.muted },
  capacityLabel: { fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.body },
  capacityValue: { fontFamily: REST_FONTS.extraBold, fontSize: 58, lineHeight: 68, color: REST_COLORS.primary, marginBottom: 18 },
  sensorRow: { flexDirection: 'row', gap: 10 },
  sensorDetail: { flex: 1, backgroundColor: REST_COLORS.page, borderRadius: REST_RADII.chip, padding: 12, minHeight: 112 },
  sensorLabel: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted, marginTop: 7, marginBottom: 3 },
  sensorValue: { fontFamily: REST_FONTS.bold, fontSize: 14, lineHeight: 19, color: REST_COLORS.ink },
  sensorNote: { fontFamily: REST_FONTS.medium, fontSize: 9, lineHeight: 13, color: REST_COLORS.muted, marginTop: 4 },
  card: { backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, padding: 16, marginBottom: REST_SPACING.gap, borderWidth: 1, borderColor: REST_COLORS.border, ...REST_SHADOWS.card },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.ink },
  cardSubtitle: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 132, gap: 6 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center' },
  barValue: { fontFamily: REST_FONTS.medium, fontSize: 8, color: REST_COLORS.muted, marginBottom: 3 },
  bar: { width: '100%', borderRadius: 4, marginBottom: 4 },
  barLabel: { fontFamily: REST_FONTS.medium, fontSize: 8, color: REST_COLORS.muted },
  forecastTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  forecastValue: { fontFamily: REST_FONTS.extraBold, fontSize: 25, color: REST_COLORS.ink, marginBottom: 4 },
  forecastDetail: { fontFamily: REST_FONTS.medium, fontSize: 12, lineHeight: 18, color: REST_COLORS.body },
  pickupActionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: REST_COLORS.paleGreen, borderRadius: REST_RADII.card, padding: 14, marginBottom: 20 },
  pickupActionText: { flex: 1 },
  pickupActionTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.ink },
  pickupActionDetail: { fontFamily: REST_FONTS.medium, fontSize: 10, lineHeight: 15, color: REST_COLORS.body, marginTop: 2 },
  pickupActionButton: { backgroundColor: REST_COLORS.primary, borderRadius: REST_RADII.pill, paddingHorizontal: 13, paddingVertical: 8 },
  pickupActionButtonText: { fontFamily: REST_FONTS.bold, fontSize: 11, color: REST_COLORS.white },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: REST_COLORS.border, paddingBottom: 7 },
  tableHeaderCell: { fontFamily: REST_FONTS.semiBold, fontSize: 10, color: REST_COLORS.muted },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: REST_COLORS.divider },
  tableCell: { fontFamily: REST_FONTS.medium, fontSize: 11, lineHeight: 16, color: REST_COLORS.ink },
  colTimestamp: { flex: 2.1 },
  colAnalyzed: { flex: 1.8 },
  colImpurity: { flex: 1.2, textAlign: 'right' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, borderWidth: 1, borderColor: REST_COLORS.border, marginBottom: REST_SPACING.gap, overflow: 'hidden' },
  detailCell: { width: '50%', padding: 16, borderBottomWidth: 1, borderBottomColor: REST_COLORS.border },
  detailCellRight: { borderLeftWidth: 1, borderLeftColor: REST_COLORS.border },
  detailCellBottom: { borderBottomWidth: 0 },
  detailCellLabel: { fontFamily: REST_FONTS.medium, fontSize: 10, color: REST_COLORS.muted, marginTop: 6, marginBottom: 3 },
  detailCellValue: { fontFamily: REST_FONTS.bold, fontSize: 15, color: REST_COLORS.ink },
  pressed: { opacity: 0.85 },
});
