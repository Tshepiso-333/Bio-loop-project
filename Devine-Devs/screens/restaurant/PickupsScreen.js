import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../src/hooks/useProfile';
import { useRestaurant } from '../../src/hooks/useRestaurant';
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
];

const CANNOT_CANCEL_STATUSES = ['in_transit', 'arrival', 'in_progress', 'completed', 'cancelled'];

// ─── THEME COLOURS (matching manufacturer) ───────────────────────────────────

const COLORS = {
  background: '#F4F4EF',
  card: '#FFFFFF',
  green: '#10b981',
  greenDark: '#059669',
  greenCard: '#10b981',
  greenLight: '#D1FAE5',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  progressInactive: '#CBD5E1',
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

export default function PickupsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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

  // Header Component with Notifications and Profile
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
          <Text style={styles.headerTitle}>Pickups</Text>
          <View style={styles.headerRight}>
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
            <Ionicons name="time-outline" size={40} color={COLORS.textMuted} />
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
                  <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.stepLabel, isCompleted ? styles.stepLabelActive : styles.stepLabelInactive]}>
                {step.label.toUpperCase()}
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
            style={[styles.tabSwitcherItem, isActive && styles.tabSwitcherItemActive]}
            onPress={() => onSelect(tab)}
          >
            <Ionicons
              name={iconName}
              size={14}
              color={isActive ? '#FFFFFF' : COLORS.textMuted}
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
      style={styles.manualRequestCard}
      onPress={() => navigation.navigate('ManualPickup')}
    >
      <LinearGradient
        colors={[COLORS.green, COLORS.greenDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.manualRequestGradient}
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
      </LinearGradient>
    </Pressable>
  );
}

function UpcomingPickupCard({ pickup, canCancel, onCancel, cancelling }) {
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
        </View>
      </View>

      <View style={styles.pickupMetaRow}>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.pickupMetaLabel}>Date</Text>
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.date}</Text>
        </View>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
            <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.pickupMetaLabel}>ETA Window</Text>
          </View>
          <Text style={styles.pickupMetaValue}>{pickup.etaWindow}</Text>
        </View>
      </View>

      <View style={styles.pickupMetaRow}>
        <View style={styles.pickupMetaCell}>
          <View style={styles.metaLabelRow}>
            <Ionicons name="person-outline" size={11} color={COLORS.textMuted} />
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
            <Ionicons name="water-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.pickupMetaLabel}>Est. Volume</Text>
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
        <Ionicons name="repeat-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.cycleSectionLabel}>Upcoming Cycle</Text>
      </View>
      <Pressable style={styles.cycleCard}>
        <View style={styles.cycleDateBlock}>
          <Text style={styles.cycleDateMonth}>{cycle.month}</Text>
          <Text style={styles.cycleDateDay}>{cycle.day}</Text>
        </View>
        <View style={styles.cycleTextBlock}>
          <Text style={styles.cycleTitle}>{cycle.title}</Text>
          <Text style={styles.cycleSubtitle}>{cycle.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </Pressable>
    </View>
  );
}

function HistoryPickupCard({ pickup }) {
  const card = mapUpcomingPickupCard(pickup);
  if (!card) return null;

  return (
    <View style={styles.card}>
      <View style={styles.pickupBadgeRow}>
        <View style={styles.autoScheduledBadge}>
          <Ionicons name="checkmark-done-outline" size={12} color={COLORS.green} />
          <Text style={styles.autoScheduledText}>COMPLETED</Text>
        </View>
      </View>
      <Text style={styles.activePickupTitle}>{card.date}</Text>
      <Text style={styles.pickupMetaValue}>{card.estimatedVolume}</Text>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  
  // Header Styles
  header: {
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },

  activePickupHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  activePickupLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activePulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
  activePickupLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: COLORS.green, letterSpacing: 0.8 },
  activePickupTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.textPrimary, marginBottom: 20 },

  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepColumn: { alignItems: 'center', width: 60 },
  stepDot: {
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
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
  },
  tabSwitcherItem: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9,
  },
  tabSwitcherItemActive: { backgroundColor: COLORS.textPrimary },
  tabSwitcherText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.textMuted },
  tabSwitcherTextActive: { color: '#FFFFFF' },

  manualRequestCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  manualRequestGradient: {
    padding: 20,
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

  cancelPickupBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  cancelPickupBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: '#DC2626' },

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