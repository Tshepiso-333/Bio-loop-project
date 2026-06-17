import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

export function RestaurantLoadingBanner({ message = 'Loading restaurant data...' }) {
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <ActivityIndicator size="small" color="#10b981" />
      <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>{message}</Text>
    </View>
  );
}

export function RestaurantEmptyBanner({ message = 'No restaurant data available yet.' }) {
  return (
    <View
      style={{
        margin: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>{message}</Text>
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
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
