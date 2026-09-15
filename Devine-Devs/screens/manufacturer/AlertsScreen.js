// screens/manufacturer/AlertsScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';

// ─── THEME (matches Dashboard / Quality / Finance / Suppliers) ───────────────

const T = {
  primary: '#10b981',
  primaryDark: '#059669',
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

  danger: '#ef4444',
  info: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
};

const S = { screenPadding: 16, cardPadding: 16, gap: 16 };
const R = { card: 16, pill: 999, chip: 10 };
const SH = {
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
};

// ─── ALERT TYPE REGISTRY ─────────────────────────────────────────────────────
//
// Only the 5 meaningful manufacturer alert types are supported. Anything
// else coming from the backend is mapped to the closest match, or dropped
// if it doesn't matter for a manufacturer (e.g. "driver logged in").

const ALERT_TYPES = {
  delivery_scheduled: {
    key: 'delivery_scheduled',
    section: 'updates',
    icon: 'time-outline',
    color: T.info,
    label: 'Delivery scheduled',
    action: { label: 'View collection', target: 'Suppliers' },
  },
  batch_received: {
    key: 'batch_received',
    section: 'action',
    icon: 'cube-outline',
    color: T.primary,
    label: 'Batch received',
    action: { label: 'Review batch', target: 'ManufacturerPayment' },
  },
  quality_verification: {
    key: 'quality_verification',
    section: 'action',
    icon: 'shield-checkmark-outline',
    color: T.gradeB,
    label: 'Quality check',
    action: { label: 'Review quality', target: 'Quality' },
  },
  low_quality: {
    key: 'low_quality',
    section: 'action',
    icon: 'warning-outline',
    color: T.gradeC,
    label: 'Low quality',
    action: { label: 'Review quality', target: 'Quality' },
  },
  inventory_low: {
    key: 'inventory_low',
    section: 'updates',
    icon: 'trending-down-outline',
    color: T.warning,
    label: 'Inventory low',
    action: { label: 'View collections', target: 'Suppliers' },
  },
  high_value_supply: {
    key: 'high_value_supply',
    section: 'updates',
    icon: 'cash-outline',
    color: T.primary,
    label: 'High-value supply',
    action: { label: 'View financial estimate', target: 'Finance' },
  },
};

const LEGACY_MAP = {
  quality: 'quality_verification',
  delivery: 'delivery_scheduled',
  inventory: 'inventory_low',
  critical: 'low_quality',
  warning: 'inventory_low',
  success: 'batch_received',
  info: 'delivery_scheduled',
};

const resolveAlertType = (rawAlert) => {
  if (!rawAlert) return null;
  const directKey = rawAlert.type_key ?? rawAlert.type;
  if (directKey && ALERT_TYPES[directKey]) return ALERT_TYPES[directKey];
  const catKey = LEGACY_MAP[rawAlert.category];
  if (catKey && ALERT_TYPES[catKey]) return ALERT_TYPES[catKey];
  return null;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Demo alerts (ids like "demo-1") exist only in the client and have no
// backend row, so we never hit the network for them.
const isDemoAlert = (id) => typeof id === 'string' && id.startsWith('demo-');

function formatRelative(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const AlertsScreen = ({ onBack }) => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const {
    alerts: contextAlerts = [],
    pickups = [],
    refreshManufacturer,
    updateAlertReadStatus,
    deleteAlert: deleteAlertFromContext,
  } = useManufacturerContext();
  const insets = useSafeAreaInsets();

  // ─── Demo data (replace with real backend data later) ────────────────────
  const demoAlerts = useMemo(
    () => [
      {
        id: 'demo-1',
        type_key: 'quality_verification',
        title: 'Quality verification required',
        message: 'Batch #0042 · 150L has arrived and needs a quality check.',
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        is_read: false,
        meta: { batchId: '0042', volume: 150 },
      },
      {
        id: 'demo-2',
        type_key: 'batch_received',
        title: 'New oil batch received',
        message: 'Batch #0043 · 220L from Golden Dragon Restaurant is ready to process.',
        created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        is_read: false,
        meta: { batchId: '0043', volume: 220 },
      },
      {
        id: 'demo-3',
        type_key: 'low_quality',
        title: 'Low-quality oil detected',
        message: 'Batch #0041 classified as Grade C. Additional processing may be required.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        is_read: false,
        meta: { batchId: '0041' },
      },
      {
        id: 'demo-4',
        type_key: 'delivery_scheduled',
        title: 'New oil delivery scheduled',
        message: 'Green Kitchen Restaurant · 150L. Estimated arrival 14:30.',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        is_read: true,
        meta: { restaurant: 'Green Kitchen', volume: 150, eta: '14:30' },
      },
      {
        id: 'demo-5',
        type_key: 'inventory_low',
        title: 'Inventory below preferred level',
        message: 'Available waste oil has dropped to 850L. Minimum required: 1,000L.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        is_read: false,
        meta: { current: 850, threshold: 1000 },
      },
      {
        id: 'demo-6',
        type_key: 'high_value_supply',
        title: 'High-value batch available',
        message: '300L of Grade A waste oil is ready. Estimated biodiesel output: 270L.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        is_read: true,
        meta: { volume: 300, output: 270 },
      },
    ],
    []
  );

  // ─── Map context alerts → canonical shape ────────────────────────────────
  const mapAlert = (a) => {
    const typeConfig = resolveAlertType(a);
    if (!typeConfig) return null;
    return {
      id: a.id,
      typeKey: typeConfig.key,
      typeConfig,
      title: a.title ?? typeConfig.label,
      message: a.message ?? '—',
      time: a.created_at ? formatRelative(a.created_at) : '',
      read: a.is_read ?? false,
      meta: a.meta ?? {},
    };
  };

  const [alerts, setAlerts] = useState(() => {
    const fromContext = (contextAlerts || []).map(mapAlert).filter(Boolean);
    return fromContext.length > 0
      ? fromContext
      : demoAlerts.map(mapAlert).filter(Boolean);
  });

  useEffect(() => {
    const fromContext = (contextAlerts || []).map(mapAlert).filter(Boolean);
    if (fromContext.length > 0) setAlerts(fromContext);
  }, [contextAlerts]);

  // ─── Refresh / read / delete handlers (hardened) ─────────────────────────

  const handleRefresh = () => {
    setRefreshing(true);
    if (typeof refreshManufacturer === 'function') {
      refreshManufacturer()
        .catch((err) => console.warn('Refresh failed:', err?.message ?? err))
        .finally(() => setRefreshing(false));
    } else {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  const markAsRead = async (id) => {
    // Optimistic UI — flips the badge instantly regardless of backend.
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));

    // Demo alerts never touch the backend.
    if (isDemoAlert(id)) return;

    if (typeof updateAlertReadStatus !== 'function') {
      console.warn('updateAlertReadStatus not available in context');
      return;
    }

    try {
      await updateAlertReadStatus(id, true);
    } catch (err) {
      console.warn('Mark-as-read failed (backend):', err?.message ?? err);
    }
  };

  const deleteAlert = async (id) => {
    // Optimistic UI — removes the card instantly.
    setAlerts((prev) => prev.filter((a) => a.id !== id));

    // Demo alerts never touch the backend.
    if (isDemoAlert(id)) return;

    if (typeof deleteAlertFromContext !== 'function') {
      console.warn('deleteAlert not available in context');
      return;
    }

    try {
      await deleteAlertFromContext(id);
    } catch (err) {
      console.warn('Delete failed (backend):', err?.message ?? err);
    }
  };

  // ─── Action handler — routes to the target screen ────────────────────────

  const handleAction = (alert) => {
    const target = alert.typeConfig?.action?.target;
    markAsRead(alert.id);

    if (!target) return;

    switch (target) {
      case 'Quality':
        navigation.navigate('Quality');
        break;
      case 'Suppliers':
        navigation.navigate('Suppliers');
        break;
      case 'Finance':
        navigation.navigate('Finance');
        break;
      case 'ManufacturerPayment':
        if (alert.meta?.pickupId) {
          navigation.navigate('ManufacturerPayment', { pickupId: alert.meta.pickupId });
        } else if (alert.meta?.batchId) {
          navigation.navigate('ManufacturerPayment', { pickupId: alert.meta.batchId });
        } else {
          navigation.navigate('Suppliers');
        }
        break;
      default:
        navigation.navigate('ManufacturerDashboardScreen');
        break;
    }
  };

  // ─── Header (working back button, no "All caught up") ────────────────────

  const Header = () => {
    const unreadCount = alerts.filter((a) => !a.read).length;

    const goBack = () => {
      if (typeof onBack === 'function') return onBack();
      if (navigation.canGoBack?.()) return navigation.goBack();
      navigation.navigate('ManufacturerDashboardScreen');
    };

    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={T.card} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={T.ink} />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.headerSubtitle}>
                  {unreadCount} unread {unreadCount === 1 ? 'alert' : 'alerts'}
                </Text>
              )}
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </View>
      </>
    );
  };

  // ─── Filters ─────────────────────────────────────────────────────────────

  const filters = [
    { id: 'all', label: 'All', count: alerts.length },
    {
      id: 'action',
      label: 'Needs action',
      count: alerts.filter((a) => a.typeConfig.section === 'action' && !a.read).length,
    },
    {
      id: 'updates',
      label: 'Updates',
      count: alerts.filter((a) => a.typeConfig.section === 'updates').length,
    },
    {
      id: 'unread',
      label: 'Unread',
      count: alerts.filter((a) => !a.read).length,
    },
  ];

  const visibleAlerts = alerts.filter((a) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !a.read;
    return a.typeConfig.section === selectedFilter;
  });

  const actionAlerts = visibleAlerts.filter((a) => a.typeConfig.section === 'action');
  const updateAlerts = visibleAlerts.filter((a) => a.typeConfig.section === 'updates');

  // ─── Alert card ──────────────────────────────────────────────────────────

  const AlertCard = ({ alert }) => {
    const cfg = alert.typeConfig;
    return (
      <View style={[styles.alertCard, !alert.read && styles.alertCardUnread]}>
        <View style={[styles.alertIconWrap, { backgroundColor: `${cfg.color}1A` }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        <View style={styles.alertContent}>
          <View style={styles.alertHeaderRow}>
            <Text style={styles.alertTypeLabel}>{cfg.label}</Text>
            {!alert.read && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.alertTitle} numberOfLines={2}>
            {alert.title}
          </Text>
          <Text style={styles.alertMessage} numberOfLines={3}>
            {alert.message}
          </Text>

          <View style={styles.alertFooter}>
            <Text style={styles.alertTime}>{alert.time}</Text>

            <View style={styles.alertFooterActions}>
              <TouchableOpacity
                onPress={() => deleteAlert(alert.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={15} color={T.muted} />
              </TouchableOpacity>

              {cfg.action && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleAction(alert)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnText}>{cfg.action.label}</Text>
                  <Ionicons name="arrow-forward" size={14} color={T.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ─── Empty state ─────────────────────────────────────────────────────────

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-outline" size={32} color={T.primary} />
      </View>
      <Text style={styles.emptyTitle}>No alerts</Text>
      <Text style={styles.emptyText}>
        You'll see new deliveries, quality checks and inventory warnings here.
      </Text>
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => {
            const active = selectedFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.filterChipText, active && styles.filterChipTextActive]}
                >
                  {filter.label}
                </Text>
                {filter.count > 0 && (
                  <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                    <Text
                      style={[
                        styles.filterBadgeText,
                        active && styles.filterBadgeTextActive,
                      ]}
                    >
                      {filter.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {visibleAlerts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* NEEDS ACTION */}
            {actionAlerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: T.critical }]} />
                  <Text style={styles.sectionTitle}>Requires action</Text>
                  <Text style={styles.sectionCount}>{actionAlerts.length}</Text>
                </View>
                {actionAlerts.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </View>
            )}

            {/* UPDATES */}
            {updateAlerts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: T.primary }]} />
                  <Text style={styles.sectionTitle}>Updates</Text>
                  <Text style={styles.sectionCount}>{updateAlerts.length}</Text>
                </View>
                {updateAlerts.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.page },

  // Header
  header: {
    backgroundColor: T.card,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...SH.header,
  },
  headerContent: {
    paddingHorizontal: S.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  headerTextContainer: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: T.ink },
  headerSubtitle: { fontSize: 11, color: T.body, marginTop: 2 },
  headerSpacer: { width: 40, height: 40 },

  // Filters
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: T.card,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  filtersScroll: {
    paddingHorizontal: S.screenPadding,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: T.divider,
    borderRadius: R.pill,
  },
  filterChipActive: { backgroundColor: T.primary },
  filterChipText: { fontSize: 13, color: T.body, fontWeight: '600' },
  filterChipTextActive: { color: T.white },
  filterBadge: {
    backgroundColor: T.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 11, color: T.body, fontWeight: '700' },
  filterBadgeTextActive: { color: T.white },

  // Scroll area
  scrollView: { flex: 1 },
  scrollContent: { padding: S.screenPadding, paddingBottom: 24 },

  // Sections
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: T.body,
    backgroundColor: T.divider,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  // Alert card
  alertCard: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 10,
    ...SH.card,
  },
  alertCardUnread: {
    backgroundColor: T.selectedBg,
    borderColor: `${T.primary}40`,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: { flex: 1 },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: T.body,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.primary,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12.5,
    color: T.body,
    lineHeight: 18,
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertTime: {
    fontSize: 11,
    color: T.muted,
  },
  alertFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: T.primary,
    borderRadius: R.pill,
    ...SH.button,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: T.white,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: T.body,
    textAlign: 'center',
    lineHeight: 19,
  },
  bottomPadding: { height: 30 },
});

export default AlertsScreen;