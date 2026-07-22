import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REST_COLORS, REST_FONTS, REST_RADII, REST_SHADOWS } from '../restaurant/restaurantTheme';

export function RestaurantLoadingBanner({ message = 'Loading restaurant data...' }) {
  return (
    <View
      style={{
        margin: 16,
        padding: 20,
        borderRadius: REST_RADII.card,
        backgroundColor: REST_COLORS.card,
        borderWidth: 1,
        borderColor: REST_COLORS.border,
        alignItems: 'center',
        ...REST_SHADOWS.card,
      }}
    >
      <ActivityIndicator size="small" color={REST_COLORS.primary} />
      <Text
        style={{
          marginTop: 10,
          color: REST_COLORS.body,
          fontSize: 13,
          fontFamily: REST_FONTS.medium,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export function RestaurantEmptyBanner({
  message = 'No restaurant data available yet.',
  icon = 'leaf-outline',
  actionLabel,
  onAction,
}) {
  return (
    <View
      style={{
        margin: 16,
        padding: 20,
        borderRadius: REST_RADII.card,
        backgroundColor: REST_COLORS.card,
        borderWidth: 1,
        borderColor: REST_COLORS.border,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: REST_COLORS.paleGreen,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Ionicons name={icon} size={22} color={REST_COLORS.muted} />
      </View>
      <Text
        style={{
          color: REST_COLORS.body,
          fontSize: 13,
          fontFamily: REST_FONTS.medium,
          textAlign: 'center',
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
              backgroundColor: REST_COLORS.primary,
              borderRadius: REST_RADII.pill,
              paddingVertical: 10,
              paddingHorizontal: 22,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={{ color: REST_COLORS.white, fontSize: 13, fontFamily: REST_FONTS.bold }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RestaurantRefreshScrollView({
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
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={REST_COLORS.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
