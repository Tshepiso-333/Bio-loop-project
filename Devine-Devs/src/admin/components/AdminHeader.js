// Shared light header for Admin screens — mirrors RestaurantHeader's airy
// auth/onboarding look (light surface, dark status bar, forest green reserved
// for small accents), swapped to admin's needs: a logo tile + portal caption
// on the home/dashboard variant, a back button on sub-screens, and a row of
// icon actions (settings, sign out, etc.) instead of a profile avatar.
//
// Usage:
//   <AdminHeader variant="home" subtitle="Operations center..." actions={[...]} />
//   <AdminHeader title="Settings" showBack onBack={() => navigation.goBack()} />

import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADMIN_COLORS, ADMIN_FONTS, ADMIN_SHADOWS, ADMIN_SPACING } from '../adminTheme';

export default function AdminHeader({
  title,
  subtitle,
  variant,
  showBack = false,
  onBack,
  actions = [], // [{ key, icon, onPress }]
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_COLORS.page} />
      <View style={styles.row}>
        {showBack ? (
          <View style={styles.side}>
            <Pressable
              style={({ pressed }) => [styles.backCircle, pressed && { opacity: 0.85 }]}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={20} color={ADMIN_COLORS.ink} />
            </Pressable>
          </View>
        ) : variant === 'home' ? (
          <View style={styles.logoContainer}>
            <View style={styles.logoTile}>
              <Ionicons name="shield-checkmark" size={22} color={ADMIN_COLORS.white} />
            </View>
            <View>
              <Text style={styles.appName}>BioLoop</Text>
              <Text style={styles.portalName}>Admin Portal</Text>
            </View>
          </View>
        ) : null}

        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}

        <View style={styles.rightGroup}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
              onPress={action.onPress}
            >
              <Ionicons name={action.icon} size={18} color={ADMIN_COLORS.ink} />
            </Pressable>
          ))}
          {showBack ? <View style={styles.backSpacer} /> : null}
        </View>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: ADMIN_COLORS.page,
    paddingBottom: 12,
    paddingHorizontal: ADMIN_SPACING.screenPadding,
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
    backgroundColor: ADMIN_COLORS.white,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backSpacer: { width: 38 },

  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: ADMIN_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...ADMIN_SHADOWS.button,
  },
  appName: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 18, color: ADMIN_COLORS.ink },
  portalName: { fontFamily: ADMIN_FONTS.medium, fontSize: 11, color: ADMIN_COLORS.body, marginTop: 1 },

  title: {
    flex: 1,
    fontFamily: ADMIN_FONTS.extraBold,
    fontSize: 22,
    color: ADMIN_COLORS.ink,
  },

  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ADMIN_COLORS.paleGreen,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  subtitle: {
    fontFamily: ADMIN_FONTS.medium,
    fontSize: 12,
    color: ADMIN_COLORS.body,
    marginTop: 8,
    lineHeight: 17,
  },
});
