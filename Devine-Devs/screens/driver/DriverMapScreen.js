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
import { ACTIVE_TRIP_STATUSES, PRE_TRIP_STATUSES, legForStatus } from '../../src/lib/pickupStatus';

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
  // 'in_progress' counts as an active trip status but had no action here, so a
  // pickup sitting on it left the driver with a trip panel and no button and no
  // way forward. It means the same thing as 'arrival' from the driver's side —
  // they are at the restaurant, mid-collection — so it gets the same next step.
  in_progress: { label: 'Oil collected', next: 'collected', icon: 'water-outline' },
  collected: { label: 'Arrived at manufacturer', next: 'arrived_manufacturer', icon: 'flag-outline' },
};

// Oil already in the truck — the stop is done, whatever happens afterwards.
const COLLECTED_STATUSES = ['collected', 'arrived_manufacturer', 'completed'];

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
  // Multi-stop planning sits ALONGSIDE single-leg Navigate, it does not replace
  // it. Separate loading state so one button spinning never disables the other.
  // Both end up drawing into routeGeoJson/routeSummary, so whichever the driver
  // asked for last is what's on screen — stopOrder is what tells them which.
  const [planning, setPlanning] = useState(false);
  const [stopOrder, setStopOrder] = useState(null); // [{ seq, pickupId, name }]
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
  // Coordinates and the current action are derived further down from
  // `panelDestination` / `panelAction`, which fall back to this single-pickup
  // `destination` when no multi-stop run is planned.

  // A new leg means a new destination — drop the old route line.
  //
  // The planned run is deliberately NOT cleared here. Working a run changes
  // pickup statuses constantly, which changes `leg` and `activePickup`, so
  // clearing the order here would wipe the driver's plan the moment they
  // started following it. The run is cleared when it finishes instead.
  useEffect(() => {
    setRouteGeoJson(null);
    setRouteSummary(null);
    routeShowingRef.current = false;
  }, [leg, activePickup?.id]);

  const handleAdvanceStatus = async () => {
    if (!panelPickup || !panelAction) return;
    setAdvancing(true);
    try {
      if (panelAction.appliesToWholeRun && runStops?.length) {
        // Arriving at the manufacturer ends the leg for EVERY pickup in the
        // run — the whole load came off the same truck, so they all move
        // together. Sequential rather than parallel so one rejection does not
        // leave the rest in an unknown state.
        for (const stop of runStops) {
          if (stop.pickup.status !== 'arrived_manufacturer') {
            await updatePickupStatus(stop.pickup.id, 'arrived_manufacturer');
          }
        }
      } else {
        await updatePickupStatus(panelPickup.id, panelAction.next);
      }

      // Collecting a stop means the next one becomes current, so the route on
      // screen is now for the wrong leg. Drop it; the driver re-presses
      // Navigate for the next stop. Keeps the numbered plan intact.
      if (panelAction.next === 'collected') {
        setRouteGeoJson(null);
        setRouteSummary(null);
        routeShowingRef.current = false;
      }
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
    if (!hasPanelCoords) {
      Alert.alert(
        'No location on file',
        `${panelLeg === 'manufacturer' ? 'This manufacturer' : 'This restaurant'} doesn't have a location set yet. Ask admin to add one.`
      );
      return;
    }
    if (!location) return;

    setRouting(true);
    try {
      // ORS wants [longitude, latitude]. Inside a run this is the current
      // stop, so pressing Navigate after each collection routes to the next
      // one rather than back to the manufacturer.
      const coordinates = [
        [location.longitude, location.latitude],
        [panelDestinationCoords.longitude, panelDestinationCoords.latitude],
      ];
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: { coordinates, profile: 'driving-car' },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Route could not be calculated.');

      setRouteGeoJson(data.route);
      setRouteSummary(data.summary ?? null);
      routeShowingRef.current = true;

      // Share the ETA we just got with whoever is waiting at the other end.
      // Costs no extra API call — it's the same duration drawn on screen.
      // Best-effort: a failure here must not break navigation.
      const durationSeconds = Number(data.summary?.duration ?? 0);
      if (panelPickup?.id && durationSeconds > 0) {
        supabase
          .rpc('set_pickup_eta', {
            p_pickup_id: panelPickup.id,
            p_eta_minutes: Math.round(durationSeconds / 60),
          })
          .then(({ error: etaError }) => {
            if (etaError) console.log('[eta] not stored:', etaError.message);
          });
      }

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

  // Plan all stops = the OTHER option, next to Navigate. Navigate routes the
  // current leg only (here -> this one destination). This asks ORS for the best
  // ORDER through every stop still assigned to this driver, then draws the whole
  // run. Neither replaces the other; the driver picks per trip.
  //
  // Stop ids: VROOM requires integer job ids, but pickups are uuids, so stops go
  // out numbered 1..n by their position in pickupMarkers and the returned order
  // is mapped back through that same array.
  const handlePlanAllStops = async () => {
    if (!location || batchStops.length === 0) return;

    setPlanning(true);
    try {
      const stops = batchStops.map((marker, i) => ({
        id: i + 1,
        location: [marker.longitude, marker.latitude],
      }));

      // Finish at this group's manufacturer — that is where the oil actually
      // goes, so the finishing leg belongs in the plan rather than being a
      // surprise after the last pickup.
      const manufacturer =
        batchManufacturer &&
        Number.isFinite(Number(batchManufacturer.latitude)) &&
        Number.isFinite(Number(batchManufacturer.longitude))
          ? batchManufacturer
          : null;

      const body = {
        mode: 'multi',
        profile: 'driving-car',
        start: [location.longitude, location.latitude],
        stops,
      };
      if (manufacturer) {
        body.end = [Number(manufacturer.longitude), Number(manufacturer.latitude)];
      }

      const { data, error } = await supabase.functions.invoke('optimize-route', { body });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Could not plan the stops.');

      setRouteGeoJson(data.route);
      setRouteSummary(data.summary ?? null);
      routeShowingRef.current = true;

      setStopOrder(
        (data.order ?? []).map((step, i) => {
          const marker = batchStops[Number(step.id) - 1];
          return {
            seq: i + 1,
            pickupId: marker?.id ?? null,
            name: marker?.title ?? 'Stop',
          };
        })
      );

      const bbox = data.route?.bbox;
      if (bbox && cameraRef.current) {
        cameraRef.current.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: { top: 120, bottom: 260, left: 40, right: 40 }, duration: 800 }
        );
      }

      // Say it out loud rather than quietly drawing a route that skips stops.
      const dropped = data.unassigned ?? [];
      if (dropped.length > 0) {
        Alert.alert(
          'Some stops were left out',
          `${dropped.length} of ${stops.length} stops could not be fitted into this run. They stay assigned, just not on this route.`
        );
      }
    } catch (err) {
      Alert.alert('Could not plan the stops', err.message ?? 'Please try again.');
    } finally {
      setPlanning(false);
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
            // Carried so stops can be grouped by where the oil is going.
            manufacturerId: pickup.manufacturer_id ?? null,
            title: pickup.restaurants?.name ?? 'Pickup location',
            description: pickup.restaurants?.address ?? pickup.status ?? '',
          };
        })
        .filter(Boolean),
    [pickups]
  );

  const openStopCount = useMemo(() => (pickups || []).filter((p) => p.status !== 'completed' && p.status !== 'cancelled').length, [pickups]);

  // Only stops heading to the SAME manufacturer belong on one run. A different
  // manufacturer is a different destination, so it is a different trip — the
  // driver would have to drive there and back before serving the next group.
  //
  // Which group: the active trip's manufacturer when there is one (that is the
  // run the driver is already on), otherwise whichever manufacturer has the
  // most stops waiting.
  const batchManufacturerId = useMemo(() => {
    if (activePickup?.manufacturer_id) return activePickup.manufacturer_id;

    const counts = new Map();
    for (const marker of pickupMarkers) {
      if (!marker.manufacturerId) continue;
      counts.set(marker.manufacturerId, (counts.get(marker.manufacturerId) ?? 0) + 1);
    }

    let best = null;
    let bestCount = 0;
    for (const [id, count] of counts) {
      if (count > bestCount) {
        best = id;
        bestCount = count;
      }
    }
    return best;
  }, [activePickup?.manufacturer_id, pickupMarkers]);

  // The stops that share that destination — what a multi-stop run may contain.
  const batchStops = useMemo(
    () =>
      pickupMarkers.filter(
        (marker) => marker.manufacturerId && marker.manufacturerId === batchManufacturerId
      ),
    [pickupMarkers, batchManufacturerId]
  );

  // Where that run ends. Read off any pickup in the group — they share it.
  const batchManufacturer = useMemo(() => {
    if (!batchManufacturerId) return null;
    const match = (pickups || []).find(
      (p) => p.manufacturer_id === batchManufacturerId && p.manufacturers
    );
    return match?.manufacturers ?? null;
  }, [pickups, batchManufacturerId]);

  // ---- Multi-stop run ------------------------------------------------------
  //
  // Once a run is planned (stopOrder is set) the trip panel follows the RUN
  // rather than a single pickup: the driver works stop 1..N in the planned
  // order, and only drives to the manufacturer after the LAST one is collected.
  //
  // This deliberately overrides legForStatus() for the run case. That helper
  // reads 'collected' as "now head to the manufacturer", which is right for a
  // lone pickup and wrong inside a batch — there, 'collected' means "head to
  // the next stop". Without a run planned, nothing below applies and the
  // original single-pickup behaviour is untouched.

  // Stops in planned order, each paired with its live pickup row.
  const runStops = useMemo(() => {
    if (!stopOrder?.length) return null;
    const resolved = stopOrder
      .map((stop) => {
        const pickup = (pickups || []).find((p) => p.id === stop.pickupId);
        return pickup ? { ...stop, pickup } : null;
      })
      .filter(Boolean);
    return resolved.length ? resolved : null;
  }, [stopOrder, pickups]);

  // The stop being worked now: the first one whose oil is not yet in the truck.
  const currentRunStop = useMemo(
    () =>
      runStops?.find((stop) => !COLLECTED_STATUSES.includes(stop.pickup.status)) ?? null,
    [runStops]
  );

  // Every stop collected — the only point at which the manufacturer is next.
  const runLoaded = Boolean(runStops?.length) && !currentRunStop;

  // What the panel is actually about: the run's current stop while a run is
  // planned, otherwise the single active pickup as before.
  const panelPickup = runStops?.length
    ? currentRunStop?.pickup ?? runStops[runStops.length - 1].pickup
    : activePickup;

  const panelLeg = runStops?.length ? (runLoaded ? 'manufacturer' : 'restaurant') : leg;

  const panelDestination = runStops?.length
    ? runLoaded
      ? batchManufacturer ?? panelPickup?.manufacturers ?? null
      : panelPickup?.restaurants ?? null
    : destination;

  const panelDestinationCoords = panelDestination
    ? {
        latitude: Number(panelDestination.latitude),
        longitude: Number(panelDestination.longitude),
      }
    : null;

  const hasPanelCoords =
    panelDestinationCoords &&
    Number.isFinite(panelDestinationCoords.latitude) &&
    Number.isFinite(panelDestinationCoords.longitude);

  // The one action offered right now. Inside a run the wording counts the
  // stops, so the driver always knows where they are in the list.
  const panelAction = useMemo(() => {
    if (!panelPickup) return null;

    if (runStops?.length) {
      if (runLoaded) {
        return {
          label: 'Arrived at manufacturer',
          next: 'arrived_manufacturer',
          icon: 'flag-outline',
          appliesToWholeRun: true,
        };
      }
      const seq = currentRunStop?.seq ?? 1;
      if (PRE_TRIP_STATUSES.includes(panelPickup.status)) {
        return { label: `Start stop ${seq}`, next: 'in_transit', icon: 'navigate-outline' };
      }
      return TRIP_ACTIONS[panelPickup.status] ?? null;
    }

    return TRIP_ACTIONS[panelPickup.status] ?? null;
  }, [panelPickup, runStops, runLoaded, currentRunStop]);

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
        <Text style={styles.errorTitle}>Location access needed</Text>
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

        {pickupMarkers.map((pickup) => {
          // Once a multi-stop plan exists, each stop shows its visiting number
          // instead of a generic pin. No plan = the original pin, unchanged.
          const stop = runStops?.find((s) => s.pickupId === pickup.id) ?? null;
          const seq = stop?.seq ?? null;
          // Done stops go muted so the driver can see progress down the list
          // at a glance rather than counting.
          const done = stop ? COLLECTED_STATUSES.includes(stop.pickup.status) : false;
          const isCurrent = stop && currentRunStop && stop.pickupId === currentRunStop.pickupId;
          return (
            <Marker key={pickup.id} lngLat={[pickup.longitude, pickup.latitude]} anchor="bottom">
              {seq ? (
                <View
                  style={[
                    styles.seqMarkerWrap,
                    done && styles.seqMarkerDone,
                    isCurrent && styles.seqMarkerCurrent,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={15} color={THEME.white} />
                  ) : (
                    <Text style={styles.seqMarkerText}>{seq}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.stopMarkerWrap}>
                  <Ionicons name="location" size={26} color={THEME.primaryDark} />
                </View>
              )}
            </Marker>
          );
        })}

        {/* Where the driver is headed right now — the run's current stop while
            a run is planned, otherwise the single pickup's current leg. */}
        {hasPanelCoords && (
          <Marker lngLat={[panelDestinationCoords.longitude, panelDestinationCoords.latitude]} anchor="center">
            <View style={styles.destinationMarkerWrap}>
              <Ionicons name={panelLeg === 'manufacturer' ? 'business' : 'storefront'} size={16} color={THEME.white} />
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
        <Text style={styles.pickupBadgeValue}>{openStopCount}</Text>
        <Text style={styles.pickupBadgeLabel}>{openStopCount === 1 ? 'stop to do' : 'stops to do'}</Text>
      </View>

      {/* The multi-stop option. Sits on the map rather than in the trip panel,
          because it is about the whole run and is useful before any one trip
          has been started. Only offered when two or more stops share a
          manufacturer — with a single stop, Navigate already does the job, and
          stops bound for different manufacturers are different trips. */}
      {batchStops.length >= 2 && (
        <TouchableOpacity
          style={styles.planAllBtn}
          onPress={handlePlanAllStops}
          activeOpacity={0.75}
          disabled={planning}
        >
          {planning ? (
            <ActivityIndicator size="small" color={THEME.white} />
          ) : (
            <Ionicons name="git-network-outline" size={15} color={THEME.white} />
          )}
          <View style={styles.planAllBtnLabel}>
            <Text style={styles.planAllBtnText}>
              {planning
                ? 'Planning…'
                : stopOrder
                  ? 'Re-plan run'
                  : `Plan ${batchStops.length} stops`}
            </Text>
            {batchManufacturer?.name ? (
              <Text style={styles.planAllBtnSub} numberOfLines={1}>
                to {batchManufacturer.name}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      )}

      {panelPickup ? (
        <View style={styles.tripPanel}>
          <View style={styles.tripPanelHeader}>
            <View style={styles.tripLegBadge}>
              <Ionicons
                name={panelLeg === 'manufacturer' ? 'business-outline' : 'storefront-outline'}
                size={13}
                color={THEME.primaryDark}
              />
              <Text style={styles.tripLegText}>
                {runStops?.length
                  ? runLoaded
                    ? `All ${runStops.length} collected · Manufacturer`
                    : `Stop ${currentRunStop?.seq ?? 1} of ${runStops.length} · Restaurant`
                  : panelLeg === 'manufacturer'
                    ? 'Leg 2 of 2 · Manufacturer'
                    : 'Leg 1 of 2 · Restaurant'}
              </Text>
            </View>
            {location && (
              <Text style={styles.tripSpeedText}>
                {speed > 0 ? `${Math.round(speed)} km/h` : 'Stationary'}
              </Text>
            )}
          </View>

          <Text style={styles.tripDestName} numberOfLines={1}>
            {panelDestination?.name ?? 'Destination'}
          </Text>
          <Text style={styles.tripDestAddress} numberOfLines={1}>
            {panelDestination?.address ?? 'No address on file'}
          </Text>

          {/* The rest of the run, so the driver can see what is still ahead
              without leaving the map. */}
          {runStops?.length && !runLoaded ? (
            <Text style={styles.tripRunNext} numberOfLines={1}>
              {(() => {
                const remaining = runStops.filter(
                  (s) => !COLLECTED_STATUSES.includes(s.pickup.status)
                );
                if (remaining.length <= 1) return 'Last stop before the manufacturer';
                return `Then ${remaining
                  .slice(1)
                  .map((s) => s.name)
                  .join(' → ')}`;
              })()}
            </Text>
          ) : null}

          <View style={styles.tripActionsRow}>
            <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigate} activeOpacity={0.75} disabled={routing}>
              {routing ? <ActivityIndicator size="small" color={THEME.primaryDark} /> : <Ionicons name="navigate" size={16} color={THEME.primaryDark} />}
              <Text style={styles.navigateBtnText}>{routing ? "Routing…" : routeGeoJson ? "Re-route" : "Navigate"}</Text>
            </TouchableOpacity>

            {panelAction && (
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
                    <Ionicons name={panelAction.icon} size={16} color={THEME.white} />
                    <Text style={styles.advanceBtnText}>{panelAction.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {!panelAction && panelPickup.status === 'arrived_manufacturer' && (
            <View style={styles.waitingBanner}>
              <Ionicons name="hourglass-outline" size={14} color={THEME.textSecondary} />
              <Text style={styles.waitingBannerText}>
                {runStops?.length
                  ? `Waiting for the manufacturer to confirm all ${runStops.length} collections`
                  : 'Waiting for the manufacturer to confirm receipt'}
              </Text>
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

  // Multi-stop: numbered pin, and the button that produces it. Sits under the
  // pickup-stops badge (top: 48) so the two read as one cluster.
  seqMarkerWrap: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  seqMarkerText: { color: THEME.white, fontWeight: '800', fontSize: 13 },
  seqMarkerDone: { backgroundColor: THEME.textSecondary },
  seqMarkerCurrent: { backgroundColor: THEME.primaryDarker, borderColor: THEME.accent ?? THEME.white },
  planAllBtn: {
    position: 'absolute',
    top: 112,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  planAllBtnLabel: { maxWidth: 150 },
  planAllBtnText: { color: THEME.white, fontWeight: '700', fontSize: 12 },
  planAllBtnSub: { color: THEME.primaryLight, fontWeight: '600', fontSize: 10, marginTop: 1 },
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
  tripRunNext: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primary,
    marginTop: -8,
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
