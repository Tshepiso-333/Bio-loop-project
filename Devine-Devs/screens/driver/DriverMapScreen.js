// Devine-Devs/screens/driver/DriverMapScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PICKUPS, COLORS, DRIVER } from '../../data/driverData';

const MapPlaceholder = ({ stops }) => (
  <View style={styles.mapPlaceholder}>
    <View style={styles.mapInner}>
      <Ionicons name="map-outline" size={32} color={COLORS.primaryDark} />
      <Text style={styles.mapLabel}>Map View</Text>
      <Text style={styles.mapSub}>Install react-native-maps to enable</Text>
    </View>
    <View style={styles.dotGrid}>
      {stops.map((s, i) => (
        <View
          key={s.id}
          style={[
            styles.dot,
            s.status === 'completed' && styles.dotCompleted,
            s.status === 'in_progress' && styles.dotActive,
          ]}
        >
          <Text style={styles.dotText}>
            {s.status === 'completed' ? '✓' : i + 1}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

export default function DriverMapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <MapPlaceholder stops={PICKUPS} />
      <View style={styles.sheet}>
        <View style={styles.routeHeader}>
          <View>
            <Text style={styles.routeTitle}>{DRIVER.route}</Text>
            <Text style={styles.routeSub}>{PICKUPS.length} stops · 12.4 km remaining</Text>
          </View>
          <TouchableOpacity style={styles.navigateBtn} activeOpacity={0.8}>
            <Ionicons name="navigate" size={15} color={COLORS.white} />
            <Text style={styles.navigateBtnText}>  Navigate</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.stopsLabel}>ROUTE STOPS</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {PICKUPS.map((item, index) => (
            <View key={item.id} style={styles.stopRow}>
              <View style={[
                styles.stopNumber,
                item.status === 'completed' && styles.stopNumberDone,
                item.status === 'in_progress' && styles.stopNumberActive,
              ]}>
                {item.status === 'completed'
                  ? <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  : <Text style={[styles.stopNumberText, item.status === 'in_progress' && { color: COLORS.white }]}>
                      {index + 1}
                    </Text>
                }
              </View>
              <View style={styles.stopInfo}>
                <Text style={[styles.stopName, item.status === 'completed' && styles.stopNameDone]}>
                  {item.name}
                </Text>
                <Text style={styles.stopAddress}>{item.address}</Text>
              </View>
              <Text style={styles.stopLiters}>{item.estimatedLiters} L</Text>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  mapPlaceholder: {
    height: 260, backgroundColor: '#D4E9DE',
    alignItems: 'center', justifyContent: 'center',
  },
  mapInner: { alignItems: 'center', marginBottom: 16 },
  mapLabel: { fontSize: 15, fontWeight: '600', color: COLORS.primaryDark, marginTop: 8 },
  mapSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  dotGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    justifyContent: 'center', maxWidth: 260,
  },
  dot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  dotCompleted: { backgroundColor: COLORS.completed },
  dotActive: { backgroundColor: COLORS.inProgress },
  dotText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  sheet: { flex: 1, backgroundColor: COLORS.white, paddingTop: 16 },
  routeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight,
  },
  routeTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  routeSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  navigateBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center',
  },
  navigateBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  stopsLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray, letterSpacing: 1,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  stopRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight, gap: 14,
  },
  stopNumber: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.offWhite, borderWidth: 1.5, borderColor: COLORS.grayMid,
    alignItems: 'center', justifyContent: 'center',
  },
  stopNumberDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stopNumberActive: { backgroundColor: COLORS.inProgress, borderColor: COLORS.inProgress },
  stopNumberText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  stopNameDone: { color: COLORS.gray, textDecorationLine: 'line-through' },
  stopAddress: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  stopLiters: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
});