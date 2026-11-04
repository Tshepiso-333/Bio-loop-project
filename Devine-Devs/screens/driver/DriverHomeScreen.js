// Devine-Devs/screens/driver/DriverHomeScreen.js

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import DocumentsCard from '../../src/components/DocumentsCard';
import { useProfile } from '../../src/hooks/useProfile';
import ProfileAvatar from '../../src/components/profile/ProfileAvatar';
import { DRIVER_STATUS_LABELS } from '../../src/lib/pickupStatus';
import MoneyPop, { parseAmountFromAlert } from '../../src/components/MoneyPop';

const THEME = {
  primary: '#15643E',
  primaryDark: '#0F4D30',
  primaryDarker: '#0B3A24',
  primaryLight: '#E7F1EB',
  white: '#FFFFFF',
  offWhite: '#F6F8F7',
  text: '#122A1F',
  textSecondary: '#6B7F75',
  gray: '#A9B5AD',
  grayLight: '#E4EDE7',
  pending: '#F59E0B',
  pendingBg: '#FFF7ED',
  inProgress: '#2563EB',
  inProgressBg: '#EFF6FF',
  completed: '#15643E',
  completedBg: '#E7F1EB',
};

const STATUS_BADGE_COLORS = {
  pending: {
    bg: THEME.pendingBg,
    color: THEME.pending,
  },
  scheduled: {
    bg: THEME.pendingBg,
    color: THEME.pending,
  },
  in_transit: {
    bg: THEME.inProgressBg,
    color: THEME.inProgress,
  },
  arrival: {
    bg: THEME.inProgressBg,
    color: THEME.inProgress,
  },
  in_progress: {
    bg: THEME.inProgressBg,
    color: THEME.inProgress,
  },
  collected: {
    bg: THEME.inProgressBg,
    color: THEME.inProgress,
  },
  arrived_manufacturer: {
    bg: THEME.inProgressBg,
    color: THEME.inProgress,
  },
  completed: {
    bg: THEME.completedBg,
    color: THEME.completed,
  },
};

const StatusBadge = ({ status }) => {
  const { bg, color } =
    STATUS_BADGE_COLORS[status] ||
    STATUS_BADGE_COLORS.pending;

  const label =
    DRIVER_STATUS_LABELS[status] ?? 'Status unknown';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const PickupCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.pickupCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.pickupIcon}>
      <Ionicons
        name="storefront-outline"
        size={20}
        color={THEME.primary}
      />
    </View>

    <View style={styles.pickupInfo}>
      <Text style={styles.pickupName}>
        {item.name}
      </Text>

      <Text style={styles.pickupAddress}>
        {item.address}
      </Text>

      <Text style={styles.pickupTime}>
        {item.time || 'Time TBC'} ·{' '}
        {item.estimatedLiters != null ? `${item.estimatedLiters}L est.` : 'volume TBC'}
      </Text>
    </View>

    <View style={styles.pickupRight}>
      <StatusBadge status={item.status} />

      <Ionicons
        name="chevron-forward"
        size={16}
        color={THEME.gray}
        style={{ marginTop: 6 }}
      />
    </View>
  </TouchableOpacity>
);

export default function DriverHomeScreen({
  navigation,
}) {
  const insets = useSafeAreaInsets();

  const { profile } = useProfile();

  const {
    collector,
    pickups = [],
    stats,
    toggleDutyStatus,
    alerts = [],
    markAlertRead,
  } = useCollectorContext();

  const avatarImageUrl =
    collector?.profile_image_url ??
    profile?.profile_image_url;

  // Trips still to do (cancelled/completed live in Collections' history)
  const openPickups = (pickups || []).filter((p) => p.status !== 'cancelled' && p.status !== 'completed');
  const totalStops = (pickups || []).filter((p) => p.status !== 'cancelled').length;

  // The weekly summary moved to DriverProfileScreen along with its card.

  // Post-trip money moment: newest unread wallet/withdrawal alert the DB
  // wrote drives the pop; dismissing marks it read so it shows once.
  const moneyAlert = useMemo(() => {
    const isMoney = (a) => /wallet|withdrawal paid|payout/i.test(`${a?.title ?? ''}`);
    return (alerts || []).filter((a) => !a.is_read && isMoney(a))
      .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))[0] ?? null;
  }, [alerts]);
  const moneyIsWithdrawal = /withdrawal/i.test(moneyAlert?.title ?? '');

  // The bell's red dot used to be painted on unconditionally, so it claimed
  // unread news even on a clean account.
  const unreadAlerts = (alerts || []).filter((a) => !a.is_read).length;

  const [togglingDuty, setTogglingDuty] =
    useState(false);

  const handleToggleDuty = async (value) => {
    setTogglingDuty(true);

    try {
      await toggleDutyStatus(value);
    } catch (err) {
      Alert.alert(
        'Could not update status',
        err.message ?? 'Please try again.'
      );
    } finally {
      setTogglingDuty(false);
    }
  };

  const todayPickups = openPickups
    .slice(0, 3)
    .map((pickup) => ({
      id: pickup.id,

      name:
        pickup.restaurants?.name ??
        'Unknown',

      address:
        pickup.restaurants?.address ??
        '',

      time:
        pickup.pickup_time_start || '',

      // null means unmeasured, not empty — see DriverCollectionsScreen.
      estimatedLiters:
        pickup.actual_volume_liters ??
        pickup.estimated_volume_liters ??
        null,

      status:
        pickup.status ?? null,
    }));

  // The list above previews the first few jobs; without this the rest of a
  // driver's day was simply invisible.
  const hiddenPickupCount = Math.max(0, openPickups.length - todayPickups.length);

  // -------------------------------------------------------
  // Header
  // -------------------------------------------------------

  const Header = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.primaryDark}
      />

      <LinearGradient
        colors={[
          THEME.primary,
          THEME.primaryDark,
          THEME.primaryDarker,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 12,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/BioLoop_Logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>

            <View>
              <Text style={styles.appName}>
                BioLoop
              </Text>

              <Text style={styles.companyName}>
                Driver Portal
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={
                styles.notificationButton
              }
              accessibilityRole="button"
              accessibilityLabel={
                unreadAlerts > 0
                  ? `Notifications, ${unreadAlerts} unread`
                  : 'Notifications'
              }
              onPress={() =>
                navigation.navigate(
                  'DriverAlerts'
                )
              }
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#FFFFFF"
              />

              {unreadAlerts > 0 ? (
                <View
                  style={
                    styles.notificationDot
                  }
                />
              ) : null}
            </TouchableOpacity>

            <ProfileAvatar
              name={
                collector?.full_name ??
                profile?.full_name
              }
              imageUrl={avatarImageUrl}
              size={45}
              onPress={() =>
                navigation.navigate(
                  'DriverProfile'
                )
              }
            />
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // -------------------------------------------------------
  // Screen
  // -------------------------------------------------------

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Good day,
          </Text>

          <Text style={styles.welcomeName}>
            {collector?.full_name ??
              'Driver'}
          </Text>

          <Text style={styles.welcomeRoute}>
            {stats?.route_name ??
              collector?.route_name ??
              ''}
            {' · '}
            {stats?.district ??
              collector?.district ??
              ''}
          </Text>
        </View>

        {/* Duty toggle */}

        {/* The whole card carries the state, not just the switch: tinted and
            outlined when on duty, flat when off, so a glance from across the
            cab tells the driver whether work can reach them. */}
        <View
          style={[
            styles.dutyRow,
            collector?.is_on_duty && styles.dutyRowOn,
          ]}
        >
          <View style={styles.dutyLeft}>
            <View
              style={[
                styles.dutyIconWrap,
                collector?.is_on_duty && styles.dutyIconWrapOn,
              ]}
            >
              <Ionicons
                name={collector?.is_on_duty ? 'flash' : 'moon-outline'}
                size={18}
                color={collector?.is_on_duty ? THEME.white : THEME.textSecondary}
              />
            </View>

            <View style={styles.dutyText}>
              <View style={styles.dutyLabelRow}>
                <Text style={styles.dutyLabel}>
                  {collector?.is_on_duty ? 'On duty' : 'Off duty'}
                </Text>
                {collector?.is_on_duty && <View style={styles.dutyDot} />}
              </View>

              <Text style={styles.dutySub}>
                {togglingDuty
                  ? 'Updating…'
                  : collector?.is_on_duty
                    ? 'You can be assigned pickups'
                    : 'Turn on to receive assignments'}
              </Text>
            </View>
          </View>

          <Switch
            value={!!collector?.is_on_duty}
            onValueChange={handleToggleDuty}
            disabled={togglingDuty}
            thumbColor={THEME.white}
            ios_backgroundColor={THEME.grayLight}
            trackColor={{
              true: THEME.primary,
              false: THEME.grayLight,
            }}
          />
        </View>

        {/* No wallet, no balance, no Withdraw button (team decision
            2026-11-02). Every trip is paid out the moment it completes
            (earnings_auto_payout, migration 075), so there is never a held
            balance to show — a "wallet" would only ever read R0.00 and imply
            money was being kept back. What was earned is in the payout
            statement under Profile. */}

        {/* Documents moved to Profile — the home screen is for the work in
            front of the driver, not paperwork they rarely download. */}

        {/*
          "Collected today" and
          "Stops remaining" cards REMOVED
        */}

        {/* Weekly Total moved to Profile — a summary belongs with the
            driver's own record, not on the screen they open to work. */}

        {/* Today's Pickups */}

        <View style={styles.sectionHeader}>
          <Text
            style={styles.sectionTitle}
          >
            Today's Pickups
          </Text>

          <Text
            style={styles.sectionCount}
          >
            {openPickups.length} to do
          </Text>
        </View>

        {todayPickups.length === 0 ? (
          <View style={styles.noPickupsCard}>
            <Ionicons name="cafe-outline" size={26} color={THEME.gray} />
            <Text style={styles.noPickupsTitle}>No pickups assigned</Text>
            <Text style={styles.noPickupsText}>
              {collector?.is_on_duty
                ? 'You are on duty. New collections are dispatched to you automatically.'
                : 'Go on duty to start receiving collections.'}
            </Text>
          </View>
        ) : null}

        {todayPickups.map((item) => (
          <PickupCard
            key={item.id}
            item={item}
            onPress={() =>
              navigation.navigate(
                'DriverCollections'
              )
            }
          />
        ))}

        {hiddenPickupCount > 0 ? (
          <Text style={styles.morePickupsHint}>
            {`+${hiddenPickupCount} more waiting in All pickups`}
          </Text>
        ) : null}

        {/* View all pickups */}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() =>
            navigation.navigate(
              'DriverCollections'
            )
          }
        >
          <LinearGradient
            colors={[
              THEME.primary,
              THEME.primaryDark,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={
              styles.viewAllGradient
            }
          >
            <Text
              style={styles.viewAllText}
            >
              View All Pickups
            </Text>

            <Ionicons
              name="arrow-forward-outline"
              size={16}
              color={THEME.white}
            />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
      {/* No wallet to refer to any more — every trip pays out on completion,
          so the only thing to say is that it was paid. */}
      <MoneyPop
        visible={!!moneyAlert}
        amount={parseAmountFromAlert(moneyAlert)}
        title={moneyIsWithdrawal ? 'Withdrawal paid' : 'Trip complete — you earned'}
        subtitle={moneyIsWithdrawal ? 'Paid out instantly.' : 'Paid out to you instantly.'}
        ctaLabel={moneyIsWithdrawal ? 'Done' : 'Nice!'}
        onDismiss={() => moneyAlert && markAlertRead?.(moneyAlert.id)}
      />
    </View>
  );
}

// ---------------------------------------------------------
// Styles
// ---------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.offWhite,
  },

  header: {
    paddingBottom: 12,
  },

  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logoCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: THEME.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  logoImage: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
  },

  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.white,
  },

  companyName: {
    fontSize: 10,
    color: THEME.white,
    opacity: 0.9,
    marginTop: 1,
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
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },

  welcomeText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontFamily: 'Inter_400Regular',
  },

  welcomeName: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 4,
    fontFamily: 'Poppins_700Bold',
  },

  welcomeRoute: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },

  scroll: {
    flex: 1,
    backgroundColor: THEME.offWhite,
  },

  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // On duty: a soft green wash plus a green edge, so the state reads from
  // the card rather than from the switch alone.
  dutyRowOn: {
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primary + '33',
  },

  dutyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  dutyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.grayLight,
  },

  dutyIconWrapOn: {
    backgroundColor: THEME.primary,
  },

  dutyText: {
    flex: 1,
  },

  dutyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  dutyLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },

  // Small live dot next to "On duty" — the usual "we're listening" cue.
  dutyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.primary,
  },

  dutySub: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },

  // Weekly card now follows Earnings directly

  sectionHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
  },

  sectionCount: {
    fontSize: 13,
    color: THEME.gray,
  },

  noPickupsCard: {
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.grayLight,
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 6,
    marginBottom: 12,
  },
  noPickupsTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: THEME.text,
  },
  noPickupsText: {
    fontSize: 12.5,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  statementBlock: { marginTop: 14, marginBottom: 4 },
  morePickupsHint: {
    fontSize: 12.5,
    color: THEME.gray,
    textAlign: 'center',
    paddingBottom: 4,
  },

  pickupCard: {
    backgroundColor: THEME.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary,
  },

  pickupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor:
      THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  pickupInfo: {
    flex: 1,
  },

  pickupName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },

  pickupAddress: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },

  pickupTime: {
    fontSize: 12,
    color: THEME.gray,
    marginTop: 2,
  },

  pickupRight: {
    alignItems: 'flex-end',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  viewAllBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },

  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },

  viewAllText: {
    color: THEME.white,
    fontWeight: '600',
    fontSize: 14,
  },
});