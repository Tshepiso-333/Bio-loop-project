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

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

import * as Location from 'expo-location';

import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { updateCollectorLocation } from '../../src/services/collectorService';
import { supabase } from '../../supabase';

import {
  ACTIVE_TRIP_STATUSES,
  legForStatus,
} from '../../src/lib/pickupStatus';

// ---------------------------------------------------------
// Trip actions
// ---------------------------------------------------------

const TRIP_ACTIONS = {
  in_transit: {
    label: "I've arrived",
    next: 'arrival',
    icon: 'flag-outline',
  },

  arrival: {
    label: 'Oil collected',
    next: 'collected',
    icon: 'water-outline',
  },

  collected: {
    label: 'Arrived at manufacturer',
    next: 'arrived_manufacturer',
    icon: 'flag-outline',
  },
};

const LOCATION_PERSIST_INTERVAL_MS = 20000;

// ---------------------------------------------------------
// Theme
// ---------------------------------------------------------

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

  route: '#2563EB',
};

// ---------------------------------------------------------
// Screen
// ---------------------------------------------------------

export default function DriverMapScreen({ route }) {
  const mapRef = useRef(null);

  const {
    pickups = [],
    collector,
    updatePickupStatus,
  } = useCollectorContext();

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const [speed, setSpeed] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  // Route information
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);

  const [navigationActive, setNavigationActive] = useState(false);

  const collectorIdRef = useRef(null);
  const lastPersistedAtRef = useRef(0);

  const routePickupId = route?.params?.pickupId ?? null;

  // -------------------------------------------------------
  // Find active pickup
  // -------------------------------------------------------

  const activePickup = useMemo(() => {
    const list = pickups || [];

    if (routePickupId) {
      const found = list.find(
        (pickup) => pickup.id === routePickupId
      );

      if (
        found &&
        ACTIVE_TRIP_STATUSES.includes(found.status)
      ) {
        return found;
      }
    }

    return (
      list.find((pickup) =>
        ACTIVE_TRIP_STATUSES.includes(pickup.status)
      ) ?? null
    );
  }, [pickups, routePickupId]);

  // -------------------------------------------------------
  // Determine destination
  // -------------------------------------------------------

  const leg = activePickup
    ? legForStatus(activePickup.status)
    : null;

  const destination = activePickup
    ? leg === 'manufacturer'
      ? activePickup.manufacturers
      : activePickup.restaurants
    : null;

  const destinationCoords = destination
    ? {
        latitude: Number(destination.latitude),
        longitude: Number(destination.longitude),
      }
    : null;

  const hasDestinationCoords =
    destinationCoords &&
    Number.isFinite(destinationCoords.latitude) &&
    Number.isFinite(destinationCoords.longitude);

  const tripAction = activePickup
    ? TRIP_ACTIONS[activePickup.status]
    : null;

  // -------------------------------------------------------
  // Keep latest collector ID
  // -------------------------------------------------------

  useEffect(() => {
    collectorIdRef.current = collector?.id ?? null;
  }, [collector?.id]);

  // -------------------------------------------------------
  // Persist driver's GPS location
  // -------------------------------------------------------

  const persistLocation = (coords) => {
    const collectorId = collectorIdRef.current;

    if (!collectorId) {
      return;
    }

    const now = Date.now();

    if (
      now - lastPersistedAtRef.current <
      LOCATION_PERSIST_INTERVAL_MS
    ) {
      return;
    }

    lastPersistedAtRef.current = now;

    updateCollectorLocation(collectorId, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    }).catch((error) => {
      console.log(
        'Could not persist collector location:',
        error?.message
      );
    });
  };

  // -------------------------------------------------------
  // Pickup markers
  // -------------------------------------------------------

  const pickupMarkers = useMemo(() => {
    return (pickups || [])
      .filter((pickup) => pickup.status !== 'completed')
      .map((pickup) => {
        const latitude = Number(
          pickup.restaurants?.latitude
        );

        const longitude = Number(
          pickup.restaurants?.longitude
        );

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        return {
          id: pickup.id,
          latitude,
          longitude,

          title:
            pickup.restaurants?.name ??
            'Pickup location',

          description:
            pickup.restaurants?.address ??
            pickup.status ??
            '',
        };
      })
      .filter(Boolean);
  }, [pickups]);

  // -------------------------------------------------------
  // GPS tracking
  // -------------------------------------------------------

  useEffect(() => {
    let subscriber = null;
    let mounted = true;

    const startTracking = async () => {
      try {
        // Ask for permission
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (mounted) {
            setErrorMsg(
              'Location permission was denied. Please enable it in your device settings to use the map.'
            );

            setLoading(false);
          }

          return;
        }

        // Get driver's current position
        const initial =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        if (!mounted) {
          return;
        }

        setLocation(initial.coords);

        setSpeed(
          initial.coords.speed > 0
            ? initial.coords.speed * 3.6
            : 0
        );

        setLoading(false);

        persistLocation(initial.coords);

        // Watch driver as they move
        subscriber =
          await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 3000,
              distanceInterval: 5,
            },

            (newLocation) => {
              const coords = newLocation.coords;

              setLocation(coords);

              setSpeed(
                coords.speed > 0
                  ? coords.speed * 3.6
                  : 0
              );

              persistLocation(coords);

              // Normal mode follows the driver.
              //
              // Once Navigate is pressed, we don't constantly
              // zoom back in because we want the full route visible.
              if (
                mapRef.current &&
                !navigationActive
              ) {
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
      } catch (error) {
        console.log(
          'Location tracking error:',
          error
        );

        if (mounted) {
          setErrorMsg(
            'BioLoop could not get your current location.'
          );

          setLoading(false);
        }
      }
    };

    startTracking();

    return () => {
      mounted = false;

      if (subscriber) {
        subscriber.remove();
      }
    };
  }, [navigationActive]);

  // -------------------------------------------------------
  // Get route from Supabase Edge Function
  // -------------------------------------------------------

  const loadRoute = async () => {
    if (!location) {
      Alert.alert(
        'Location unavailable',
        'BioLoop is still finding your current location.'
      );

      return;
    }

    if (!hasDestinationCoords) {
      Alert.alert(
        'No destination coordinates',
        `${
          destination?.name ?? 'This destination'
        } does not have valid map coordinates.`
      );

      return;
    }

    try {
      setRouteLoading(true);
      setRouteError(null);

      // IMPORTANT:
      //
      // openrouteservice expects:
      //
      // [longitude, latitude]
      //
      // NOT:
      //
      // [latitude, longitude]

      const coordinates = [
        [
          Number(location.longitude),
          Number(location.latitude),
        ],

        [
          Number(destinationCoords.longitude),
          Number(destinationCoords.latitude),
        ],
      ];

      console.log(
        'Requesting BioLoop route:',
        coordinates
      );

      // Call the Supabase Edge Function
      const { data, error } =
        await supabase.functions.invoke(
          'optimize-route',
          {
            body: {
              coordinates,
              profile: 'driving-car',
            },
          }
        );

      if (error) {
        console.log(
          'Route Edge Function error:',
          error
        );

        throw error;
      }

      if (!data) {
        throw new Error(
          'The route service returned no data.'
        );
      }

      if (data.error) {
        console.log(
          'Route service error:',
          data
        );

        throw new Error(
          data.error
        );
      }

      // Edge Function returns the complete ORS GeoJSON
      const geometry =
        data?.route?.features?.[0]?.geometry;

      const geometryCoordinates =
        geometry?.coordinates;

      if (
        !Array.isArray(geometryCoordinates) ||
        geometryCoordinates.length < 2
      ) {
        console.log(
          'Invalid route response:',
          data
        );

        throw new Error(
          'No route geometry was returned.'
        );
      }

      // Convert ORS GeoJSON:
      //
      // [longitude, latitude]
      //
      // into react-native-maps:
      //
      // { latitude, longitude }

      const convertedRoute =
        geometryCoordinates
          .map((coordinate) => ({
            latitude: Number(coordinate[1]),
            longitude: Number(coordinate[0]),
          }))
          .filter(
            (coordinate) =>
              Number.isFinite(
                coordinate.latitude
              ) &&
              Number.isFinite(
                coordinate.longitude
              )
          );

      if (convertedRoute.length < 2) {
        throw new Error(
          'The route coordinates were invalid.'
        );
      }

      setRouteCoordinates(convertedRoute);

      setRouteDistance(
        data?.summary?.distance ?? null
      );

      setRouteDuration(
        data?.summary?.duration ?? null
      );

      setNavigationActive(true);

      // Fit the whole route onto the screen
      setTimeout(() => {
        if (!mapRef.current) {
          return;
        }

        mapRef.current.fitToCoordinates(
          convertedRoute,
          {
            edgePadding: {
              top: 100,
              right: 70,
              bottom: 260,
              left: 70,
            },

            animated: true,
          }
        );
      }, 300);
    } catch (error) {
      console.log(
        'Unable to load route:',
        error
      );

      setRouteCoordinates([]);
      setNavigationActive(false);

      const message =
        error?.message ??
        'Could not calculate the route.';

      setRouteError(message);

      Alert.alert(
        'Route unavailable',
        message
      );
    } finally {
      setRouteLoading(false);
    }
  };

  // -------------------------------------------------------
  // Navigate
  // -------------------------------------------------------

  const handleNavigate = async () => {
    // Navigation now stays INSIDE BioLoop.
    //
    // No Linking.openURL.
    // No external Google Maps application.

    await loadRoute();
  };

  // -------------------------------------------------------
  // Advance pickup status
  // -------------------------------------------------------

  const handleAdvanceStatus = async () => {
    if (!activePickup || !tripAction) {
      return;
    }

    setAdvancing(true);

    try {
      await updatePickupStatus(
        activePickup.id,
        tripAction.next
      );

      // Clear the previous route because after
      // collection the destination changes to
      // the manufacturer.

      setRouteCoordinates([]);
      setNavigationActive(false);
      setRouteDistance(null);
      setRouteDuration(null);
      setRouteError(null);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error?.message ??
          'Could not update the trip status.'
      );
    } finally {
      setAdvancing(false);
    }
  };

  // -------------------------------------------------------
  // Clear route when destination changes
  // -------------------------------------------------------

  useEffect(() => {
    setRouteCoordinates([]);
    setNavigationActive(false);
    setRouteDistance(null);
    setRouteDuration(null);
    setRouteError(null);
  }, [
    destinationCoords?.latitude,
    destinationCoords?.longitude,
  ]);

  // -------------------------------------------------------
  // Format route distance
  // -------------------------------------------------------

  const distanceText =
    routeDistance != null
      ? routeDistance >= 1000
        ? `${(routeDistance / 1000).toFixed(1)} km`
        : `${Math.round(routeDistance)} m`
      : null;

  // -------------------------------------------------------
  // Format estimated duration
  // -------------------------------------------------------

  const durationText =
    routeDuration != null
      ? routeDuration >= 3600
        ? `${Math.floor(
            routeDuration / 3600
          )}h ${Math.round(
            (routeDuration % 3600) / 60
          )}m`
        : `${Math.max(
            1,
            Math.round(routeDuration / 60)
          )} min`
      : null;

  // -------------------------------------------------------
  // Loading state
  // -------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={THEME.white}
        />

        <View style={styles.loadingIconCircle}>
          <ActivityIndicator
            size="large"
            color={THEME.primary}
          />
        </View>

        <Text style={styles.loadingTitle}>
          Finding your location
        </Text>

        <Text style={styles.loadingText}>
          Please wait a moment...
        </Text>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------
  // Location error
  // -------------------------------------------------------

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={THEME.white}
        />

        <View style={styles.errorIconCircle}>
          <Text style={styles.errorIcon}>
            📍
          </Text>
        </View>

        <Text style={styles.errorTitle}>
          Location Access Needed
        </Text>

        <Text style={styles.errorText}>
          {errorMsg}
        </Text>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------
  // Main map
  // -------------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={THEME.white}
      />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsTraffic={false}
      >
        {/* -----------------------------------------------
            DRIVER MARKER
        ------------------------------------------------ */}

        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your location"
            anchor={{
              x: 0.5,
              y: 0.5,
            }}
          >
            <View style={styles.markerWrap}>
              <View style={styles.markerPulse} />

              <View style={styles.markerOuter}>
                <View
                  style={styles.markerInner}
                />
              </View>
            </View>
          </Marker>
        )}

        {/* -----------------------------------------------
            PICKUP MARKERS
        ------------------------------------------------ */}

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

        {/* -----------------------------------------------
            ACTIVE DESTINATION
        ------------------------------------------------ */}

        {hasDestinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title={
              destination?.name ??
              (leg === 'manufacturer'
                ? 'Manufacturer'
                : 'Restaurant')
            }
            description={
              destination?.address ?? ''
            }
          >
            <View
              style={
                styles.destinationMarkerWrap
              }
            >
              <Ionicons
                name={
                  leg === 'manufacturer'
                    ? 'business'
                    : 'storefront'
                }
                size={16}
                color={THEME.white}
              />
            </View>
          </Marker>
        )}

        {/* -----------------------------------------------
            ROUTE POLYLINE
        ------------------------------------------------ */}

        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={THEME.route}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* -----------------------------------------------
          PICKUP COUNT
      ------------------------------------------------ */}

      <View style={styles.pickupBadge}>
        <Text style={styles.pickupBadgeValue}>
          {pickupMarkers.length}
        </Text>

        <Text style={styles.pickupBadgeLabel}>
          pickup stops
        </Text>
      </View>

      {/* -----------------------------------------------
          ROUTE LOADING INDICATOR
      ------------------------------------------------ */}

      {routeLoading && (
        <View style={styles.routeLoadingBadge}>
          <ActivityIndicator
            size="small"
            color={THEME.primary}
          />

          <Text style={styles.routeLoadingText}>
            Calculating route...
          </Text>
        </View>
      )}

      {/* -----------------------------------------------
          ACTIVE TRIP PANEL
      ------------------------------------------------ */}

      {activePickup ? (
        <View style={styles.tripPanel}>
          <View style={styles.tripPanelHeader}>
            <View style={styles.tripLegBadge}>
              <Ionicons
                name={
                  leg === 'manufacturer'
                    ? 'business-outline'
                    : 'storefront-outline'
                }
                size={13}
                color={THEME.primaryDark}
              />

              <Text style={styles.tripLegText}>
                {leg === 'manufacturer'
                  ? 'Leg 2 of 2 · Manufacturer'
                  : 'Leg 1 of 2 · Restaurant'}
              </Text>
            </View>

            <Text style={styles.tripSpeedText}>
              {speed > 0
                ? `${Math.round(speed)} km/h`
                : 'Stationary'}
            </Text>
          </View>

          <Text
            style={styles.tripDestName}
            numberOfLines={1}
          >
            {destination?.name ??
              'Destination'}
          </Text>

          <Text
            style={styles.tripDestAddress}
            numberOfLines={1}
          >
            {destination?.address ??
              'No address on file'}
          </Text>

          {/* -------------------------------------------
              ROUTE INFORMATION
          -------------------------------------------- */}

          {navigationActive &&
            (distanceText || durationText) && (
              <View style={styles.routeInfoRow}>
                {distanceText && (
                  <View style={styles.routeInfoItem}>
                    <Ionicons
                      name="navigate-outline"
                      size={14}
                      color={THEME.primaryDark}
                    />

                    <Text style={styles.routeInfoText}>
                      {distanceText}
                    </Text>
                  </View>
                )}

                {durationText && (
                  <View style={styles.routeInfoItem}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={THEME.primaryDark}
                    />

                    <Text style={styles.routeInfoText}>
                      {durationText}
                    </Text>
                  </View>
                )}
              </View>
            )}

          {routeError && (
            <Text style={styles.routeErrorText}>
              {routeError}
            </Text>
          )}

          {/* -------------------------------------------
              ACTION BUTTONS
          -------------------------------------------- */}

          <View style={styles.tripActionsRow}>
            <TouchableOpacity
              style={[
                styles.navigateBtn,

                navigationActive &&
                  styles.navigateBtnActive,
              ]}
              onPress={handleNavigate}
              disabled={routeLoading}
              activeOpacity={0.75}
            >
              {routeLoading ? (
                <ActivityIndicator
                  size="small"
                  color={THEME.primaryDark}
                />
              ) : (
                <Ionicons
                  name="navigate"
                  size={16}
                  color={THEME.primaryDark}
                />
              )}

              <Text style={styles.navigateBtnText}>
                {navigationActive
                  ? 'Refresh route'
                  : 'Navigate'}
              </Text>
            </TouchableOpacity>

            {tripAction && (
              <TouchableOpacity
                style={[
                  styles.advanceBtn,

                  advancing &&
                    styles.advanceBtnDisabled,
                ]}
                onPress={handleAdvanceStatus}
                disabled={advancing}
                activeOpacity={0.75}
              >
                {advancing ? (
                  <ActivityIndicator
                    size="small"
                    color={THEME.white}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={tripAction.icon}
                      size={16}
                      color={THEME.white}
                    />

                    <Text
                      style={
                        styles.advanceBtnText
                      }
                    >
                      {tripAction.label}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* -------------------------------------------
              WAITING FOR MANUFACTURER
          -------------------------------------------- */}

          {!tripAction &&
            activePickup.status ===
              'arrived_manufacturer' && (
              <View style={styles.waitingBanner}>
                <Ionicons
                  name="hourglass-outline"
                  size={14}
                  color={THEME.textSecondary}
                />

                <Text
                  style={
                    styles.waitingBannerText
                  }
                >
                  Waiting for the manufacturer to
                  confirm receipt
                </Text>
              </View>
            )}
        </View>
      ) : (
        // ------------------------------------------------
        // No active pickup — show speed
        // ------------------------------------------------

        location && (
          <View style={styles.speedBadge}>
            <View style={styles.speedLeft}>
              <Text style={styles.speedValue}>
                {speed > 0
                  ? Math.round(speed)
                  : '0'}
              </Text>

              <Text style={styles.speedUnit}>
                km/h
              </Text>
            </View>

            <View style={styles.speedDivider} />

            <Text style={styles.speedLabel}>
              {speed > 0
                ? 'Moving'
                : 'Stationary'}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

// ---------------------------------------------------------
// Styles
// ---------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.white,
  },

  map: {
    flex: 1,
  },

  // -------------------------------------------------------
  // Loading / error
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // Driver marker
  // -------------------------------------------------------

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  // -------------------------------------------------------
  // Destination marker
  // -------------------------------------------------------

  destinationMarkerWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: THEME.white,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    elevation: 5,
  },

  // -------------------------------------------------------
  // Pickup count
  // -------------------------------------------------------

  pickupBadge: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: THEME.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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

  // -------------------------------------------------------
  // Route loading
  // -------------------------------------------------------

  routeLoadingBadge: {
    position: 'absolute',
    top: 48,
    left: 16,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    backgroundColor: THEME.white,

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 5,
  },

  routeLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text,
  },

  // -------------------------------------------------------
  // Trip panel
  // -------------------------------------------------------

  tripPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,

    backgroundColor: THEME.white,

    borderRadius: 20,

    padding: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
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
    marginBottom: 10,
  },

  // -------------------------------------------------------
  // Route information
  // -------------------------------------------------------

  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 14,

    marginBottom: 12,
  },

  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,
  },

  routeInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primaryDarker,
  },

  routeErrorText: {
    fontSize: 11,
    color: '#DC2626',

    marginBottom: 8,
  },

  // -------------------------------------------------------
  // Buttons
  // -------------------------------------------------------

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

  navigateBtnActive: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primary,
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

  // -------------------------------------------------------
  // Manufacturer waiting state
  // -------------------------------------------------------

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
    flex: 1,

    fontSize: 12,
    fontWeight: '500',

    color: THEME.textSecondary,
  },

  // -------------------------------------------------------
  // Speed badge
  // -------------------------------------------------------

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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    elevation: 6,

    gap: 14,
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

  speedLabel: {
    fontSize: 13,
    fontWeight: '600',

    color: THEME.text,
  },
});