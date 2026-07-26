// Pickup status pill. Defined once here and shared by DriverHomeScreen and
// DriverCollectionsScreen, which previously carried byte-identical local copies.
//
// The `|| DRV_STATUS.pending` fallback is load-bearing. The database can return
// statuses that are not keys in DRV_STATUS (`cancelled`, `assigned`), and this
// badge renders inside a .map() — destructuring `undefined` would take the whole
// list down, not one row. Do not remove it.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DRV_FONTS, DRV_RADII, DRV_STATUS } from '../driverTheme';

export default function DriverStatusBadge({ status }) {
  const { label, bg, fg } = DRV_STATUS[status] || DRV_STATUS.pending;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: DRV_RADII.chip,
  },
  badgeText: {
    fontFamily: DRV_FONTS.semiBold,
    fontSize: 11,
  },
});
