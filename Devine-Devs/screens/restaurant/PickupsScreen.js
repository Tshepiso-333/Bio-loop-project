import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
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
import { formatLongDate, getInitials, mapUpcomingCycle } from '../../src/utils/restaurantViewModels';

const OPEN_PICKUP_STATUSES = [
  'pending', 'assigned', 'scheduled', 'in_transit', 'arrival', 'in_progress',
  'collected', 'arrived_manufacturer',
];
const PRE_TRIP_STATUSES = ['pending', 'assigned', 'scheduled'];
const CANNOT_CANCEL_STATUSES = [
  'in_transit', 'arrival', 'in_progress', 'collected',
  'arrived_manufacturer', 'completed', 'cancelled',
];
const PROGRESS_STEPS = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_transit', label: 'On the way' },
  { key: 'arrival', label: 'Arrived' },
  { key: 'collected', label: 'Collected' },
  { key: 'arrived_manufacturer', label: 'Delivered' },
];
const STATUS_STEP_INDEX = {
  scheduled: 0, in_transit: 1, arrival: 2, in_progress: 2,
  collected: 3, arrived_manufacturer: 4,
};
const STATUS_COPY = {
  pending: {
    title: "We're arranging your pickup.",
    detail: 'Your request is recorded. A collection time and driver are not confirmed yet.',
  },
  assigned: {
    title: "We're arranging your pickup.",
    detail: 'Your request is recorded. Collection details will appear once confirmed.',
  },
  scheduled: {
    title: 'Your collection is scheduled.',
    detail: 'The confirmed appointment details are shown below.',
  },
  in_transit: {
    title: 'Your driver is on the way.',
    detail: 'The collection is currently in progress.',
  },
  arrival: {
    title: 'Your driver has arrived.',
    detail: 'The driver is at your restaurant for the collection.',
  },
  in_progress: {
    title: 'Your oil is being collected.',
    detail: 'The collection is currently being recorded.',
  },
  collected: {
    title: 'Your oil has been collected.',
    detail: 'It is on its way to the manufacturer.',
  },
  arrived_manufacturer: {
    title: 'Your oil reached the manufacturer.',
    detail: 'The collection is awaiting its recorded completion.',
  },
};

function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateBeforeToday(value) {
  if (!value) return false;
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10) < toLocalDateKey();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  date.setHours(23, 59, 59, 999);
  return date.getTime() < Date.now();
}

function formatTimeWindow(pickup) {
  const start = pickup?.pickup_time_start ? String(pickup.pickup_time_start).slice(0, 5) : null;
  const end = pickup?.pickup_time_end ? String(pickup.pickup_time_end).slice(0, 5) : null;
  if (start && end) return `${start} - ${end}`;
  return start;
}

function mapCurrentPickup(pickup) {
  if (!pickup) return null;
  const dateHasPassed = PRE_TRIP_STATUSES.includes(pickup.status) && isDateBeforeToday(pickup.pickup_date);
  const driverName = pickup.collectors?.full_name ?? null;
  let statusCopy = STATUS_COPY[pickup.status] ?? {
    title: 'Collection update available.',
    detail: 'The latest recorded details are shown below.',
  };
  if (driverName && ['pending', 'assigned'].includes(pickup.status)) {
    statusCopy = {
      title: 'A driver is assigned.',
      detail: 'Collection timing will appear here once it is recorded.',
    };
  } else if (pickup.status === 'scheduled' && !pickup.pickup_date && !formatTimeWindow(pickup)) {
    statusCopy = {
      title: 'Your collection is scheduled.',
      detail: 'The collection date and time window are not available yet.',
    };
  }
  return {
    title: dateHasPassed ? 'Pickup date needs an update.' : statusCopy.title,
    detail: dateHasPassed
      ? 'The recorded date has passed, so it is not shown as a valid upcoming appointment.'
      : statusCopy.detail,
    date: pickup.pickup_date ? formatLongDate(pickup.pickup_date) : null,
    dateLabel: dateHasPassed ? 'Previous date' : pickup.status === 'scheduled' ? 'Confirmed date' : 'Recorded date',
    timeWindow: dateHasPassed ? null : formatTimeWindow(pickup),
    driverName,
    driverInitials: driverName ? getInitials(driverName, 'D') : null,
    currentStep: STATUS_STEP_INDEX[pickup.status] ?? null,
    dateHasPassed,
  };
}

function mapHistoryPickup(pickup) {
  const isCancelled = pickup.status === 'cancelled';
  const actualVolume = Number(pickup.actual_volume_liters);
  const hasActualVolume = pickup.actual_volume_liters !== null
    && pickup.actual_volume_liters !== undefined
    && Number.isFinite(actualVolume);
  return {
    id: String(pickup.id),
    title: isCancelled ? 'Pickup cancelled' : 'Collection completed',
    date: formatLongDate(pickup.completed_at ?? pickup.pickup_date ?? pickup.created_at),
    volume: hasActualVolume ? `${actualVolume.toLocaleString('en-ZA')} litres collected` : null,
    isCancelled,
  };
}

export default function PickupsScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const { pickups, pickupSchedules, loading, refreshing, refreshRestaurant, cancelPickup } = useRestaurant();
  const [cancelling, setCancelling] = useState(false);

  const profileInitials = useMemo(() => getInitials(profile?.full_name, 'RS'), [profile?.full_name]);
  const currentPickupRaw = useMemo(
    () => pickups.find((pickup) => OPEN_PICKUP_STATUSES.includes(pickup.status)) ?? null,
    [pickups]
  );
  const currentPickup = useMemo(() => mapCurrentPickup(currentPickupRaw), [currentPickupRaw]);
  const historyPickups = useMemo(
    () => pickups.filter((pickup) => ['completed', 'cancelled'].includes(pickup.status)).map(mapHistoryPickup),
    [pickups]
  );
  const upcomingCycle = useMemo(() => {
    const schedule = pickupSchedules.find(
      (item) => item.next_pickup_date && !isDateBeforeToday(item.next_pickup_date)
    );
    return schedule ? mapUpcomingCycle(schedule) : null;
  }, [pickupSchedules]);
  const canCancel = currentPickupRaw && !CANNOT_CANCEL_STATUSES.includes(currentPickupRaw.status);

  const handleCancelPickup = () => {
    if (!currentPickupRaw || !canCancel) return;
    Alert.alert('Cancel pickup', 'Cancel this pickup? This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel pickup',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelPickup(currentPickupRaw.id, 'Cancelled by restaurant');
          } catch (err) {
            Alert.alert('Could not cancel', err.message ?? 'Please try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <RestaurantHeader
        title="Pickups"
        avatarInitials={profileInitials}
        onAvatarPress={() => navigation.getParent()?.navigate('Profile')}
      />
      <RestaurantRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshRestaurant}
      >
        {loading && pickups.length === 0 ? <RestaurantLoadingBanner /> : null}
        <Text style={styles.pageQuestion}>When is my oil being collected?</Text>
        <Text style={styles.sectionLabel}>Current collection</Text>
        {currentPickup ? (
          <CurrentCollectionCard
            pickup={currentPickup}
            canCancel={canCancel}
            cancelling={cancelling}
            onCancel={handleCancelPickup}
          />
        ) : <NoCurrentCollection />}
        {upcomingCycle ? <UpcomingCycleSection cycle={upcomingCycle} /> : null}
        <PickupHelpOption
          disabled={Boolean(currentPickupRaw)}
          onPress={() => navigation.getParent()?.navigate('ManualPickup')}
        />
        <Text style={styles.sectionLabel}>Pickup history</Text>
        {historyPickups.length > 0 ? historyPickups.map((pickup) => (
          <HistoryPickupCard key={pickup.id} pickup={pickup} />
        )) : (
          <RestaurantEmptyBanner message="Completed and cancelled pickups will appear here." />
        )}
        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
    </View>
  );
}

function CurrentCollectionCard({ pickup, canCancel, cancelling, onCancel }) {
  return (
    <View style={[styles.card, pickup.dateHasPassed ? styles.cardWarning : styles.cardAccentPrimary]}>
      <View style={styles.statusHeaderRow}>
        <View style={styles.statusIcon}>
          <MaterialCommunityIcons
            name={pickup.dateHasPassed ? 'calendar-alert' : 'truck-outline'}
            size={22}
            color={pickup.dateHasPassed ? REST_COLORS.alertText : REST_COLORS.primary}
          />
        </View>
        <View style={styles.statusTextBlock}>
          <Text style={styles.statusTitle}>{pickup.title}</Text>
          <Text style={styles.statusDetail}>{pickup.detail}</Text>
        </View>
      </View>
      {pickup.currentStep !== null && !pickup.dateHasPassed ? <ProgressTracker currentStep={pickup.currentStep} /> : null}
      {pickup.date || pickup.timeWindow ? (
        <View style={styles.appointmentRow}>
          {pickup.date ? <DetailItem icon="calendar-outline" label={pickup.dateLabel} value={pickup.date} /> : null}
          {pickup.timeWindow ? <DetailItem icon="time-outline" label="Time window" value={pickup.timeWindow} /> : null}
        </View>
      ) : null}
      {pickup.driverName ? (
        <View style={styles.driverBlock}>
          <Text style={styles.detailLabel}>Assigned driver</Text>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}><Text style={styles.driverAvatarText}>{pickup.driverInitials}</Text></View>
            <Text style={styles.driverName}>{pickup.driverName}</Text>
          </View>
        </View>
      ) : null}
      {canCancel ? (
        <Pressable disabled={cancelling} onPress={onCancel} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
          <Text style={styles.cancelButtonText}>{cancelling ? 'Cancelling…' : 'Cancel pickup'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProgressTracker({ currentStep }) {
  return (
    <View style={styles.progressRow}>
      {PROGRESS_STEPS.map((step, index) => {
        const isCompleted = index <= currentStep;
        const isLast = index === PROGRESS_STEPS.length - 1;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepColumn}>
              <View style={[styles.stepDot, isCompleted ? styles.stepDotActive : styles.stepDotInactive]}>
                {isCompleted ? <Ionicons name="checkmark" size={8} color={REST_COLORS.white} /> : null}
              </View>
              <Text style={[styles.stepLabel, isCompleted && styles.stepLabelActive]}>{step.label}</Text>
            </View>
            {!isLast ? <View style={[styles.stepLine, index < currentStep && styles.stepLineActive]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailLabelRow}>
        <Ionicons name={icon} size={13} color={REST_COLORS.muted} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function NoCurrentCollection() {
  return (
    <View style={styles.card}>
      <View style={styles.statusHeaderRow}>
        <View style={styles.statusIcon}><Ionicons name="calendar-outline" size={22} color={REST_COLORS.primary} /></View>
        <View style={styles.statusTextBlock}>
          <Text style={styles.statusTitle}>No collection is currently recorded.</Text>
          <Text style={styles.statusDetail}>Confirmed pickup details will appear here when they are available.</Text>
        </View>
      </View>
    </View>
  );
}

function PickupHelpOption({ disabled, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.helpOption, disabled && styles.helpOptionDisabled, pressed && styles.pressed]}
    >
      <Ionicons name={disabled ? 'information-circle-outline' : 'help-circle-outline'} size={21} color={disabled ? REST_COLORS.muted : REST_COLORS.primary} />
      <View style={styles.helpTextBlock}>
        <Text style={styles.helpTitle}>Need help with a pickup?</Text>
        <Text style={styles.helpDetail}>
          {disabled ? 'An existing pickup must be completed or cancelled before another request.' : 'Send a manual pickup request.'}
        </Text>
      </View>
      {!disabled ? <Ionicons name="chevron-forward" size={18} color={REST_COLORS.muted} /> : null}
    </Pressable>
  );
}

function UpcomingCycleSection({ cycle }) {
  return (
    <View style={styles.cycleSection}>
      <Text style={styles.sectionLabel}>Recurring plan</Text>
      <View style={styles.cycleCard}>
        <View style={styles.cycleDateBlock}>
          <Text style={styles.cycleDateMonth}>{cycle.month}</Text>
          <Text style={styles.cycleDateDay}>{cycle.day}</Text>
        </View>
        <View style={styles.cycleTextBlock}>
          <Text style={styles.cycleTitle}>{cycle.title}</Text>
          <Text style={styles.cycleSubtitle}>{cycle.subtitle}</Text>
          <Text style={styles.cycleNote}>This plan is not a confirmed collection appointment.</Text>
        </View>
      </View>
    </View>
  );
}

function HistoryPickupCard({ pickup }) {
  return (
    <View style={[styles.historyCard, pickup.isCancelled && styles.historyCardCancelled]}>
      <View style={styles.historyIcon}>
        <Ionicons name={pickup.isCancelled ? 'close-circle-outline' : 'checkmark-circle-outline'} size={20} color={pickup.isCancelled ? REST_COLORS.muted : REST_COLORS.positive} />
      </View>
      <View style={styles.historyText}>
        <Text style={styles.historyTitle}>{pickup.title}</Text>
        <Text style={styles.historyDetail}>{pickup.date}{pickup.volume ? ` · ${pickup.volume}` : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },
  pageQuestion: { fontFamily: REST_FONTS.extraBold, fontSize: 23, lineHeight: 30, color: REST_COLORS.ink, marginBottom: 18 },
  sectionLabel: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.ink, marginBottom: 8 },
  card: { backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, padding: 16, marginBottom: REST_SPACING.gap, borderWidth: 1, borderColor: REST_COLORS.border, ...REST_SHADOWS.card },
  cardAccentPrimary: { borderLeftWidth: 3, borderLeftColor: REST_COLORS.primary },
  cardWarning: { borderLeftWidth: 3, borderLeftColor: REST_COLORS.alertText },
  statusHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: REST_COLORS.paleGreen, alignItems: 'center', justifyContent: 'center' },
  statusTextBlock: { flex: 1 },
  statusTitle: { fontFamily: REST_FONTS.bold, fontSize: 17, lineHeight: 23, color: REST_COLORS.ink, marginBottom: 4 },
  statusDetail: { fontFamily: REST_FONTS.medium, fontSize: 12, lineHeight: 18, color: REST_COLORS.body },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 },
  stepColumn: { alignItems: 'center', width: 54 },
  stepDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  stepDotActive: { backgroundColor: REST_COLORS.primary },
  stepDotInactive: { backgroundColor: REST_COLORS.border },
  stepLine: { flex: 1, height: 3, marginTop: 7, borderRadius: 2, backgroundColor: REST_COLORS.border },
  stepLineActive: { backgroundColor: REST_COLORS.primary },
  stepLabel: { fontFamily: REST_FONTS.medium, fontSize: 8, lineHeight: 11, color: REST_COLORS.muted, textAlign: 'center' },
  stepLabelActive: { color: REST_COLORS.primary },
  appointmentRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: REST_COLORS.divider, marginTop: 18, paddingTop: 14 },
  detailItem: { flex: 1 },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  detailLabel: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },
  detailValue: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.ink },
  driverBlock: { marginTop: 14 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 5 },
  driverAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: REST_COLORS.paleGreen, alignItems: 'center', justifyContent: 'center' },
  driverAvatarText: { fontFamily: REST_FONTS.bold, fontSize: 12, color: REST_COLORS.primary },
  driverName: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.ink },
  cancelButton: { alignItems: 'center', borderTopWidth: 1, borderTopColor: REST_COLORS.divider, marginTop: 16, paddingTop: 14 },
  cancelButtonText: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.negative },
  helpOption: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: REST_COLORS.card, borderWidth: 1, borderColor: REST_COLORS.border, borderRadius: REST_RADII.card, padding: 14, marginBottom: 22 },
  helpOptionDisabled: { backgroundColor: REST_COLORS.page },
  helpTextBlock: { flex: 1 },
  helpTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.ink },
  helpDetail: { fontFamily: REST_FONTS.medium, fontSize: 11, lineHeight: 16, color: REST_COLORS.muted, marginTop: 2 },
  cycleSection: { marginBottom: 2 },
  cycleCard: { backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, borderWidth: 1, borderColor: REST_COLORS.border, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: REST_SPACING.gap },
  cycleDateBlock: { width: 46, alignItems: 'center', marginRight: 14 },
  cycleDateMonth: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.primary },
  cycleDateDay: { fontFamily: REST_FONTS.extraBold, fontSize: 22, color: REST_COLORS.ink },
  cycleTextBlock: { flex: 1 },
  cycleTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.ink },
  cycleSubtitle: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.muted, marginTop: 2 },
  cycleNote: { fontFamily: REST_FONTS.medium, fontSize: 10, lineHeight: 14, color: REST_COLORS.muted, marginTop: 5 },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card, borderWidth: 1, borderColor: REST_COLORS.border, padding: 14, marginBottom: 10 },
  historyCardCancelled: { opacity: 0.78 },
  historyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: REST_COLORS.paleGreen, alignItems: 'center', justifyContent: 'center' },
  historyText: { flex: 1 },
  historyTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.ink },
  historyDetail: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted, marginTop: 3 },
  pressed: { opacity: 0.85 },
});
