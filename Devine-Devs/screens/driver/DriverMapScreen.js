// Devine-Devs/screens/driver/DriverMapScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// MapLibre v11 (Google-free). Map tiles: OpenFreeMap (no key). Route line:
// the optimize-route Edge Function (openrouteservice, key server-side).
import { Map as MapLibreMap, Camera, GeoJSONSource, Layer, Marker } from '@maplibre/maplibre-react-native';
import { supabase } from '../../supabase';
import * as Location from 'expo-location';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { updateCollectorLocation } from '../../src/services/collectorService';
import { ACTIVE_TRIP_STATUSES, legForStatus } from '../../src/lib/pickupStatus';

// Free OpenStreetMap-based tiles, no API key (see docs/DEV_BUILD.md).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// One driver-facing checkpoint action per pickup_status — advancing to the
// next status is what fires the restaurant/manufacturer/admin notification
// (see collectorService.notifyForStatus). The driver's part ends at
// 'arrived_manufacturer' — there's no action for it here because completing
// the trip is the manufacturer's call, not the driver's (they confirm receipt
// from their own app, see manufacturerService.confirmDeliveryReceived).
const TRIP_ACTIONS = {
  in_transit: { label: "I've arrived", next: 'arrival', icon: 'flag-outline' },
  arrival: { label: 'Oil collected', next: 'collected', icon: 'water-outline' },
  collected: { label: 'Arrived at manufacturer', next: 'arrived_manufacturer', icon: 'flag-outline' },
};

const LOCATION_PERSIST_INTERVAL_MS = 20000; // don't write to the DB on every 3s GPS tick

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
};

export default function DriverMapScreen({ route }) {
  const cameraRef = useRef(null);
  const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [routing, setRouting] = useState(false);
  const routeShowingRef = useRef(false);
  const { pickups = [], collector, updatePickupStatus } = useCollectorContext();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  const routePickupId = route?.params?.pickupId ?? null;

  // The pickup this trip panel is driving. Prefers whichever pickup the
  // driver tapped into from Collections; falls back to the first pickup
  // mid-trip so the map is still useful if this screen is opened directly.
  const activePickup = useMemo(() => {
    const list = pickups || [];
    if (routePickupId) {
      const found = list.find((p) => p.id === routePickupId);
      if (found && ACTIVE_TRIP_STATUSES.includes(found.status)) return found;
    }
    return list.find((p) => ACTIVE_TRIP_STATUSES.includes(p.status)) ?? null;
  }, [pickups, routePickupId]);

  const leg = activePickup ? legForStatus(activePickup.status) : null;
  const destination = activePickup
    ? leg === 'manufacturer'
      ? activePickup.manufacturers
      : activePickup.restaurants
    : null;
  const destinationCoords = destination
    ? { latitude: Number(destination.latitude), longitude: Number(destination.longitude) }
    : null;
  const hasDestinationCoords =
    destinationCoords && Number.isFinite(destinationCoords.latitude) && Number.isFinite(destinationCoords.longitude);
  const tripAction = activePickup ? TRIP_ACTIONS[activePickup.status] : null;

  // A new leg means a new destination — drop the old route line.
  useEffect(() => {
    setRouteGeoJson(null);
    setRouteSummary(null);
    routeShowingRef.current = false;
  }, [leg, activePickup?.id]);

  const handleAdvanceStatus = async () => {
    if (!activePickup || !tripAction) return;
    setAdvancing(true);
    try {
      await updatePickupStatus(activePickup.id, tripAction.next);
    } catch (err) {
      Alert.alert('Update failed', err.message ?? 'Could not update the trip status.');
    } finally {
      setAdvancing(false);
    }
  };

  // Navigate = draw the road route on our own map (driver -> current leg's
  // destination) via the optimize-route Edge Function. Nothing leaves the
  // app and no Google. Distance/time come back from the same call.
  const handleNavigate = async () => {
    if (!hasDestinationCoords) {
      Alert.alert(
        'No location on file',
        `${leg === 'manufacturer' ? 'This manufacturer' : 'This restaurant'} doesn't have a location set yet — ask admin to add one.`
      );
      return;
    }
    if (!location) return;

    setRouting(true);
    try {
      // ORS wants [longitude, latitude]
      const coordinates = [
        [location.longitude, location.latitude],
        [destinationCoords.longitude, destinationCoords.latitude],
      ];
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: { coordinates, profile: 'driving-car' },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Route could not be calculated.');

      setRouteGeoJson(data.route);
      setRouteSummary(data.summary ?? null);
      routeShowingRef.current = true;

      const bbox = data.route?.bbox;
      if (bbox && cameraRef.current) {
        cameraRef.current.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: { top: 120, bottom: 260, left: 40, right: 40 }, duration: 800 }
        );
      }
    } catch (err) {
      Alert.alert('Could not get a route', err.message ?? 'Please try again.');
    } finally {
      setRouting(false);
    }
  };

  // Refs (not state) so the watchPositionAsync closure below — set up once on
  // mount — always sees the latest collector id and last-persist time without
  // needing to tear down and restart the GPS subscription.
  const collectorIdRef = useRef(null);
  const lastPersistedAtRef = useRef(0);

  useEffect(() => {
    collectorIdRef.current = collector?.id ?? null;
  }, [collector?.id]);

  const persistLocation = (coords) => {
    const collectorId = collectorIdRef.current;
    if (!collectorId) return;

    const now = Date.now();
    if (now - lastPersistedAtRef.current < LOCATION_PERSIST_INTERVAL_MS) return;
    lastPersistedAtRef.current = now;

    updateCollectorLocation(collectorId, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    }).catch((err) => console.error('Error persisting collector location:', err.message));
  };

  const pickupMarkers = useMemo(
    () =>
      (pickups || [])
        .filter((pickup) => pickup.status !== 'completed')
        .map((pickup) => {
          const latitude = Number(pickup.restaurants?.latitude);
          const longitude = Number(pickup.restaurants?.longitude);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            id: pickup.id,
            latitude,
            longitude,
            title: pickup.restaurants?.name ?? 'Pickup location',
            description: pickup.restaurants?.address ?? pickup.status ?? '',
          };
        })
        .filter(Boolean),
    [pickups]
  );

  useEffect(() => {
    let subscriber = null;

    const startTracking = async () => {
      // 1. Ask for permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg(
          'Location permission was denied. Please enable it in your device settings to use the map.'
        );
        setLoading(false);
        return;
      }

      // 2. Get initial position immediately
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(initial.coords);
      setSpeed(initial.coords.speed > 0 ? initial.coords.speed * 3.6 : 0);
      setLoading(false);
      persistLocation(initial.coords);

      // 3. Watch position — updates as the driver moves
      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,   // every 3 seconds
          distanceInterval: 5,  // or every 5 metres, whichever comes first
        },
        (newLocation) => {
          const coords = newLocation.coords;
          setLocation(coords);
          setSpeed(coords.speed > 0 ? coords.speed * 3.6 : 0);
          persistLocation(coords);

          // Keep map centered on the driver as they move (unless a route is
          // showing — then the fitted route view is more useful than chasing)
          if (cameraRef.current && !routeShowingRef.current) {
            cameraRef.current.easeTo({
              center: [coords.longitude, coords.latitude],
              zoom: 15,
              duration: 500,
            });
          }
        }
      );
    };

    startTracking();

    // 4. Cleanup — stop watching when screen is left
    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.white} />
        <View style={styles.loadingIconCircle}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
        <Text style={styles.loadingTitle}>Finding your location</Text>
        <Text style={styles.loadingText}>Please wait a moment...</Text>
      </SafeAreaView>
    );
  }

  // ── Permission denied / error state ───────────────────────────────────────
  if (errorMsg) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.white} />
        <View style={styles.errorIconCircle}>
          <Text style={styles.errorIcon}>📍</Text>
        </View>
        <Text style={styles.errorTitle}>Location Access Needed</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  // ── Map ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.white} />

      <MapLibreMap style={styles.map} mapStyle={MAP_STYLE} logo={false} attributionPosition={{ bottom: 8, left: 8 }}>
        <Camera
          ref={cameraRef}
          initialViewState={{ center: [location.longitude, location.latitude], zoom: 15 }}
        />

        {/* Road route for the current leg (after Navigate) */}
        {routeGeoJson ? (
          <GeoJSONSource id="trip-route" data={routeGeoJson}>
            <Layer id="trip-route-casing" type="line" paint={{ 'line-color': '#FFFFFF', 'line-width': 8, 'line-opacity': 0.9 }} />
            <Layer
              id="trip-route-line"
              type="line"
              paint={{ 'line-color': THEME.primary, 'line-width': 5 }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        ) : null}

        {/* Driver marker — moves with GPS */}
        {location && (
          <Marker lngLat={[location.longitude, location.latitude]} anchor="center">
            <View style={styles.markerWrap}>
              <View style={styles.markerPulse} />
              <View style={styles.markerOuter}>
                <View style={styles.markerInner} />
              </View>
            </View>
          </Marker>
        )}

        {pickupMarkers.map((pickup) => (
          <Marker key={pickup.id} lngLat={[pickup.longitude, pickup.latitude]} anchor="bottom">
            <View style={styles.stopMarkerWrap}>
              <Ionicons name="location" size={26} color={THEME.primaryDark} />
            </View>
          </Marker>
        ))}

        {/* Current-leg destination — restaurant until oil is collected, then manufacturer */}
        {hasDestinationCoords && (
          <Marker lngLat={[destinationCoords.longitude, destinationCoords.latitude]} anchor="center">
            <View style={styles.destinationMarkerWrap}>
              <Ionicons name={leg === 'manufacturer' ? 'business' : 'storefront'} size={16} color={THEME.white} />
            </View>
          </Marker>
        )}
      </MapLibreMap>

      {routeSummary ? (
        <View style={styles.routeBadge}>
          <Ionicons name="navigate" size={14} color={THEME.white} />
          <Text style={styles.routeBadgeText}>
            {(Number(routeSummary.distance ?? 0) / 1000).toFixed(1)} km · {Math.round(Number(routeSummary.duration ?? 0) / 60)} min
          </Text>
        </View>
      ) : null}

      <View style={styles.pickupBadge}>
        <Text style={styles.pickupBadgeValue}>{pickupMarkers.length}</Text>
        <Text style={styles.pickupBadgeLabel}>pickup stops</Text>
      </View>

      {activePickup ? (
        <View style={styles.tripPanel}>
          <View style={styles.tripPanelHeader}>
            <View style={styles.tripLegBadge}>
              <Ionicons
                name={leg === 'manufacturer' ? 'business-outline' : 'storefront-outline'}
                size={13}
                color={THEME.primaryDark}
              />
              <Text style={styles.tripLegText}>
                {leg === 'manufacturer' ? 'Leg 2 of 2 · Manufacturer' : 'Leg 1 of 2 · Restaurant'}
              </Text>
            </View>
            {location && (
              <Text style={styles.tripSpeedText}>
                {speed > 0 ? `${Math.round(speed)} km/h` : 'Stationary'}
              </Text>
            )}
          </View>

          <Text style={styles.tripDestName} numberOfLines={1}>
            {destination?.name ?? 'Destination'}
          </Text>
          <Text style={styles.tripDestAddress} numberOfLines={1}>
            {destination?.address ?? 'No address on file'}
          </Text>

          <View style={styles.tripActionsRow}>
            <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigate} activeOpacity={0.75} disabled={routing}>
              {routing ? <ActivityIndicator size="small" color={THEME.primaryDark} /> : <Ionicons name="navigate" size={16} color={THEME.primaryDark} />}
              <Text style={styles.navigateBtnText}>{routing ? "Routing…" : routeGeoJson ? "Re-route" : "Navigate"}</Text>
            </TouchableOpacity>

            {tripAction && (
              <TouchableOpacity
                style={[styles.advanceBtn, advancing && styles.advanceBtnDisabled]}
                onPress={handleAdvanceStatus}
                disabled={advancing}
                activeOpacity={0.75}
              >
                {advancing ? (
                  <ActivityIndicator size="small" color={THEME.white} />
                ) : (
                  <>
                    <Ionicons name={tripAction.icon} size={16} color={THEME.white} />
                    <Text style={styles.advanceBtnText}>{tripAction.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {!tripAction && activePickup.status === 'arrived_manufacturer' && (
            <View style={styles.waitingBanner}>
              <Ionicons name="hourglass-outline" size={14} color={THEME.textSecondary} />
              <Text style={styles.waitingBannerText}>Waiting for the manufacturer to confirm receipt</Text>
            </View>
          )}
        </View>
      ) : (
        location && (
          <View style={styles.speedBadge}>
            <View style={styles.speedLeft}>
              <Text style={styles.speedValue}>
                {speed > 0 ? Math.round(speed) : '0'}
              </Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
            <View style={styles.speedDivider} />
            <View style={styles.speedRight}>
              <Text style={styles.speedLabel}>
                {speed > 0 ? 'Moving' : 'Stationary'}
              </Text>
            </View>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.white,
  },
  map: {
    flex: 1,
  },

  // Loading
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.white,
    paddingHorizontal: 32,
  },
  loadingIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 6,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.textSecondary,
  },

  // Error
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Marker
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary + '30',
  },
  markerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: THEME.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.white,
  },
  stopMarkerWrap: { alignItems: 'center', justifyContent: 'center' },
  routeBadge: {
    position: 'absolute', top: 60, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: THEME.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  routeBadgeText: { color: THEME.white, fontWeight: '700', fontSize: 13 },
  destinationMarkerWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: THEME.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // Speed badge
  speedBadge: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    backgroundColor: THEME.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 14,
  },
  pickupBadge: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: THEME.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  pickupBadgeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.primary,
  },
  pickupBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  speedLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  speedValue: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.primary,
    lineHeight: 26,
  },
  speedUnit: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  speedDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.grayLight,
  },
  speedRight: {},
  speedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
  },

  // Trip panel — replaces the speed badge once a pickup is mid-trip
  tripPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: THEME.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  tripPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripLegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tripLegText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primaryDarker,
  },
  tripSpeedText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  tripDestName: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
  },
  tripDestAddress: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  tripActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.grayLight,
    backgroundColor: THEME.white,
  },
  navigateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  advanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: THEME.primary,
  },
  advanceBtnDisabled: {
    opacity: 0.6,
  },
  advanceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.white,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: THEME.offWhite,
  },
  waitingBannerText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.textSecondary,
  },
});
