// Shared light header for every Restaurant screen — replaces the five
// copy-pasted green gradient headers. Matches the airy auth/onboarding look:
// light surface, dark status bar, forest green reserved for small accents.
//
// Usage:
//   <RestaurantHeader variant="home" avatarInitials="RS" onAvatarPress={...} />
//   <RestaurantHeader title="Earnings" avatarInitials="RS" />
//   <RestaurantHeader title="Schedule Pickup" showBack onBack={() => navigation.goBack()} />

import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REST_COLORS, REST_FONTS, REST_SHADOWS, REST_SPACING } from '../restaurantTheme';

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
          <Ionicons name="checkmark-circle" size={16} color={REST_COLORS.primary} />
        </View>
      ) : null}
    </View>
  );
}

export default function RestaurantHeader({
  title,
  variant,
  avatarInitials,
  avatarUrl,
  isVerified,
  onAvatarPress,
  showBack = false,
  onBack,
  showBell = false,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={REST_COLORS.page} />
      <View style={styles.row}>
        {showBack ? (
          <View style={styles.side}>
            <Pressable
              style={({ pressed }) => [styles.backCircle, pressed && { opacity: 0.85 }]}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={20} color={REST_COLORS.ink} />
            </Pressable>
          </View>
        ) : variant === 'home' ? (
          <View style={styles.logoContainer}>
            <View style={styles.logoTile}>
              <Ionicons name="leaf" size={22} color={REST_COLORS.white} />
            </View>
            <View>
              <Text style={styles.appName}>BioLoop</Text>
              <Text style={styles.portalName}>Restaurant Portal</Text>
            </View>
          </View>
        ) : null}

        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}

        <View style={styles.rightGroup}>
          {showBell ? (
            <View style={styles.bellWrap}>
              <Ionicons name="notifications-outline" size={22} color={REST_COLORS.muted} />
            </View>
          ) : null}
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
    backgroundColor: REST_COLORS.page,
    paddingBottom: 12,
    paddingHorizontal: REST_SPACING.screenPadding,
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
    backgroundColor: REST_COLORS.white,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
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
    backgroundColor: REST_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...REST_SHADOWS.button,
  },
  appName: { fontFamily: REST_FONTS.extraBold, fontSize: 18, color: REST_COLORS.ink },
  portalName: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.body, marginTop: 1 },

  title: {
    flex: 1,
    fontFamily: REST_FONTS.extraBold,
    fontSize: 22,
    color: REST_COLORS.ink,
  },

  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrap: { padding: 6 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: REST_COLORS.paleGreen,
    borderWidth: 1,
    borderColor: REST_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarInitials: { fontFamily: REST_FONTS.bold, fontSize: 15, color: REST_COLORS.primary },
  // Small check on the avatar corner; white ring so it reads against any photo.
  verifiedDot: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: REST_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
