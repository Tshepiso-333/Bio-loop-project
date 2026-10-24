// Web stand-in for the driver's map screen.
//
// Metro resolves a .web.js file ahead of its .js sibling, so this is what a
// browser gets and DriverMapScreen.js is what a phone gets. It exists because
// the map libraries are native-only: MapLibre here, react-native-maps on the
// main branch. Both register Fabric components through codegenNativeComponent,
// which does not exist on web, so importing either one anywhere in the graph
// takes the whole web bundle down at startup with
// "codegenNativeComponent is not a function" - not just this screen, the
// entire site. This file is the reason the web build boots at all.
//
// It is deliberately not a fake map. A driver at a laptop still needs to see
// their stops and move a trip along, so this gives them the same list and the
// same checkpoint actions, and says plainly where to go for navigation.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { ACTIVE_TRIP_STATUSES, legForStatus } from '../../src/lib/pickupStatus';

// Kept in step with the native screen's TRIP_ACTIONS; the driver's part of
// the trip ends at 'arrived_manufacturer', which the manufacturer confirms.
const TRIP_ACTIONS = {
  in_transit: { label: 'I have arrived', next: 'arrival', icon: 'flag-outline' },
  arrival: { label: 'Oil collected', next: 'collected', icon: 'water-outline' },
  collected: { label: 'Arrived at manufacturer', next: 'arrived_manufacturer', icon: 'flag-outline' },
};

const THEME = {
  primary: '#15643E',
  primaryLight: '#E7F1EB',
  white: '#FFFFFF',
  page: '#F4F7F5',
  ink: '#122A1F',
  body: '#3C5349',
  muted: '#6B7F75',
  border: '#E4EDE7',
};

export default function DriverMapScreen() {
  const { pickups = [], updatePickupStatus } = useCollectorContext();
  const [busyId, setBusyId] = useState(null);

  const active = useMemo(
    () => (pickups || []).filter((p) => ACTIVE_TRIP_STATUSES.includes(p.status)),
    [pickups]
  );

  const advance = async (pickup) => {
    const action = TRIP_ACTIONS[pickup.status];
    if (!action || busyId) return;
    setBusyId(pickup.id);
    try {
      await updatePickupStatus?.(pickup.id, action.next);
    } finally {
      setBusyId(null);
    }
  };

  // Hands the stop to whatever mapping site the browser already has, rather
  // than shipping a second map stack just for the web.
  const openDirections = (pickup) => {
    const lat = pickup?.restaurants?.latitude;
    const lng = pickup?.restaurants?.longitude;
    const query = lat != null && lng != null
      ? lat + ',' + lng
      : pickup?.restaurants?.address || pickup?.restaurants?.name || '';
    if (!query) return;
    Linking.openURL('https://www.openstreetmap.org/search?query=' + encodeURIComponent(query));
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your stops</Text>
        <Text style={styles.headerSub}>
          The live map and turn-by-turn navigation are in the BioLoop mobile app.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {active.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="map-outline" size={26} color={THEME.primary} />
            </View>
            <Text style={styles.emptyTitle}>No active trip</Text>
            <Text style={styles.emptyText}>
              Accept a collection and its stops will appear here.
            </Text>
          </View>
        ) : (
          active.map((pickup) => {
            const action = TRIP_ACTIONS[pickup.status];
            const leg = legForStatus(pickup.status);
            const place = pickup?.restaurants?.name || 'Collection';
            const address = pickup?.restaurants?.address || '';
            return (
              <View key={pickup.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.pin}>
                    <Ionicons name="location" size={16} color={THEME.primary} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{place}</Text>
                    {address ? (
                      <Text style={styles.cardAddress} numberOfLines={2}>{address}</Text>
                    ) : null}
                    <Text style={styles.cardLeg}>{leg ? String(leg) : String(pickup.status)}</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openDirections(pickup)}
                    accessibilityRole="button"
                    accessibilityLabel={'Open directions to ' + place}
                    style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
                  >
                    <Ionicons name="navigate-outline" size={15} color={THEME.primary} />
                    <Text style={styles.secondaryText}>Directions</Text>
                  </Pressable>

                  {action ? (
                    <Pressable
                      onPress={() => advance(pickup)}
                      disabled={busyId === pickup.id}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                      style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
                    >
                      {busyId === pickup.id ? (
                        <ActivityIndicator size="small" color={THEME.white} />
                      ) : (
                        <>
                          <Ionicons name={action.icon} size={15} color={THEME.white} />
                          <Text style={styles.primaryText}>{action.label}</Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: THEME.page },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: THEME.primary,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: THEME.white, letterSpacing: -0.3 },
  headerSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.78)', marginTop: 4 },

  body: { padding: 18, gap: 14 },

  card: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primaryLight,
  },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: THEME.ink },
  cardAddress: { fontSize: 12.5, color: THEME.body, marginTop: 2, lineHeight: 18 },
  cardLeg: { fontSize: 11.5, color: THEME.muted, marginTop: 4 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.primary,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  secondaryText: { fontSize: 12.5, fontWeight: '600', color: THEME.primary },
  primary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.primary,
    borderRadius: 11,
    paddingVertical: 10,
  },
  primaryText: { fontSize: 12.5, fontWeight: '700', color: THEME.white },
  pressed: { opacity: 0.7 },

  empty: { alignItems: 'center', gap: 8, paddingTop: 60, paddingHorizontal: 24 },
  emptyCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primaryLight,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: THEME.ink },
  emptyText: { fontSize: 13, lineHeight: 19, color: THEME.body, textAlign: 'center' },
});
