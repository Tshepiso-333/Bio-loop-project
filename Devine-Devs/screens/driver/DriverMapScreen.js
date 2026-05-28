// Devine-Devs/screens/driver/DriverMapScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PICKUPS, DRIVER } from '../../data/driverData';

// Theme colours (matching manufacturer)
const THEME = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryDarker: '#047857',
  primaryLight: '#D1FAE5',
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  gray: '#9CA3AF',
  grayLight: '#E5E7EB',
  grayMid: '#9CA3AF',
  pending: '#F59E0B',
  pendingBg: '#FEF3C7',
  inProgress: '#3B82F6',
  inProgressBg: '#DBEAFE',
  completed: '#10B981',
  completedBg: '#D1FAE5',
};

const MapPlaceholder = ({ stops }) => (
  <LinearGradient
    colors={[THEME.primaryLight, THEME.primary + '15']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.mapPlaceholder}
  >
    <View style={styles.mapInner}>
      <View style={styles.mapIconCircle}>
        <Ionicons name="map-outline" size={36} color={THEME.primary} />
      </View>
      <Text style={styles.mapLabel}>Route Map</Text>
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
  </LinearGradient>
);

export default function DriverMapScreen() {
  const remainingStops = PICKUPS.filter(p => p.status !== 'completed').length;
  const totalDistance = 12.4;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.white} />
      
      <MapPlaceholder stops={PICKUPS} />
      
      <View style={styles.sheet}>
        <LinearGradient
          colors={[THEME.primary + '10', THEME.white]}
          style={styles.routeHeader}
        >
          <View>
            <Text style={styles.routeTitle}>{DRIVER.route}</Text>
            <Text style={styles.routeSub}>
              {remainingStops} stops remaining · {totalDistance} km
            </Text>
          </View>
          <TouchableOpacity style={styles.navigateBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={[THEME.primary, THEME.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.navigateGradient}
            >
              <Ionicons name="navigate" size={15} color={THEME.white} />
              <Text style={styles.navigateBtnText}>  Navigate</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
        
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
                  ? <Ionicons name="checkmark" size={14} color={THEME.white} />
                  : <Text style={[styles.stopNumberText, item.status === 'in_progress' && { color: THEME.white }]}>
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
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.white 
  },
  mapPlaceholder: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  mapInner: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  mapIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: THEME.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: THEME.primaryDark, 
    marginTop: 12 
  },
  mapSub: { 
    fontSize: 12, 
    color: THEME.textSecondary, 
    marginTop: 4 
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 280,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dotCompleted: { 
    backgroundColor: THEME.completed 
  },
  dotActive: { 
    backgroundColor: THEME.inProgress 
  },
  dotText: { 
    color: THEME.white, 
    fontSize: 12, 
    fontWeight: '700' 
  },
  sheet: { 
    flex: 1, 
    backgroundColor: THEME.white, 
    paddingTop: 8 
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  routeTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: THEME.text 
  },
  routeSub: { 
    fontSize: 12, 
    color: THEME.textSecondary, 
    marginTop: 2 
  },
  navigateBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  navigateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navigateBtnText: { 
    color: THEME.white, 
    fontWeight: '600', 
    fontSize: 13 
  },
  stopsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.gray,
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.grayLight,
    gap: 14,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.offWhite,
    borderWidth: 1.5,
    borderColor: THEME.grayMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberDone: { 
    backgroundColor: THEME.primary, 
    borderColor: THEME.primary 
  },
  stopNumberActive: { 
    backgroundColor: THEME.inProgress, 
    borderColor: THEME.inProgress 
  },
  stopNumberText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: THEME.text 
  },
  stopInfo: { 
    flex: 1 
  },
  stopName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: THEME.text 
  },
  stopNameDone: { 
    color: THEME.gray, 
    textDecorationLine: 'line-through' 
  },
  stopAddress: { 
    fontSize: 12, 
    color: THEME.textSecondary, 
    marginTop: 2 
  },
  stopLiters: { 
    fontSize: 13, 
    color: THEME.textSecondary, 
    fontWeight: '500' 
  },
});