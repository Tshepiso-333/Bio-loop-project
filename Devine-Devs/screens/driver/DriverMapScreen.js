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
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { updateCollectorLocation } from '../../src/services/collectorService';

const LOCATION_PERSIST_INTERVAL_MS = 20000; // don't write to the DB on every 3s GPS tick

const THEME = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryDarker: '#047857',
  primaryLight: '#D1FAE5',
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  gray: '#9CA3AF',
  grayLight: '#E5E7EB',
};

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
            pinColor={THEME.primaryDark}
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
});
