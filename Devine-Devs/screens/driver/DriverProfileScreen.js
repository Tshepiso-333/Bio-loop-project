// Devine-Devs/screens/driver/DriverProfileScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../AuthContext';
import { DRIVER, COLORS } from '../../data/driverData';

const MenuItem = ({ icon, label, sublabel, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon} size={18} color={danger ? '#D9534F' : COLORS.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={16} color={COLORS.grayMid} />
  </TouchableOpacity>
);

export default function DriverProfileScreen() {
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {DRIVER.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.name}>{DRIVER.name}</Text>
          <Text style={styles.driverId}>Driver ID: {DRIVER.id}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F5A623" />
            <Text style={styles.ratingText}> {DRIVER.rating} ({DRIVER.reviews} reviews)</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="water-outline" size={18} color={COLORS.primary} />
            <Text style={styles.statValue}>{DRIVER.litersTotal.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Litres Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
            <Text style={styles.statValue}>{DRIVER.collections}</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="leaf-outline" size={18} color={COLORS.primary} />
            <Text style={styles.statValue}>{DRIVER.co2Saved}t</Text>
            <Text style={styles.statLabel}>CO₂ Saved</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="notifications-outline" label="Notifications" sublabel="Manage alerts"
            onPress={() => Alert.alert('Notifications', 'Coming soon')} />
          <MenuItem icon="car-outline" label="Vehicle Info" sublabel="Tank capacity & details"
            onPress={() => Alert.alert('Vehicle Info', 'Coming soon')} />
          <MenuItem icon="shield-checkmark-outline" label="Safety & Compliance" sublabel="Certifications"
            onPress={() => Alert.alert('Safety', 'Coming soon')} />
          <MenuItem icon="help-circle-outline" label="Help & Support" sublabel="FAQ, contact us"
            onPress={() => Alert.alert('Help', 'Coming soon')} />
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="log-out-outline" label="Sign Out" danger onPress={handleSignOut} />
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    backgroundColor: COLORS.primary, alignItems: 'center',
    paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20,
  },
  avatarWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.white, letterSpacing: 1 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  driverId: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  statsCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: -16,
    borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.gray, textAlign: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.grayLight },
  menuSection: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16,
    borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight, gap: 14,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#FEE8E8' },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  menuLabelDanger: { color: '#D9534F' },
  menuSublabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  version: { textAlign: 'center', color: COLORS.gray, fontSize: 12, marginTop: 24 },
});