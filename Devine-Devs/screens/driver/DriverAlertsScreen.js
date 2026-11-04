// The driver's alert list.
//
// Every other role could already read their alerts somewhere; the driver
// could not. The bell on DriverHome had no onPress at all, and the profile
// row said "Coming soon" — so a driver who missed a push had no way back to
// what it said.
//
// Reads straight from CollectorContext, which already loads `alerts` and
// already keeps them live over realtime, so this screen adds no new query.
// Tapping one marks it read and routes through the same routeForAlert() the
// push tap and the in-app banner use.
import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { routeForAlert } from '../../src/lib/alertRouting';
import {
  DRV_COLORS,
  DRV_FONTS,
  DRV_RADII,
  DRV_SHADOWS,
  DRV_SPACING,
} from '../../src/driver/driverTheme';

// alerts.type is 'info' | 'warning'. Keep the warning treatment genuinely
// different — a cancelled pickup while you are driving to it is not the same
// kind of news as "earnings added".
const TONES = {
  info: { icon: 'information-circle', fg: DRV_COLORS.primary, bg: DRV_COLORS.paleGreen },
  warning: { icon: 'alert-circle', fg: DRV_COLORS.warnText, bg: DRV_COLORS.warnBg },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Hand-rolled rather than toLocaleString: Hermes ships a reduced Intl, so
// date formatting is not guaranteed to match across devices.
function whenLabel(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)} h ago`;
  if (mins < 60 * 24 * 7) return `${Math.floor(mins / (60 * 24))} d ago`;

  return `${String(then.getDate()).padStart(2, '0')} ${MONTHS[then.getMonth()]}`;
}

export default function DriverAlertsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { alerts = [], markAlertRead, refreshCollector } = useCollectorContext();
  const [refreshing, setRefreshing] = useState(false);

  // Newest first. The context hands them over in load order, which is not a
  // promise about sorting.
  const sorted = useMemo(
    () =>
      [...(alerts || [])].sort(
        (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
      ),
    [alerts]
  );

  const unreadCount = sorted.filter((a) => !a.is_read).length;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCollector?.();
    } finally {
      setRefreshing(false);
    }
  };

  const openAlert = (alert) => {
    if (!alert.is_read) markAlertRead?.(alert.id);

    const target = routeForAlert({ meta: alert.meta ?? {}, category: alert.category }, 'collector');
    if (!target) return;
    try {
      navigation.navigate('DriverTabs', { screen: target.screen, params: target.params });
    } catch {
      // A route that no longer exists must not crash the app on a tap.
    }
  };

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor={DRV_COLORS.primary} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={DRV_COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0
              ? `${unreadCount} unread`
              : sorted.length > 0
                ? 'All caught up'
                : 'Nothing yet'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 28 },
          sorted.length === 0 && styles.bodyEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DRV_COLORS.primary}
            colors={[DRV_COLORS.primary]}
          />
        }
      >
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="notifications-outline" size={26} color={DRV_COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              New pickups, payouts and trip changes will show up here.
            </Text>
          </View>
        ) : (
          sorted.map((alert) => {
            const tone = TONES[alert.type] ?? TONES.info;
            return (
              <TouchableOpacity
                key={alert.id}
                activeOpacity={0.85}
                onPress={() => openAlert(alert)}
                style={[styles.card, !alert.is_read && styles.cardUnread]}
              >
                <View style={[styles.iconCircle, { backgroundColor: tone.bg }]}>
                  <Ionicons name={tone.icon} size={18} color={tone.fg} />
                </View>

                <View style={styles.cardCopy}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {alert.title ?? 'BioLoop'}
                    </Text>
                    <Text style={styles.cardWhen}>{whenLabel(alert.created_at)}</Text>
                  </View>

                  {alert.message ? (
                    <Text style={styles.cardMessage}>{alert.message}</Text>
                  ) : null}
                </View>

                {!alert.is_read ? <View style={styles.unreadDot} /> : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: DRV_COLORS.page },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: DRV_SPACING.screenPadding,
    paddingBottom: 18,
    backgroundColor: DRV_COLORS.primary,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerCopy: { flex: 1 },
  headerTitle: {
    fontFamily: DRV_FONTS.extraBold,
    fontSize: 20,
    color: DRV_COLORS.white,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },

  body: {
    padding: DRV_SPACING.screenPadding,
    gap: DRV_SPACING.gap,
  },
  bodyEmpty: { flexGrow: 1, justifyContent: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: DRV_COLORS.card,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: DRV_SPACING.cardPadding,
    ...DRV_SHADOWS.card,
  },
  cardUnread: { borderColor: DRV_COLORS.accent, backgroundColor: DRV_COLORS.selectedBg },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    flex: 1,
    fontFamily: DRV_FONTS.bold,
    fontSize: 14,
    color: DRV_COLORS.ink,
  },
  cardWhen: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 11.5,
    color: DRV_COLORS.muted,
  },
  cardMessage: {
    fontFamily: DRV_FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
    color: DRV_COLORS.body,
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DRV_COLORS.primaryMid,
    marginTop: 6,
  },

  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 24 },
  emptyCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DRV_COLORS.paleGreen,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 15,
    color: DRV_COLORS.ink,
  },
  emptyText: {
    fontFamily: DRV_FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
    color: DRV_COLORS.body,
    textAlign: 'center',
  },
});
