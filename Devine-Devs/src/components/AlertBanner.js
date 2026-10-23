// The in-app half of the notification story.
//
// A push notification only shows when BioLoop is in the background — and on
// an iPhone there is no push at all, because APNs needs a paid Apple account
// (see docs/NOTIFICATIONS.md). On top of that, pushService deliberately sets
// shouldShowAlert: false, so an alert arriving while someone is *using* the
// app currently surfaces nothing at all until they open the bell.
//
// This fills that gap: a banner that slides down over whatever screen they
// are on, the moment the alerts row is inserted. It works on both platforms,
// needs no build and no credentials, and uses the same routeForAlert() as a
// push tap — so tapping the banner and tapping the bell entry land on the
// same screen, which is the whole point.
//
// `alerts` stays the single source of truth; this is another window onto it,
// never a second copy.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../supabase';
import { markAlertRead } from '../services/notificationService';
import { routeForAlert } from '../lib/alertRouting';
import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

// Long enough to read two lines without rushing, short enough not to sit over
// the screen someone is trying to use.
const VISIBLE_MS = 5000;
const ANIM_IN_MS = 260;
const ANIM_OUT_MS = 200;

// Alerts can arrive in a burst — a dispatch run writes to several people, and
// a cancellation writes three rows at once. Queue them and show one at a
// time rather than stacking banners on top of each other.
const MAX_QUEUE = 3;

// alerts.type is 'info' | 'warning' (see migration 064). Anything else falls
// back to the info treatment rather than rendering untinted.
const TONES = {
  info: { bg: ONB_COLORS.primary, icon: 'notifications' },
  warning: { bg: '#C2410C', icon: 'alert-circle' },
};

function toneFor(type) {
  return TONES[type] ?? TONES.info;
}

export default function AlertBanner({ userId, role, onOpen }) {
  const [current, setCurrent] = useState(null);
  const queueRef = useRef([]);
  const slide = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);
  const insets = useSafeAreaInsets();

  // Android doesn't include the status bar in the safe-area inset, so without
  // this the banner tucks underneath the clock.
  const topInset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : insets.top + 6;

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  // Pull the next queued alert, or settle to nothing.
  const showNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setCurrent(next);
  }, []);

  const dismiss = useCallback(() => {
    clearHideTimer();
    Animated.timing(slide, {
      toValue: 0,
      duration: ANIM_OUT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) showNext();
    });
  }, [showNext, slide]);

  // Animate in whenever a new alert becomes current, and start its timer.
  useEffect(() => {
    if (!current) return undefined;

    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: ANIM_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Someone using a screen reader needs the text read out, not a banner
    // that disappears while it is still being announced.
    AccessibilityInfo.announceForAccessibility?.(
      `${current.title ?? 'BioLoop'}. ${current.message ?? ''}`
    );

    hideTimer.current = setTimeout(dismiss, VISIBLE_MS);
    return clearHideTimer;
  }, [current, dismiss, slide]);

  // One realtime subscription, filtered server-side to this person's rows so
  // we never receive — let alone render — somebody else's alert.
  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`alert-banner-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        ({ new: row }) => {
          if (!row) return;
          // An alert inserted already-read is a backfill, not news.
          if (row.is_read) return;

          setCurrent((showing) => {
            if (showing) {
              if (queueRef.current.length < MAX_QUEUE) queueRef.current.push(row);
              return showing;
            }
            return row;
          });
        }
      )
      .subscribe();

    return () => {
      clearHideTimer();
      queueRef.current = [];
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handlePress = () => {
    const alert = current;
    if (!alert) return;

    clearHideTimer();
    // Mark read first: the person has seen it, whether or not the route
    // resolves. A failure here must not swallow the tap.
    markAlertRead(alert.id, true).catch(() => {});

    const target = routeForAlert({ meta: alert.meta ?? {}, category: alert.category }, role);
    if (target && onOpen) onOpen(target);

    dismiss();
  };

  if (!current) return null;

  const tone = toneFor(current.type);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingTop: topInset,
          opacity: slide,
          transform: [
            {
              translateY: slide.interpolate({
                inputRange: [0, 1],
                outputRange: [-140, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${current.title ?? 'BioLoop'}. ${current.message ?? ''}`}
        onPress={handlePress}
        style={({ pressed }) => [styles.card, { backgroundColor: tone.bg }, pressed && styles.pressed]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={tone.icon} size={17} color={ONB_COLORS.white} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {current.title ?? 'BioLoop'}
          </Text>
          {current.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {current.message}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={dismiss}
          hitSlop={10}
          style={styles.close}
        >
          <Ionicons name="close" size={17} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    // Above every screen, including modals pushed by the native stack.
    zIndex: 9999,
    elevation: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 13,
    shadowColor: '#0B1F16',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  pressed: { opacity: 0.92 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  copy: { flex: 1 },
  title: {
    fontFamily: ONB_FONTS.bold,
    fontSize: 13.5,
    color: ONB_COLORS.white,
    letterSpacing: -0.1,
  },
  message: {
    fontFamily: ONB_FONTS.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
  },
  close: { padding: 2 },
});
