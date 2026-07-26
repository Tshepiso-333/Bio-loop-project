// Devine-Devs/screens/driver/DriverCollectionsScreen.js
import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import DriverHeader from '../../src/driver/components/DriverHeader';
import DriverStatusBadge from '../../src/driver/components/DriverStatusBadge';
import {
  DriverEmptyBanner,
  DriverLoadingBanner,
  DriverRefreshScrollView,
} from '../../src/components/DriverScreenStates';
import {
  DRV_COLORS,
  DRV_FONTS,
  DRV_RADII,
  DRV_SHADOWS,
  DRV_SPACING,
  DRV_STATUS,
} from '../../src/driver/driverTheme';

// These strings are filter *keys* — they are compared against in `filtered`.
// Do not change them. FILTER_LABELS is display-only, so the chips read in
// sentence case like the rest of the app without touching the filter logic.
const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];
const FILTER_LABELS = {
  All: 'All',
  Pending: 'Pending',
  'In Progress': 'In progress',
  Completed: 'Completed',
};

const CollectionCard = ({ item, onCall, onAction, onDecline }) => {
  const actionDisabled = item.status === 'completed';
  const actionLabel = item.status === 'pending' ? 'Start' : item.status === 'in_progress' ? 'Complete' : 'Done';
  const canDecline = item.status === 'pending';
  // Same `|| pending` fallback as DriverStatusBadge — the DB can return a status
  // that is not a key in DRV_STATUS, and this renders inside a .map().
  const accent = (DRV_STATUS[item.status] || DRV_STATUS.pending).fg;

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name="storefront-outline" size={20} color={DRV_COLORS.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={12} color={DRV_COLORS.muted} />
              <Text style={styles.cardAddress}> {item.address}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Ionicons name="time-outline" size={12} color={DRV_COLORS.muted} />
              <Text style={styles.cardTime}> {item.time} · {item.estimatedLiters}L est.</Text>
            </View>
          </View>
        </View>
        <DriverStatusBadge status={item.status} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
          onPress={onCall}
        >
          <Ionicons name="call-outline" size={15} color={DRV_COLORS.ink} />
          <Text style={styles.callBtnText}>  Call</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            actionDisabled && styles.actionBtnDisabled,
            pressed && !actionDisabled && { opacity: 0.85 },
          ]}
          onPress={!actionDisabled ? onAction : undefined}
          disabled={actionDisabled}
        >
          <Ionicons
            name={actionDisabled ? 'checkmark-circle' : item.status === 'pending' ? 'play' : 'checkmark'}
            size={15}
            color={actionDisabled ? DRV_COLORS.muted : DRV_COLORS.white}
          />
          <Text style={[styles.actionBtnText, actionDisabled && styles.actionBtnTextDisabled]}>
            {'  ' + actionLabel}
          </Text>
        </Pressable>
      </View>
      {canDecline ? (
        <Pressable
          style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.85 }]}
          onPress={onDecline}
        >
          <Text style={styles.declineBtnText}>Decline this pickup</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default function DriverCollectionsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const {
    pickups: assignedPickups = [],
    loading,
    refreshing,
    refreshCollector,
    updatePickupStatus,
    declinePickup,
  } = useCollectorContext();

  const pickups = useMemo(
    () => (assignedPickups || []).map(p => ({
      id: p.id,
      name: p.restaurants?.name ?? 'Unknown',
      address: p.restaurants?.address ?? '',
      phone: p.restaurants?.phone ?? '',
      time: p.pickup_time_start ?? '',
      estimatedLiters: p.estimated_volume_liters ?? p.actual_volume_liters ?? 0,
      status: p.status ?? 'pending',
    })),
    [assignedPickups]
  );

  const filtered = pickups.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return p.status === 'pending';
    if (activeFilter === 'In Progress') return p.status === 'in_progress';
    if (activeFilter === 'Completed') return p.status === 'completed';
    return true;
  });

  const handleAction = async (item) => {
    const nextStatus =
      item.status === 'pending'
        ? 'in_progress'
        : item.status === 'in_progress'
          ? 'completed'
          : item.status;

    if (nextStatus === item.status) return;

    try {
      await updatePickupStatus(item.id, nextStatus);
    } catch (err) {
      Alert.alert('Update failed', err.message ?? 'Could not update pickup status.');
    }
  };

  const handleDecline = (item) => {
    Alert.alert(
      'Decline pickup',
      `Decline the pickup at ${item.name}? It will go back to the dispatch queue for another driver.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declinePickup(item.id, 'Declined by driver');
            } catch (err) {
              Alert.alert('Could not decline', err.message ?? 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const scheduledCount = pickups.filter(p => p.status !== 'completed').length;

  return (
    <View style={styles.container}>
      <DriverHeader
        title="Collections"
        subtitle={`${scheduledCount} pickups remaining today`}
      />

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(f => (
            <Pressable
              key={f}
              style={({ pressed }) => [
                styles.filterBtn,
                activeFilter === f && styles.filterBtnActive,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {FILTER_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <DriverRefreshScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={refreshCollector}
      >
        {loading && pickups.length === 0 ? <DriverLoadingBanner /> : null}

        {filtered.map(item => (
          <CollectionCard
            key={item.id}
            item={item}
            onCall={() => Alert.alert('Call', item.phone ? `Calling ${item.phone}...` : `Calling ${item.name}...`)}
            onAction={() => handleAction(item)}
            onDecline={() => handleDecline(item)}
          />
        ))}

        {!loading && filtered.length === 0 ? (
          <DriverEmptyBanner
            icon="checkmark-done-outline"
            message={
              pickups.length === 0
                ? 'No collections assigned yet. New pickups appear here once dispatch assigns them.'
                : `No ${FILTER_LABELS[activeFilter].toLowerCase()} collections right now.`
            }
          />
        ) : null}

        <View style={{ height: 30 }} />
      </DriverRefreshScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DRV_COLORS.page,
  },

  filterRow: {
    backgroundColor: DRV_COLORS.page,
  },
  filterContent: {
    paddingHorizontal: DRV_SPACING.screenPadding,
    paddingVertical: DRV_SPACING.gap,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DRV_RADII.pill,
    backgroundColor: DRV_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: DRV_COLORS.primary,
    borderColor: DRV_COLORS.primary,
  },
  filterText: {
    fontFamily: DRV_FONTS.semiBold,
    fontSize: 13,
    color: DRV_COLORS.body,
  },
  filterTextActive: {
    color: DRV_COLORS.white,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DRV_SPACING.screenPadding,
  },

  card: {
    backgroundColor: DRV_COLORS.card,
    marginBottom: DRV_SPACING.gap,
    borderRadius: DRV_RADII.card,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    padding: 16,
    borderLeftWidth: 3,
    ...DRV_SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 15,
    color: DRV_COLORS.ink,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardAddress: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.body,
  },
  cardTime: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.muted,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: DRV_RADII.pill,
    flexDirection: 'row',
    backgroundColor: DRV_COLORS.white,
    borderWidth: 1.5,
    borderColor: DRV_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 13,
    color: DRV_COLORS.ink,
  },
  actionBtn: {
    flex: 1.5,
    borderRadius: DRV_RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: DRV_COLORS.primary,
  },
  actionBtnDisabled: {
    backgroundColor: DRV_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
  },
  actionBtnText: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 13,
    color: DRV_COLORS.white,
  },
  actionBtnTextDisabled: {
    color: DRV_COLORS.muted,
  },

  declineBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  declineBtnText: {
    fontFamily: DRV_FONTS.semiBold,
    fontSize: 12,
    color: DRV_COLORS.alertText,
  },
});
