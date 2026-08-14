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
import {
  getActivePickup,
  getCompletedPickups,
  getInitials,
  getUpcomingPickup,
  mapActivePickupCard,
  mapUpcomingCycle,
  mapUpcomingPickupCard,
} from '../../src/utils/restaurantViewModels';

const PROGRESS_STEPS = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'arrival', label: 'Arrival' },
  { key: 'collected', label: 'Collected' },
  { key: 'arrived_manufacturer', label: 'Delivered' },
];

const CANNOT_CANCEL_STATUSES = [
  'in_transit',
  'arrival',
  'in_progress',
  'collected',
  'arrived_manufacturer',
  'completed',
  'cancelled',
];

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function PickupsScreen() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { profile } = useProfile();
  const {
    pickups,
    pickupSchedules,
    loading,
    refreshing,
    refreshRestaurant,
    cancelPickup,
  } = useRestaurant();
  const [cancelling, setCancelling] = useState(false);

  const profileInitials = useMemo(
    () => getInitials(profile?.full_name, 'RS'),
    [profile?.full_name]
  );
  const activePickup = useMemo(
    () => mapActivePickupCard(getActivePickup(pickups)),
    [pickups]
  );
  const upcomingPickupRaw = useMemo(() => getUpcomingPickup(pickups), [pickups]);
  const upcomingPickup = useMemo(
    () => mapUpcomingPickupCard(upcomingPickupRaw),
    [upcomingPickupRaw]
  );

  const handleCancelPickup = () => {
    if (!upcomingPickupRaw) return;
    Alert.alert(
      'Cancel pickup',
      'Cancel this scheduled pickup? This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel pickup',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelPickup(upcomingPickupRaw.id, 'Cancelled by restaurant');
            } catch (err) {
              Alert.alert('Could not cancel', err.message ?? 'Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };
  const upcomingCycle = useMemo(
    () => mapUpcomingCycle(pickupSchedules[0]),
    [pickupSchedules]
  );
  const historyPickups = useMemo(() => getCompletedPickups(pickups), [pickups]);

  return (
    <View style={styles.root}>
      <RestaurantHeader title="Pickups" avatarInitials={profileInitials} />

      <RestaurantRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshRestaurant}
      >
        {loading && pickups.length === 0 ? <RestaurantLoadingBanner /> : null}

        {activePickup.visible ? (
          <ActivePickupCard pickup={activePickup} steps={PROGRESS_STEPS} />
        ) : null}

        <TabSwitcher activeTab={activeTab} onSelect={setActiveTab} />

        {activeTab === 'upcoming' ? (
          <>
            <ManualRequestCard />
            {upcomingPickup ? (
              <UpcomingPickupCard
                pickup={upcomingPickup}
                canCancel={!CANNOT_CANCEL_STATUSES.includes(upcomingPickupRaw?.status)}
                onCancel={handleCancelPickup}
                cancelling={cancelling}
              />
            ) : (
              <RestaurantEmptyBanner message="No upcoming pickups scheduled." />
            )}
            {upcomingCycle ? (
              <UpcomingCycleSection cycle={upcomingCycle} />
            ) : null}
          </>
        ) : historyPickups.length > 0 ? (
          historyPickups.map((pickup) => (
            <HistoryPickupCard key={pickup.id} pickup={pickup} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={40} color={REST_COLORS.muted} />
            <Text style={styles.emptyStateTitle}>No history yet</Text>
            <Text style={styles.emptyStateText}>
              Completed pickups will appear here.
            </Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </RestaurantRefreshScrollView>
    </View>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
// One card family: `card` base + a status accent strip on the left
// (active/upcoming = primary, completed = muted-positive).

function ActivePickupCard({ pickup, steps }) {
  return (
    <View style={[styles.card, styles.cardAccentPrimary]}>
      <View style={styles.activePickupHeaderRow}>
        <View style={styles.activePickupLabelRow}>
          <View style={styles.activePulseDot} />
          <Text style={styles.activePickupLabel}>{pickup.statusLabel}</Text>
        </View>
        <MaterialCommunityIcons name="truck-outline" size={22} color={REST_COLORS.primary} />
      </View>

      <Text style={styles.activePickupTitle}>{pickup.statusTitle}</Text>
      <ProgressTracker steps={steps} currentStep={pickup.currentStep} />
    </View>
  );
}

function ProgressTracker({ steps, currentStep }) {
  return (
    <View style={styles.progressRow}>
      {steps.map((step, index) => {
        const isCompleted = index <= currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepColumn}>
              <View style={[styles.stepDot, isCompleted ? styles.stepDotActive : styles.stepDotInactive]}>
                {isCompleted && (
                  <Ionicons name="checkmark" size={8} color={REST_COLORS.white} />
                )}
              </View>
              <Text style={[styles.stepLabel, isCompleted ? styles.stepLabelActive : styles.stepLabelInactive]}>
                {step.label}
              </Text>
            </View>

            {!isLast && (
              <View style={[styles.stepLine, index < currentStep ? styles.stepLineActive : styles.stepLineInactive]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function TabSwitcher({ activeTab, onSelect }) {
  return (
    <View style={styles.tabSwitcher}>
      {['upcoming', 'history'].map((tab) => {
        const isActive = activeTab === tab;
        const label = tab.charAt(0).toUpperCase() + tab.slice(1);
        const iconName = tab === 'upcoming' ? 'calendar-outline' : 'time-outline';
        return (
          <Pressable
            key={tab}
            style={({ pressed }) => [
              styles.tabSwitcherItem,
              isActive && styles.tabSwitcherItemActive,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onSelect(tab)}
          >
            <Ionicons
              name={iconName}
              size={14}
              color={isActive ? REST_COLORS.white : REST_COLORS.muted}
            />
            <Text style={[styles.tabSwitcherText, isActive && styles.tabSwitcherTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ManualRequestCard() {
  const navigation = useNavigation();
  return (
    <Pressable
      style={({ pressed }) => [styles.manualRequestCard, pressed && { opacity: 0.9 }]}
      onPress={() => navigation.navigate('ManualPickup')}
    >
      <View style={styles.manualRequestIconWrap}>
        <Ionicons name="add-circle-outline" size={28} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.manualRequestTitle}>Request Manual Pickup</Text>
      <Text style={styles.manualRequestSubtitle}>
        For overflow or emergency disposal
      </Text>
      <View style={styles.manualRequestArrow}>
        <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.6)" />
      </View>
    </Pressable>
  );
}

function UpcomingPickupCard({ pickup, canCancel, onCancel, cancelling }) {
  return (
    <View style={[styles.card, styles.cardAccentPrimary]}>
      <View style={styles.pickupBadgeRow}>
        <View style={styles.typeBadge}>
          <Ionicons name="calendar-outline" size={12} color={REST_COLORS.primary} />
          <Text style={styles.typeBadgeText}>{pickup.scheduledType}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={11} color={REST_COLORS.primary} />
          <Text style={styles.statusBadgeText}>{pickup.status}</Text>
        </View>
      </View>

      <View style={styles.pickupMetaRow}>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
            <Ionicons name="calendar-outline" size={11} color={REST_COLORS.muted} />
            <Text style={styles.pickupMetaLabel}>Date</Text>
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.date}</Text>
        </View>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
            <Ionicons name="time-outline" size={11} color={REST_COLORS.muted} />
            <Text style={styles.pickupMetaLabel}>ETA window</Text>
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.etaWindow}</Text>
        </View>
      </View>

      <View style={styles.pickupMetaRow}>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
            <Ionicons name="person-outline" size={11} color={REST_COLORS.muted} />
            <Text style={styles.pickupMetaLabel}>Driver</Text>
          </View>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{pickup.driverInitials}</Text>
            </View>
            <Text style={styles.pickupMetaValue}>{pickup.driverName}</Text>
          </View>
        </View>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
            <Ionicons name="water-outline" size={11} color={REST_COLORS.muted} />
            <Text style={styles.pickupMetaLabel}>Est. volume</Text>
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.estimatedVolume}</Text>
        </View>
      </View>

      {canCancel ? (
        <Pressable style={styles.cancelPickupBtn} onPress={onCancel} disabled={cancelling}>
          <Text style={styles.cancelPickupBtnText}>{cancelling ? 'Cancelling…' : 'Cancel pickup'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function UpcomingCycleSection({ cycle }) {
  return (
    <View>
      <View style={styles.cycleSectionLabelRow}>
        <Ionicons name="repeat-outline" size={13} color={REST_COLORS.muted} />
        <Text style={styles.cycleSectionLabel}>Upcoming cycle</Text>
      </View>
      <View style={styles.cycleCard}>
        <View style={styles.cycleDateBlock}>
          <Text style={styles.cycleDateMonth}>{cycle.month}</Text>
          <Text style={styles.cycleDateDay}>{cycle.day}</Text>
        </View>
        <View style={styles.cycleTextBlock}>
          <Text style={styles.cycleTitle}>{cycle.title}</Text>
          <Text style={styles.cycleSubtitle}>{cycle.subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

function HistoryPickupCard({ pickup }) {
  const card = mapUpcomingPickupCard(pickup);
  if (!card) return null;

  return (
    <View style={[styles.card, styles.cardAccentDone]}>
      <View style={styles.pickupBadgeRow}>
        <View style={styles.typeBadge}>
          <Ionicons name="checkmark-done-outline" size={12} color={REST_COLORS.positive} />
          <Text style={styles.typeBadgeText}>Completed</Text>
        </View>
      </View>
      <Text style={styles.historyDate}>{card.date}</Text>
      <Text style={styles.pickupMetaValue}>{card.estimatedVolume}</Text>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: REST_SPACING.screenPadding, paddingTop: 8 },

  card: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    padding: 16, marginBottom: REST_SPACING.gap,
    borderWidth: 1, borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },
  cardAccentPrimary: { borderLeftWidth: 3, borderLeftColor: REST_COLORS.primary },
  cardAccentDone: { borderLeftWidth: 3, borderLeftColor: REST_COLORS.accentSoft },

  activePickupHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  activePickupLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activePulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: REST_COLORS.primary },
  activePickupLabel: { fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.primary },
  activePickupTitle: { fontFamily: REST_FONTS.bold, fontSize: 18, color: REST_COLORS.ink, marginBottom: 20 },

  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepColumn: { alignItems: 'center', width: 60 },
  stepDot: {
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stepDotActive: { backgroundColor: REST_COLORS.primary },
  stepDotInactive: { backgroundColor: REST_COLORS.border },
  stepLine: { flex: 1, height: 3, marginTop: 7, borderRadius: 2 },
  stepLineActive: { backgroundColor: REST_COLORS.primary },
  stepLineInactive: { backgroundColor: REST_COLORS.border },
  stepLabel: { fontFamily: REST_FONTS.medium, fontSize: 9, textAlign: 'center' },
  stepLabelActive: { color: REST_COLORS.primary },
  stepLabelInactive: { color: REST_COLORS.muted },

  tabSwitcher: {
    flexDirection: 'row', backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.chip, padding: 4, marginBottom: REST_SPACING.gap,
    borderWidth: 1, borderColor: REST_COLORS.border,
  },
  tabSwitcherItem: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
  },
  tabSwitcherItemActive: { backgroundColor: REST_COLORS.primary },
  tabSwitcherText: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.muted },
  tabSwitcherTextActive: { color: REST_COLORS.white },

  manualRequestCard: {
    borderRadius: REST_RADII.card,
    marginBottom: REST_SPACING.gap,
    backgroundColor: REST_COLORS.primary,
    padding: 20,
    ...REST_SHADOWS.button,
  },
  manualRequestIconWrap: { marginBottom: 8 },
  manualRequestTitle: { fontFamily: REST_FONTS.bold, fontSize: 20, color: REST_COLORS.white, marginBottom: 4 },
  manualRequestSubtitle: { fontFamily: REST_FONTS.medium, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  manualRequestArrow: { position: 'absolute', top: 20, right: 20 },

  pickupBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeBadgeText: { fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.primary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: REST_COLORS.paleGreen,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  statusBadgeText: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.primary },
  pickupMetaRow: { flexDirection: 'row', marginBottom: 12 },
  pickupMetaCell: { flex: 1 },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  pickupMetaLabel: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },
  pickupMetaValue: { fontFamily: REST_FONTS.semiBold, fontSize: 15, color: REST_COLORS.ink },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: REST_COLORS.paleGreen,
    justifyContent: 'center', alignItems: 'center',
  },
  driverAvatarText: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.primary },

  cancelPickupBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  cancelPickupBtnText: { fontFamily: REST_FONTS.semiBold, fontSize: 13, color: REST_COLORS.negative },

  cycleSectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  cycleSectionLabel: { fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.muted },
  cycleCard: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    borderWidth: 1, borderColor: REST_COLORS.border,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: REST_SPACING.gap,
    ...REST_SHADOWS.card,
  },
  cycleDateBlock: { width: 46, alignItems: 'center', marginRight: 14 },
  cycleDateMonth: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.primary },
  cycleDateDay: { fontFamily: REST_FONTS.extraBold, fontSize: 22, color: REST_COLORS.ink, lineHeight: 26 },
  cycleTextBlock: { flex: 1 },
  cycleTitle: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.ink, marginBottom: 2 },
  cycleSubtitle: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.muted },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyStateTitle: { fontFamily: REST_FONTS.bold, fontSize: 16, color: REST_COLORS.body },
  emptyStateText: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.muted, textAlign: 'center' },
});
