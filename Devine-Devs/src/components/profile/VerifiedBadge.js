import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VerifiedBadge({ isVerified, style }) {
  if (!isVerified) return null;

  return (
    <View style={[styles.badge, style]}>
      <Ionicons name="checkmark-circle" size={14} color="#059669" />
      <Text style={styles.text}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
});
