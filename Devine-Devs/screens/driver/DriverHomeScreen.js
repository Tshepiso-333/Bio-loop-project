// Devine-Devs/screens/driver/DriverHomeScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DRIVER, PICKUPS, COLORS } from '../../data/driverData';

const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', bg: COLORS.pendingBg, color: COLORS.pending },
    in_progress: { label: 'In Progress', bg: COLORS.inProgressBg, color: COLORS.inProgress },
    completed: { label: 'Completed', bg: COLORS.completedBg, color: COLORS.completed },
  };
  const { label, bg, color } = config[status] || config.pending;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

const PickupCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.pickupCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.pickupIcon}>
      <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
    </View>
    <View style={styles.pickupInfo}>
      <Text style={styles.pickupName}>{item.name}</Text>
      <Text style={styles.pickupAddress}>{item.address}</Text>
      <Text style={styles.pickupTime}>{item.time} · {item.estimatedLiters}L est.</Text>
    </View>
    <View style={styles.pickupRight}>
      <StatusBadge status={item.status} />
      <Ionicons name="chevron-forward" size={16} color={COLORS.grayMid} style={{ marginTop: 6 }} />
    </View>
  </TouchableOpacity>
);

export default function DriverHomeScreen({ navigation }) {
  const todayPickups = PICKUPS.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerName}>{DRIVER.name}</Text>
          <Text style={styles.headerSub}>{DRIVER.route} · {DRIVER.district}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {DRIVER.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="water-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{DRIVER.todayCollected} L</Text>
            <Text style={styles.statLabel}>Collected today</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{DRIVER.stopsCompleted}/{DRIVER.stopsTotal}</Text>
            <Text style={styles.statLabel}>Stops remaining</Text>
          </View>
        </View>

        <View style={styles.weeklyCard}>
          <View style={styles.weeklyLeft}>
            <View style={styles.weeklyIconWrap}>
              <Ionicons name="bar-chart-outline" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.weeklyTitle}>Weekly Total</Text>
              <Text style={styles.weeklySub}>{DRIVER.weeklyTotal}L · {DRIVER.weeklyStops} stops</Text>
            </View>
          </View>
          <Text style={styles.weeklyChange}>+{DRIVER.weeklyChange}%</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Pickups</Text>
          <Text style={styles.sectionCount}>{PICKUPS.length} scheduled</Text>
        </View>

        {todayPickups.map(item => (
          <PickupCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('DriverCollections')}
          />
        ))}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('DriverCollections')}
        >
          <Text style={styles.viewAllText}>View All Pickups</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerName: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1, backgroundColor: COLORS.offWhite },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  weeklyCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 12,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, marginBottom: 8,
  },
  weeklyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weeklyIconWrap: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  weeklyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  weeklySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  weeklyChange: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionCount: { fontSize: 13, color: COLORS.gray },
  pickupCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  pickupIcon: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  pickupInfo: { flex: 1 },
  pickupName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  pickupAddress: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  pickupTime: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  pickupRight: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  viewAllBtn: {
    marginHorizontal: 16, marginTop: 4, backgroundColor: COLORS.primaryLight,
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  viewAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
});