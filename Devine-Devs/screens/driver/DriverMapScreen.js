// Devine-Devs/screens/driver/DriverMapScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { updateCollectorLocation } from '../../src/services/collectorService';
import DriverHeader from '../../src/driver/components/DriverHeader';
import { DRV_COLORS, DRV_FONTS, DRV_RADII, DRV_SHADOWS } from '../../src/driver/driverTheme';

const LOCATION_PERSIST_INTERVAL_MS = 20000; // don't write to the DB on every 3s GPS tick

export default function DriverMapScreen() {
  const mapRef = useRef(null);
  const { pickups = [], collector } = useCollectorContext();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(0);

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

          // Keep map centered on the driver as they move
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              },
              500
            );
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
  // This guard is load-bearing, not decoration: the map branch below reads
  // location.latitude with no optional chaining. Do not reorder or merge it.
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" backgroundColor={DRV_COLORS.page} />
        <View style={styles.loadingIconCircle}>
          <ActivityIndicator size="large" color={DRV_COLORS.primary} />
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
        <StatusBar barStyle="dark-content" backgroundColor={DRV_COLORS.page} />
        <View style={styles.errorIconCircle}>
          <Ionicons name="location-outline" size={32} color={DRV_COLORS.primary} />
        </View>
        <Text style={styles.errorTitle}>Location access needed</Text>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  // ── Map ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <DriverHeader title="Map" />

      {/* Badges are positioned against this wrapper, not the raw screen, so they
          sit below the header instead of colliding with the notch. */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsTraffic={false}
        >
          {/* Driver marker — moves with GPS */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Your location"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.markerWrap}>
                <View style={styles.markerPulse} />
                <View style={styles.markerOuter}>
                  <View style={styles.markerInner} />
                </View>
              </View>
            </Marker>
          )}

          {pickupMarkers.map((pickup) => (
            <Marker
              key={pickup.id}
              coordinate={{
                latitude: pickup.latitude,
                longitude: pickup.longitude,
              }}
              title={pickup.title}
              description={pickup.description}
              pinColor={DRV_COLORS.primary}
            />
          ))}
        </MapView>

        <View style={styles.pickupBadge}>
          <Text style={styles.pickupBadgeValue}>{pickupMarkers.length}</Text>
          <Text style={styles.pickupBadgeLabel}>pickup stops</Text>
        </View>

        {/* Speed badge at the bottom */}
        {location && (
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DRV_COLORS.page,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Loading
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DRV_COLORS.page,
    paddingHorizontal: 32,
  },
  loadingIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 17,
    color: DRV_COLORS.ink,
    marginBottom: 6,
  },
  loadingText: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 13,
    color: DRV_COLORS.body,
  },

  // Error
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DRV_COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: DRV_FONTS.bold,
    fontSize: 17,
    color: DRV_COLORS.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 13,
    color: DRV_COLORS.body,
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
    backgroundColor: DRV_COLORS.accent + '4D', // accent at 30%
  },
  markerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DRV_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: DRV_COLORS.white,
    ...DRV_SHADOWS.floating,
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DRV_COLORS.white,
  },

  // Speed badge
  speedBadge: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    backgroundColor: DRV_COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: DRV_RADII.card,
    gap: 14,
    ...DRV_SHADOWS.floating,
  },
  pickupBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: DRV_COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: DRV_RADII.card,
    alignItems: 'center',
    ...DRV_SHADOWS.floating,
  },
  pickupBadgeValue: {
    fontFamily: DRV_FONTS.extraBold,
    fontSize: 18,
    color: DRV_COLORS.primary,
  },
  pickupBadgeLabel: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 11,
    color: DRV_COLORS.body,
  },
  speedLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  speedValue: {
    fontFamily: DRV_FONTS.extraBold,
    fontSize: 22,
    color: DRV_COLORS.primary,
    lineHeight: 26,
  },
  speedUnit: {
    fontFamily: DRV_FONTS.medium,
    fontSize: 12,
    color: DRV_COLORS.body,
    marginBottom: 2,
  },
  speedDivider: {
    width: 1,
    height: 24,
    backgroundColor: DRV_COLORS.border,
  },
  speedRight: {},
  speedLabel: {
    fontFamily: DRV_FONTS.semiBold,
    fontSize: 13,
    color: DRV_COLORS.ink,
  },
});
