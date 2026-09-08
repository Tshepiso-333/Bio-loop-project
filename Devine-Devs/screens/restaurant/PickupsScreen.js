<<<<<<< HEAD
import React, { useState } from 'react';
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

const ACTIVE_PICKUP = {
  visible: true,
  statusLabel: 'Active Pickup',
  statusTitle: 'Driver en route',
  currentStep: 1,
};

const PROGRESS_STEPS = [
  { key: 'scheduled',  label: 'Scheduled' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'arrival',    label: 'Arrival' },
];

const UPCOMING_PICKUP = {
  scheduledType: 'Auto-Scheduled',
  status: 'Confirmed',
  date: 'Oct 24, 2023',
  etaWindow: '09:00 - 11:30',
  driverName: 'Simphiwe',
  driverInitials: 'S',
  estimatedVolume: '45 Liters',
};

const UPCOMING_CYCLE = {
  month: 'NOV',
  day: '07',
  title: 'Routine Pickup',
  subtitle: 'Bi-weekly recurring',
};



// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  background: '#F4F4EF',
  card: '#FFFFFF',
  green: '#16A34A',
  greenDark: '#14532D',
  greenCard: '#1A5C32',
  greenLight: '#DCFCE7',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  progressInactive: '#CBD5E1',
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

// ─── ICON HELPER ──────────────────────────────────────────────────────────────

function Icon({ library = 'Ionicons', name, size, color }) {
  if (library === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function PickupsScreen() {
<<<<<<< HEAD
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <RestaurantHeader name="KitchenSteward" />

        {ACTIVE_PICKUP.visible && (
          <ActivePickupCard pickup={ACTIVE_PICKUP} steps={PROGRESS_STEPS} />
        )}
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

        <TabSwitcher activeTab={activeTab} onSelect={setActiveTab} />

        {activeTab === 'upcoming' ? (
          <>
            <ManualRequestCard />
<<<<<<< HEAD
            <UpcomingPickupCard pickup={UPCOMING_PICKUP} />
            <UpcomingCycleSection cycle={UPCOMING_CYCLE} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={40} color={COLORS.textMuted} />
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
            <Text style={styles.emptyStateTitle}>No history yet</Text>
            <Text style={styles.emptyStateText}>
              Completed pickups will appear here.
            </Text>
          </View>
        )}

<<<<<<< HEAD
        <View style={{ height: 16 }} />
      </ScrollView>

      
=======
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

function ActivePickupCard({ pickup, steps }) {
  return (
    <View style={styles.card}>
      <View style={styles.activePickupHeaderRow}>
        <View style={styles.activePickupLabelRow}>
          <View style={styles.activePulseDot} />
          <Text style={styles.activePickupLabel}>
            {pickup.statusLabel.toUpperCase()}
          </Text>
        </View>
        <MaterialCommunityIcons name="truck-outline" size={22} color={COLORS.green} />
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
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
<<<<<<< HEAD
                  <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.stepLabel, isCompleted ? styles.stepLabelActive : styles.stepLabelInactive]}>
                {step.label.toUpperCase()}
=======
                  <Ionicons name="checkmark" size={8} color={REST_COLORS.white} />
                )}
              </View>
              <Text style={[styles.stepLabel, isCompleted ? styles.stepLabelActive : styles.stepLabelInactive]}>
                {step.label}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
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
<<<<<<< HEAD
            style={[styles.tabSwitcherItem, isActive && styles.tabSwitcherItemActive]}
=======
            style={({ pressed }) => [
              styles.tabSwitcherItem,
              isActive && styles.tabSwitcherItemActive,
              pressed && { opacity: 0.85 },
            ]}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
            onPress={() => onSelect(tab)}
          >
            <Ionicons
              name={iconName}
              size={14}
<<<<<<< HEAD
              color={isActive ? '#FFFFFF' : COLORS.textMuted}
=======
              color={isActive ? REST_COLORS.white : REST_COLORS.muted}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
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

<<<<<<< HEAD
// ── navigation added inside this component so it can use the hook correctly
=======
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
function ManualRequestCard() {
  const navigation = useNavigation();
  return (
    <Pressable
<<<<<<< HEAD
      style={styles.manualRequestCard}
=======
      style={({ pressed }) => [styles.manualRequestCard, pressed && { opacity: 0.9 }]}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
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

<<<<<<< HEAD
function UpcomingPickupCard({ pickup }) {
  return (
    <View style={styles.card}>
      <View style={styles.pickupBadgeRow}>
        <View style={styles.autoScheduledBadge}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.green} />
          <Text style={styles.autoScheduledText}>
            {pickup.scheduledType.toUpperCase()}
          </Text>
        </View>
        <View style={styles.confirmedBadge}>
          <Ionicons name="checkmark-circle" size={11} color={COLORS.green} />
          <Text style={styles.confirmedText}>{pickup.status.toUpperCase()}</Text>
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        </View>
      </View>

      <View style={styles.pickupMetaRow}>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
<<<<<<< HEAD
            <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
=======
            <Ionicons name="calendar-outline" size={11} color={REST_COLORS.muted} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
            <Text style={styles.pickupMetaLabel}>Date</Text>
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.date}</Text>
        </View>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
<<<<<<< HEAD
            <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.pickupMetaLabel}>ETA Window</Text>
=======
            <Ionicons name="time-outline" size={11} color={REST_COLORS.muted} />
            <Text style={styles.pickupMetaLabel}>ETA window</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.etaWindow}</Text>
        </View>
      </View>

      <View style={styles.pickupMetaRow}>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
<<<<<<< HEAD
            <Ionicons name="person-outline" size={11} color={COLORS.textMuted} />
=======
            <Ionicons name="person-outline" size={11} color={REST_COLORS.muted} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
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
<<<<<<< HEAD
            <Ionicons name="water-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.pickupMetaLabel}>Est. Volume</Text>
=======
            <Ionicons name="water-outline" size={11} color={REST_COLORS.muted} />
            <Text style={styles.pickupMetaLabel}>Est. volume</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.estimatedVolume}</Text>
        </View>
      </View>
<<<<<<< HEAD
=======

      {canCancel ? (
        <Pressable style={styles.cancelPickupBtn} onPress={onCancel} disabled={cancelling}>
          <Text style={styles.cancelPickupBtnText}>{cancelling ? 'Cancelling…' : 'Cancel pickup'}</Text>
        </Pressable>
      ) : null}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </View>
  );
}

function UpcomingCycleSection({ cycle }) {
  return (
    <View>
      <View style={styles.cycleSectionLabelRow}>
<<<<<<< HEAD
        <Ionicons name="repeat-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.cycleSectionLabel}>Upcoming Cycle</Text>
      </View>
      <Pressable style={styles.cycleCard}>
=======
        <Ionicons name="repeat-outline" size={13} color={REST_COLORS.muted} />
        <Text style={styles.cycleSectionLabel}>Upcoming cycle</Text>
      </View>
      <View style={styles.cycleCard}>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        <View style={styles.cycleDateBlock}>
          <Text style={styles.cycleDateMonth}>{cycle.month}</Text>
          <Text style={styles.cycleDateDay}>{cycle.day}</Text>
        </View>
        <View style={styles.cycleTextBlock}>
          <Text style={styles.cycleTitle}>{cycle.title}</Text>
          <Text style={styles.cycleSubtitle}>{cycle.subtitle}</Text>
        </View>
<<<<<<< HEAD
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </Pressable>
=======
      </View>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </View>
  );
}

<<<<<<< HEAD

=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
<<<<<<< HEAD
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  restaurantHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  restaurantIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  restaurantName: { flex: 1, fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  bellButton: { padding: 4 },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  activePickupHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  activePickupLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
<<<<<<< HEAD
  activePulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
  activePickupLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.green, letterSpacing: 0.8 },
  activePickupTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.textPrimary, marginBottom: 20 },
=======
  activePulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: REST_COLORS.primary },
  activePickupLabel: { fontFamily: REST_FONTS.semiBold, fontSize: 12, color: REST_COLORS.primary },
  activePickupTitle: { fontFamily: REST_FONTS.bold, fontSize: 18, color: REST_COLORS.ink, marginBottom: 20 },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepColumn: { alignItems: 'center', width: 60 },
  stepDot: {
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
<<<<<<< HEAD
  stepDotActive: { backgroundColor: COLORS.green },
  stepDotInactive: { backgroundColor: COLORS.progressInactive },
  stepLine: { flex: 1, height: 3, marginTop: 7, borderRadius: 2 },
  stepLineActive: { backgroundColor: COLORS.green },
  stepLineInactive: { backgroundColor: COLORS.progressInactive },
  stepLabel: { fontFamily: FONTS.bodyMedium, fontSize: 8, letterSpacing: 0.4, textAlign: 'center' },
  stepLabelActive: { color: COLORS.green },
  stepLabelInactive: { color: COLORS.textMuted },

  tabSwitcher: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderRadius: 12, padding: 4, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },
  tabSwitcherItem: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
  },
<<<<<<< HEAD
  tabSwitcherItemActive: { backgroundColor: COLORS.textPrimary },
  tabSwitcherText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.textMuted },
  tabSwitcherTextActive: { color: '#FFFFFF' },

  manualRequestCard: {
    backgroundColor: COLORS.greenCard,
    borderRadius: 16, padding: 20, marginBottom: 12,
  },
  manualRequestIconWrap: { marginBottom: 8 },
  manualRequestTitle: { fontFamily: FONTS.bold, fontSize: 20, color: '#FFFFFF', marginBottom: 4 },
  manualRequestSubtitle: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  manualRequestArrow: { position: 'absolute', top: 20, right: 20 },

  pickupBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  autoScheduledBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  autoScheduledText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green, letterSpacing: 0.5 },
  confirmedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  confirmedText: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.green, letterSpacing: 0.4 },
  pickupMetaRow: { flexDirection: 'row', marginBottom: 12 },
  pickupMetaCell: { flex: 1 },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  pickupMetaLabel: { fontFamily: FONTS.bodyMedium, fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickupMetaValue: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center',
  },
  driverAvatarText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.green },

  cycleSectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  cycleSectionLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  cycleCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 12,
  },
  cycleDateBlock: { width: 46, alignItems: 'center', marginRight: 14 },
  cycleDateMonth: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.green, letterSpacing: 0.6, textTransform: 'uppercase' },
  cycleDateDay: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.textPrimary, lineHeight: 26 },
  cycleTextBlock: { flex: 1 },
  cycleTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.textPrimary, marginBottom: 2 },
  cycleSubtitle: { fontFamily: FONTS.bodyRegular, fontSize: 12, color: COLORS.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyStateTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.textSecondary },
  emptyStateText: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  
});
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
