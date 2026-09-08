// Loading / empty / pull-to-refresh states for the Driver module.
// Mirrors RestaurantScreenStates.js. These read only values CollectorContext
// already exposes (`loading`, `refreshing`, `error`, `refreshCollector`) — no new
// service calls, no new queries, no new state.

import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DRV_COLORS, DRV_FONTS, DRV_RADII, DRV_SHADOWS } from '../driver/driverTheme';

export function DriverLoadingBanner({ message = 'Loading your route...' }) {
  return (
    <View
      style={{
        marginVertical: 12,
        padding: 20,
        borderRadius: DRV_RADII.card,
        backgroundColor: DRV_COLORS.card,
        borderWidth: 1,
        borderColor: DRV_COLORS.border,
        alignItems: 'center',
        ...DRV_SHADOWS.card,
      }}
    >
      <ActivityIndicator size="small" color={DRV_COLORS.primary} />
      <Text
        style={{
          marginTop: 10,
          color: DRV_COLORS.body,
          fontSize: 13,
          fontFamily: DRV_FONTS.medium,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export function DriverEmptyBanner({
  message = 'No collections assigned yet. New pickups appear here once dispatch assigns them.',
  icon = 'cube-outline',
  actionLabel,
  onAction,
}) {
  return (
    <View
      style={{
        marginVertical: 12,
        padding: 20,
        borderRadius: DRV_RADII.card,
        backgroundColor: DRV_COLORS.card,
        borderWidth: 1,
        borderColor: DRV_COLORS.border,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: DRV_COLORS.paleGreen,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Ionicons name={icon} size={22} color={DRV_COLORS.muted} />
      </View>
      <Text
        style={{
          color: DRV_COLORS.body,
          fontSize: 13,
          fontFamily: DRV_FONTS.medium,
          textAlign: 'center',
          lineHeight: 19,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            {
              marginTop: 14,
              backgroundColor: DRV_COLORS.primary,
              borderRadius: DRV_RADII.pill,
              paddingVertical: 10,
              paddingHorizontal: 22,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={{ color: DRV_COLORS.white, fontSize: 13, fontFamily: DRV_FONTS.bold }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function DriverRefreshScrollView({
  refreshing,
  onRefresh,
  children,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = false,
}) {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={DRV_COLORS.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
