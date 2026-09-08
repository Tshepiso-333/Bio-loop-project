// Shared light header for every Driver screen — replaces the three copy-pasted
// green gradient headers. Matches RestaurantHeader so the two portals feel like
// one product: light surface, dark status bar, forest green reserved for small
// accents rather than the whole bar.
//
// Takes no context. Data comes in as props — this component must stay renderable
// outside CollectorProvider. useSafeAreaInsets is safe: SafeAreaProvider wraps
// the whole app in App.js.
//
// Usage:
//   <DriverHeader variant="home" avatarInitials="TM" />
//   <DriverHeader title="Collections" subtitle="3 pickups remaining today" />
//   <DriverHeader title="Edit vehicle" showBack onBack={() => navigation.goBack()} />

import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DRV_COLORS, DRV_FONTS, DRV_SHADOWS, DRV_SPACING } from '../driverTheme';

// Local on purpose — the Restaurant module's getInitials is not imported here,
// so the two modules stay decoupled. Filters empty segments so a name with
// double spaces can't produce `undefined` characters, and caps at two.
export function getDriverInitials(name, fallback = 'D') {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return fallback;

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Avatar({ avatarInitials, avatarUrl, isVerified, onAvatarPress }) {
  const inner = avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
  ) : (
    <Text style={styles.avatarInitials}>{avatarInitials ?? ''}</Text>
  );

  return (
    <View>
      {onAvatarPress ? (
        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}
          onPress={onAvatarPress}
        >
          {inner}
        </Pressable>
      ) : (
        <View style={styles.avatar}>{inner}</View>
      )}
      {isVerified ? (
        <View style={styles.verifiedDot}>
          <Ionicons name="checkmark-circle" size={16} color={DRV_COLORS.primary} />
        </View>
      ) : null}
    </View>
  );
}

export default function DriverHeader({
  title,
  subtitle,
  variant,
  avatarInitials,
  avatarUrl,
  isVerified,
  onAvatarPress,
  showBack = false,
  onBack,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={DRV_COLORS.page} />
      <View style={styles.row}>
        {showBack ? (
          <View style={styles.side}>
            <Pressable
              style={({ pressed }) => [styles.backCircle, pressed && { opacity: 0.85 }]}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={20} color={DRV_COLORS.ink} />
            </Pressable>
          </View>
        ) : variant === 'home' ? (
          <View style={styles.logoContainer}>
            <View style={styles.logoTile}>
              <Ionicons name="leaf" size={22} color={DRV_COLORS.white} />
            </View>
            <View>
              <Text style={styles.appName}>BioLoop</Text>
              <Text style={styles.portalName}>Driver Portal</Text>
            </View>
          </View>
        ) : null}

        {title ? (
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.rightGroup}>
          {avatarInitials || avatarUrl ? (
            <Avatar
              avatarInitials={avatarInitials}
              avatarUrl={avatarUrl}
              isVerified={isVerified}
              onAvatarPress={onAvatarPress}
            />
          ) : null}
          {showBack ? <View style={styles.backSpacer} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: DRV_COLORS.page,
    paddingBottom: 12,
    paddingHorizontal: DRV_SPACING.screenPadding,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  side: { width: 40 },

  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: DRV_COLORS.white,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Keeps a centered title optically balanced on back-button screens.
  backSpacer: { width: 38 },

  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // Matches the auth logo tile (green rounded square + white leaf), header-sized.
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: DRV_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...DRV_SHADOWS.button,
  },
  appName: { fontFamily: DRV_FONTS.extraBold, fontSize: 18, color: DRV_COLORS.ink },
  portalName: { fontFamily: DRV_FONTS.medium, fontSize: 11, color: DRV_COLORS.body, marginTop: 1 },

  titleBlock: { flex: 1 },
  title: { fontFamily: DRV_FONTS.extraBold, fontSize: 22, color: DRV_COLORS.ink },
  subtitle: { fontFamily: DRV_FONTS.medium, fontSize: 12, color: DRV_COLORS.body, marginTop: 2 },

  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DRV_COLORS.paleGreen,
    borderWidth: 1,
    borderColor: DRV_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarInitials: { fontFamily: DRV_FONTS.bold, fontSize: 15, color: DRV_COLORS.primary },
  // Small check on the avatar corner; white ring so it reads against any photo.
  verifiedDot: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: DRV_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
