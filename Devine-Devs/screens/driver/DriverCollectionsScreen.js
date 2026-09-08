// Devine-Devs/screens/driver/DriverCollectionsScreen.js
<<<<<<< HEAD
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PICKUPS, COLORS } from '../../data/driverData';

const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];

const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', bg: COLORS.pendingBg, color: COLORS.pending },
    in_progress: { label: 'In Progress', bg: COLORS.inProgressBg, color: COLORS.inProgress },
    completed: { label: 'Completed', bg: COLORS.completedBg, color: COLORS.completed },
  };
  const { label, bg, color } = config[status] || config.pending;
=======
import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCollectorContext } from '../../src/contexts/CollectorContext';
import { ACTIVE_TRIP_STATUSES, PICKUP_STATUS_LABELS, PRE_TRIP_STATUSES } from '../../src/lib/pickupStatus';

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
  pending: '#F59E0B',
  pendingBg: '#FEF3C7',
  inProgress: '#3B82F6',
  inProgressBg: '#DBEAFE',
  completed: '#10B981',
  completedBg: '#D1FAE5',
};

const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];

const STATUS_BADGE_COLORS = {
  pending: { bg: THEME.pendingBg, color: THEME.pending },
  scheduled: { bg: THEME.pendingBg, color: THEME.pending },
  in_transit: { bg: THEME.inProgressBg, color: THEME.inProgress },
  arrival: { bg: THEME.inProgressBg, color: THEME.inProgress },
  in_progress: { bg: THEME.inProgressBg, color: THEME.inProgress },
  collected: { bg: THEME.inProgressBg, color: THEME.inProgress },
  arrived_manufacturer: { bg: THEME.inProgressBg, color: THEME.inProgress },
  completed: { bg: THEME.completedBg, color: THEME.completed },
};

const StatusBadge = ({ status }) => {
  const { bg, color } = STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS.pending;
  const label = PICKUP_STATUS_LABELS[status] ?? 'Pending';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

<<<<<<< HEAD
const CollectionCard = ({ item, onCall, onAction }) => {
  const actionDisabled = item.status === 'completed';
  const actionLabel = item.status === 'pending' ? 'Start' : item.status === 'in_progress' ? 'Complete' : 'Done';
=======
const CollectionCard = ({ item, onCall, onAction, onDecline }) => {
  const actionDisabled = item.status === 'completed';
  const actionLabel = PRE_TRIP_STATUSES.includes(item.status)
    ? 'Accept'
    : ACTIVE_TRIP_STATUSES.includes(item.status)
      ? 'Continue trip'
      : 'Done';
  const canDecline = PRE_TRIP_STATUSES.includes(item.status);
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
<<<<<<< HEAD
          <View style={styles.iconWrap}>
            <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
=======
          <View style={[styles.iconWrap, { backgroundColor: THEME.primaryLight }]}>
            <Ionicons name="storefront-outline" size={20} color={THEME.primary} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.cardMeta}>
<<<<<<< HEAD
              <Ionicons name="location-outline" size={12} color={COLORS.gray} />
              <Text style={styles.cardAddress}> {item.address}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Ionicons name="time-outline" size={12} color={COLORS.gray} />
=======
              <Ionicons name="location-outline" size={12} color={THEME.gray} />
              <Text style={styles.cardAddress}> {item.address}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Ionicons name="time-outline" size={12} color={THEME.gray} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
              <Text style={styles.cardTime}> {item.time} · {item.estimatedLiters}L est.</Text>
            </View>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.callBtn} onPress={onCall} activeOpacity={0.7}>
<<<<<<< HEAD
          <Ionicons name="call-outline" size={15} color={COLORS.text} />
=======
          <Ionicons name="call-outline" size={15} color={THEME.text} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          <Text style={styles.callBtnText}>  Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, actionDisabled && styles.actionBtnDisabled]}
          onPress={!actionDisabled ? onAction : undefined}
          activeOpacity={actionDisabled ? 1 : 0.7}
        >
<<<<<<< HEAD
          <Ionicons
            name={actionDisabled ? 'checkmark-circle' : item.status === 'pending' ? 'play' : 'checkmark'}
            size={15}
            color={actionDisabled ? COLORS.gray : COLORS.white}
          />
          <Text style={[styles.actionBtnText, actionDisabled && styles.actionBtnTextDisabled]}>
            {'  ' + actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
=======
          <LinearGradient
            colors={!actionDisabled ? [THEME.primary, THEME.primaryDark] : [THEME.grayLight, THEME.grayLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Ionicons
              name={
                actionDisabled
                  ? 'checkmark-circle'
                  : PRE_TRIP_STATUSES.includes(item.status)
                    ? 'play'
                    : 'navigate'
              }
              size={15}
              color={actionDisabled ? THEME.gray : THEME.white}
            />
            <Text style={[styles.actionBtnText, actionDisabled && styles.actionBtnTextDisabled]}>
              {'  ' + actionLabel}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {canDecline ? (
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.7}>
          <Text style={styles.declineBtnText}>Decline this pickup</Text>
        </TouchableOpacity>
      ) : null}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </View>
  );
};

<<<<<<< HEAD
export default function DriverCollectionsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [pickups, setPickups] = useState(PICKUPS);

  const filtered = pickups.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return p.status === 'pending';
    if (activeFilter === 'In Progress') return p.status === 'in_progress';
=======
export default function DriverCollectionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const { pickups: assignedPickups = [], updatePickupStatus, declinePickup } = useCollectorContext();

  const pickups = useMemo(
    () => (assignedPickups || []).map(p => ({
      id: p.id,
      name: p.restaurants?.name ?? 'Unknown',
      address: p.restaurants?.address ?? '',
      phone: p.restaurants?.phone ?? '',
      time: p.pickup_time_start ?? '',
      estimatedLiters: p.estimated_volume_liters ?? p.actual_volume_liters ?? 0,
      status: p.status ?? 'pending',
    })),
    [assignedPickups]
  );

  const filtered = pickups.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return PRE_TRIP_STATUSES.includes(p.status);
    if (activeFilter === 'In Progress') return ACTIVE_TRIP_STATUSES.includes(p.status);
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    if (activeFilter === 'Completed') return p.status === 'completed';
    return true;
  });

<<<<<<< HEAD
  const handleAction = (item) => {
    setPickups(prev => prev.map(p => {
      if (p.id !== item.id) return p;
      if (p.status === 'pending') return { ...p, status: 'in_progress' };
      if (p.status === 'in_progress') return { ...p, status: 'completed' };
      return p;
    }));
=======
  // Pending pickups accept into the trip (status -> in_transit) then hand off
  // to the map, which owns every checkpoint from there — driving to the
  // restaurant, arrival, collection, driving to the manufacturer, delivery.
  // Pickups already mid-trip just jump back into the map where they left off.
  const handleAction = async (item) => {
    if (PRE_TRIP_STATUSES.includes(item.status)) {
      try {
        await updatePickupStatus(item.id, 'in_transit');
        navigation.navigate('DriverMap', { pickupId: item.id });
      } catch (err) {
        Alert.alert('Could not accept pickup', err.message ?? 'Please try again.');
      }
      return;
    }

    if (ACTIVE_TRIP_STATUSES.includes(item.status)) {
      navigation.navigate('DriverMap', { pickupId: item.id });
    }
  };

  const handleDecline = (item) => {
    Alert.alert(
      'Decline pickup',
      `Decline the pickup at ${item.name}? It will go back to the dispatch queue for another driver.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declinePickup(item.id, 'Declined by driver');
            } catch (err) {
              Alert.alert('Could not decline', err.message ?? 'Please try again.');
            }
          },
        },
      ]
    );
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  };

  const scheduledCount = pickups.filter(p => p.status !== 'completed').length;

<<<<<<< HEAD
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
        <Text style={styles.headerSub}>{scheduledCount} pickups remaining today</Text>
      </View>
=======
  // Header Component with Logo and Gradient that fills to top
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primaryDark} />
      <LinearGradient
        colors={[THEME.primary, THEME.primaryDark, THEME.primaryDarker]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >

        
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Collections</Text>
          <Text style={styles.headerSub}>{scheduledCount} pickups remaining today</Text>
        </View>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      {/* Filter Row */}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
<<<<<<< HEAD
=======
      
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.map(item => (
          <CollectionCard
            key={item.id}
            item={item}
<<<<<<< HEAD
            onCall={() => Alert.alert('Call', `Calling ${item.name}...`)}
            onAction={() => handleAction(item)}
=======
            onCall={() => Alert.alert('Call', item.phone ? `Calling ${item.phone}...` : `Calling ${item.name}...`)}
            onAction={() => handleAction(item)}
            onDecline={() => handleDecline(item)}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          />
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
<<<<<<< HEAD
            <Ionicons name="checkmark-done-outline" size={40} color={COLORS.grayMid} />
            <Text style={styles.emptyText}>No collections here</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
=======
            <Ionicons name="checkmark-done-outline" size={50} color={THEME.gray} />
            <Text style={styles.emptyText}>No collections here</Text>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  filterRow: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
    backgroundColor: COLORS.offWhite, borderWidth: 1, borderColor: COLORS.grayLight,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  scroll: { flex: 1, backgroundColor: COLORS.offWhite, paddingTop: 8 },
  card: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  cardLeft: { flexDirection: 'row', flex: 1, gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  cardAddress: { fontSize: 12, color: COLORS.textSecondary },
  cardTime: { fontSize: 12, color: COLORS.gray },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 8, flexDirection: 'row',
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.grayLight,
    alignItems: 'center', justifyContent: 'center',
  },
  callBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  actionBtn: {
    flex: 1.5, paddingVertical: 11, borderRadius: 8, flexDirection: 'row',
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDisabled: { backgroundColor: COLORS.grayLight },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  actionBtnTextDisabled: { color: COLORS.gray },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.gray },
});
=======
  container: { 
    flex: 1, 
    backgroundColor: THEME.offWhite 
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: THEME.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.white,
  },
  companyName: {
    fontSize: 10,
    color: THEME.white,
    opacity: 0.9,
    marginTop: 1,
  },
  headerInfo: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: THEME.white 
  },
  headerSub: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 4 
  },
  filterRow: { 
    backgroundColor: THEME.white, 
    borderBottomWidth: 1, 
    borderBottomColor: THEME.grayLight 
  },
  filterContent: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    gap: 8 
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.offWhite,
    borderWidth: 1,
    borderColor: THEME.grayLight,
  },
  filterBtnActive: { 
    backgroundColor: THEME.primary, 
    borderColor: THEME.primary 
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: THEME.textSecondary 
  },
  filterTextActive: { 
    color: THEME.white 
  },
  scroll: { 
    flex: 1, 
    backgroundColor: THEME.offWhite, 
    paddingTop: 12 
  },
  card: {
    backgroundColor: THEME.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardLeft: { 
    flexDirection: 'row', 
    flex: 1, 
    gap: 12 
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { 
    flex: 1 
  },
  cardName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: THEME.text, 
    marginBottom: 4 
  },
  cardMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 2 
  },
  cardAddress: { 
    fontSize: 12, 
    color: THEME.textSecondary 
  },
  cardTime: { 
    fontSize: 12, 
    color: THEME.gray 
  },
  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '600' 
  },
  cardActions: { 
    flexDirection: 'row', 
    gap: 10 
  },
  callBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: THEME.text 
  },
  actionBtn: {
    flex: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  actionBtnDisabled: { 
    opacity: 0.7 
  },
  actionBtnText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: THEME.white 
  },
  actionBtnTextDisabled: {
    color: THEME.gray
  },
  declineBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 60, 
    gap: 12 
  },
  emptyText: { 
    fontSize: 14, 
    color: THEME.gray 
  },
});
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
