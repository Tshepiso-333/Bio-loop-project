import React, { useMemo } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const URGENCY_ORDER = { high: 0, medium: 1, low: 2 };

function withMutation(label, action) {
  return action().catch((err) => {
    Alert.alert(label, err.message ?? 'Admin action failed. Check RLS policies and permissions.');
  });
}

function sortCollectorsByDistrict(collectors, district) {
  if (!district) return collectors;
  return [...collectors].sort((a, b) => {
    const aMatch = a.district === district ? 0 : 1;
    const bMatch = b.district === district ? 0 : 1;
    return aMatch - bMatch;
  });
}

export default function DispatchBoard({ admin, ui }) {
  const { styles, COLORS, getStatusColor, formatDate, labelFromKey, AssignmentRow, ActionButton, EmptyState } = ui;

  const restaurantsById = useMemo(() => {
    return admin.restaurants.reduce((acc, restaurant) => {
      acc[restaurant.id] = restaurant;
      return acc;
    }, {});
  }, [admin.restaurants]);

  const pendingRequests = useMemo(() => {
    const convertedIds = new Set(
      admin.pickups.filter((pickup) => pickup.manual_request_id).map((pickup) => pickup.manual_request_id)
    );
    return admin.manualPickupRequests
      .filter((request) => !convertedIds.has(request.id))
      .sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3));
  }, [admin.manualPickupRequests, admin.pickups]);

  const unassignedPickups = useMemo(() => {
    return admin.pickups
      .filter((pickup) => !pickup.collector_id)
      .sort((a, b) => {
        const urgencyDiff = (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3);
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(a.pickup_date ?? 0) - new Date(b.pickup_date ?? 0);
      });
  }, [admin.pickups]);

  return (
    <View>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Dispatch board</Text>
        <Text style={styles.heroText}>
          Convert pending manual requests into pickups, then assign a driver to anything still unassigned.
        </Text>
      </View>

      <Text style={styles.sectionMiniTitle}>Pending manual requests</Text>
      {pendingRequests.map((request) => {
        const restaurant = restaurantsById[request.restaurant_id];
        return (
          <View key={request.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.greenDark} />
              </View>
              <View style={styles.cardMain}>
                <Text style={styles.cardTitle}>{restaurant?.name ?? 'Unknown restaurant'}</Text>
                <Text style={styles.cardSub}>{request.reason ?? 'No reason given'}</Text>
                <Text style={styles.cardMeta}>{formatDate(request.created_at)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${getStatusColor(request.urgency)}22` }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(request.urgency) }]}>
                  {labelFromKey(request.urgency)}
                </Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <ActionButton
                label="Convert to pickup"
                icon="git-branch-outline"
                onPress={() =>
                  withMutation('Convert request', () => admin.convertManualRequestToPickup(request))
                }
              />
            </View>
          </View>
        );
      })}
      {pendingRequests.length === 0 ? <EmptyState label="No pending manual requests." /> : null}

      <Text style={styles.sectionMiniTitle}>Unassigned pickups</Text>
      {unassignedPickups.map((pickup) => {
        const restaurant = restaurantsById[pickup.restaurant_id] ?? pickup.restaurants;
        const sortedCollectors = sortCollectorsByDistrict(admin.collectors, restaurant?.district);
        return (
          <View key={pickup.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardMain}>
                <Text style={styles.cardTitle}>{restaurant?.name ?? 'Unknown restaurant'}</Text>
                <Text style={styles.cardSub}>{restaurant?.address ?? 'No address'}</Text>
                <Text style={styles.cardMeta}>
                  {formatDate(pickup.pickup_date)} · {pickup.estimated_volume_liters ?? pickup.actual_volume_liters ?? 0}L
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${getStatusColor(pickup.urgency)}22` }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(pickup.urgency) }]}>
                  {labelFromKey(pickup.urgency ?? 'normal')}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionMiniTitle}>Assign driver</Text>
            <AssignmentRow
              items={sortedCollectors}
              currentId={pickup.collector_id}
              getLabel={(collector) =>
                `${collector.full_name ?? collector.employee_code ?? 'Collector'}${collector.district === restaurant?.district ? ' · nearby' : ''}`
              }
              onSelect={(collectorId) => {
                const collector = admin.collectors.find((item) => item.id === collectorId);
                if (!collector) return;
                withMutation('Assign driver', () => admin.assignCollectorToPickup(pickup.id, collector));
              }}
            />
          </View>
        );
      })}
      {unassignedPickups.length === 0 ? <EmptyState label="No unassigned pickups." /> : null}
    </View>
  );
}
