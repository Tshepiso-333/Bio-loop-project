// Device push notifications.
//
// The `alerts` table remains the single source of truth. A push is only a
// delivery van for a row in it: the payload carries meta.pickupId etc, so
// tapping the notification lands on the same screen as tapping the bell
// entry, and marks the same row read. Nothing is duplicated.
//
// Where this actually works:
//   - Android dev/production build .... yes, via FCM
//   - iOS build with an APNs key ...... yes (needs a paid Apple account)
//   - Expo Go (either platform) ....... NO. Expo removed Android push from
//     Expo Go in SDK 53+, and iOS Expo Go cannot receive push at all.
//
// So every entry point here fails soft and reports why, instead of throwing
// at people who are testing in Expo Go. In-app alerts keep working for them.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../supabase';
import { routeForAlert } from '../lib/alertRouting';

// Imported lazily: in a build without the native module present, requiring
// these at module scope would crash the whole app on start rather than just
// disabling notifications.
let Notifications = null;
let Device = null;

function loadNativeModules() {
  if (Notifications && Device) return true;
  try {
    // eslint-disable-next-line global-require
    Notifications = require('expo-notifications');
    // eslint-disable-next-line global-require
    Device = require('expo-device');
    return true;
  } catch {
    return false;
  }
}

/** True in Expo Go, where push is not available at all. */
export function isExpoGo() {
  return Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
}

/**
 * How the OS should behave when a notification arrives while the app is open.
 * Showing a banner for the screen someone is already looking at is noise, so
 * foreground notifications are silent — the in-app bell is the surface then.
 */
export function configureForegroundBehaviour() {
  if (!loadNativeModules()) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Asks permission, gets the Expo push token, and stores it against the
 * signed-in user via register_push_token.
 *
 * Returns { ok, token, reason }. `reason` is for logs and the settings
 * screen, never thrown — a person who declines notifications should still
 * have a working app.
 */
export async function registerForPush() {
  if (!loadNativeModules()) {
    return { ok: false, reason: 'This build does not include notification support.' };
  }
  if (isExpoGo()) {
    return { ok: false, reason: 'Push notifications do not work in Expo Go. Use a dev build.' };
  }
  if (!Device.isDevice) {
    return { ok: false, reason: 'Push notifications need a physical device.' };
  }

  try {
    // Android needs a channel before anything will show in the tray.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BioLoop',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15643E',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') {
      return { ok: false, reason: 'Notifications are turned off for BioLoop.' };
    }

    // projectId is required by SDK 49+ for getExpoPushTokenAsync.
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? undefined;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    if (!token) {
      return { ok: false, reason: 'Could not obtain a push token.' };
    }

    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: Platform.OS,
      p_device_name: Device.deviceName ?? null,
    });
    if (error) {
      return { ok: false, token, reason: error.message };
    }

    return { ok: true, token };
  } catch (err) {
    return { ok: false, reason: err?.message ?? 'Could not set up notifications.' };
  }
}

/** Called on sign-out so a shared device stops receiving someone else's alerts. */
export async function unregisterPush() {
  if (!loadNativeModules() || isExpoGo()) return;
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    if (token) {
      await supabase.rpc('unregister_push_token', { p_token: token });
    }
  } catch {
    // Signing out must never fail because of this.
  }
}

/**
 * Subscribes to notification taps. `onOpen({ screen, params, alertId })` is
 * called for a tap from the tray, including the one that cold-started the
 * app. Returns an unsubscribe function.
 */
export function addNotificationTapListener(onOpen, role) {
  if (!loadNativeModules() || typeof onOpen !== 'function') return () => {};

  const handle = (response) => {
    const data = response?.notification?.request?.content?.data ?? {};
    const route = routeForAlert(data, role);
    if (!route) return;
    onOpen({ ...route, alertId: data.alertId ?? null });
  };

  const subscription = Notifications.addNotificationResponseReceivedListener(handle);

  // A tap that launched the app from cold is not delivered to the listener.
  Notifications.getLastNotificationResponseAsync?.()
    .then((response) => {
      if (response) handle(response);
    })
    .catch(() => {});

  return () => subscription?.remove?.();
}

export { routeForAlert };

/** Clears the app icon badge. Call when the bell is opened. */
export async function clearBadge() {
  if (!loadNativeModules()) return;
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Not supported everywhere; harmless.
  }
}
