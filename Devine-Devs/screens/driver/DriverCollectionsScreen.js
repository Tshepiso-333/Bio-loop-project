// Devine-Devs/screens/driver/DriverCollectionsScreen.js
import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCollectorContext } from '../../src/contexts/CollectorContext';

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

const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', bg: THEME.pendingBg, color: THEME.pending },
    in_progress: { label: 'In Progress', bg: THEME.inProgressBg, color: THEME.inProgress },
    completed: { label: 'Completed', bg: THEME.completedBg, color: THEME.completed },
  };
  const { label, bg, color } = config[status] || config.pending;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

const CollectionCard = ({ item, onCall, onAction }) => {
  const actionDisabled = item.status === 'completed';
  const actionLabel = item.status === 'pending' ? 'Start' : item.status === 'in_progress' ? 'Complete' : 'Done';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconWrap, { backgroundColor: THEME.primaryLight }]}>
            <Ionicons name="storefront-outline" size={20} color={THEME.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={12} color={THEME.gray} />
              <Text style={styles.cardAddress}> {item.address}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Ionicons name="time-outline" size={12} color={THEME.gray} />
              <Text style={styles.cardTime}> {item.time} · {item.estimatedLiters}L est.</Text>
            </View>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.callBtn} onPress={onCall} activeOpacity={0.7}>
          <Ionicons name="call-outline" size={15} color={THEME.text} />
          <Text style={styles.callBtnText}>  Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, actionDisabled && styles.actionBtnDisabled]}
          onPress={!actionDisabled ? onAction : undefined}
          activeOpacity={actionDisabled ? 1 : 0.7}
        >
          <LinearGradient
            colors={!actionDisabled ? [THEME.primary, THEME.primaryDark] : [THEME.grayLight, THEME.grayLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Ionicons
              name={actionDisabled ? 'checkmark-circle' : item.status === 'pending' ? 'play' : 'checkmark'}
              size={15}
              color={actionDisabled ? THEME.gray : THEME.white}
            />
            <Text style={[styles.actionBtnText, actionDisabled && styles.actionBtnTextDisabled]}>
              {'  ' + actionLabel}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function DriverCollectionsScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const { pickups: assignedPickups = [], updatePickupStatus } = useCollectorContext();

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
    if (activeFilter === 'Pending') return p.status === 'pending';
    if (activeFilter === 'In Progress') return p.status === 'in_progress';
    if (activeFilter === 'Completed') return p.status === 'completed';
    return true;
  });

  const handleAction = async (item) => {
    const nextStatus =
      item.status === 'pending'
        ? 'in_progress'
        : item.status === 'in_progress'
          ? 'completed'
          : item.status;

    if (nextStatus === item.status) return;

    try {
      await updatePickupStatus(item.id, nextStatus);
    } catch (err) {
      Alert.alert('Update failed', err.message ?? 'Could not update pickup status.');
    }
  };

  const scheduledCount = pickups.filter(p => p.status !== 'completed').length;

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
      
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.map(item => (
          <CollectionCard
            key={item.id}
            item={item}
            onCall={() => Alert.alert('Call', item.phone ? `Calling ${item.phone}...` : `Calling ${item.name}...`)}
            onAction={() => handleAction(item)}
          />
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={50} color={THEME.gray} />
            <Text style={styles.emptyText}>No collections here</Text>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
