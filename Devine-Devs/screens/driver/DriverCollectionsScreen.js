// Devine-Devs/screens/driver/DriverCollectionsScreen.js
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
          <View style={styles.iconWrap}>
            <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={12} color={COLORS.gray} />
              <Text style={styles.cardAddress}> {item.address}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Ionicons name="time-outline" size={12} color={COLORS.gray} />
              <Text style={styles.cardTime}> {item.time} · {item.estimatedLiters}L est.</Text>
            </View>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.callBtn} onPress={onCall} activeOpacity={0.7}>
          <Ionicons name="call-outline" size={15} color={COLORS.text} />
          <Text style={styles.callBtnText}>  Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, actionDisabled && styles.actionBtnDisabled]}
          onPress={!actionDisabled ? onAction : undefined}
          activeOpacity={actionDisabled ? 1 : 0.7}
        >
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
    </View>
  );
};

export default function DriverCollectionsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [pickups, setPickups] = useState(PICKUPS);

  const filtered = pickups.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return p.status === 'pending';
    if (activeFilter === 'In Progress') return p.status === 'in_progress';
    if (activeFilter === 'Completed') return p.status === 'completed';
    return true;
  });

  const handleAction = (item) => {
    setPickups(prev => prev.map(p => {
      if (p.id !== item.id) return p;
      if (p.status === 'pending') return { ...p, status: 'in_progress' };
      if (p.status === 'in_progress') return { ...p, status: 'completed' };
      return p;
    }));
  };

  const scheduledCount = pickups.filter(p => p.status !== 'completed').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
        <Text style={styles.headerSub}>{scheduledCount} pickups remaining today</Text>
      </View>
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
            onCall={() => Alert.alert('Call', `Calling ${item.name}...`)}
            onAction={() => handleAction(item)}
          />
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={40} color={COLORS.grayMid} />
            <Text style={styles.emptyText}>No collections here</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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