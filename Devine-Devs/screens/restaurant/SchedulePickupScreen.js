import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurant } from '../../src/hooks/useRestaurant';
import {
  getUpcomingPickup,
  mapScheduleDriver,
  mapSchedulePickupDate,
  mapScheduleStatus,
} from '../../src/utils/restaurantViewModels';

const COLORS = {
  background: '#F4F4EF', card: '#FFFFFF',
  green: '#16A34A', greenLight: '#DCFCE7', greenDark: '#14532D',
  textPrimary: '#0F172A', textSecondary: '#64748B', textMuted: '#94A3B8',
  border: '#E2E8F0', inputBg: '#F8FAFC', inputBorderFocus: '#16A34A',
  error: '#DC2626',
};

const FONTS = {
  bold: 'Poppins_700Bold', semiBold: 'Poppins_600SemiBold',
  bodyMedium: 'Inter_500Medium', bodySemiBold: 'Inter_600SemiBold',
  bodyRegular: 'Inter_400Regular',
};

const TIME_SLOTS = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00'];

export default function SchedulePickupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { tank, qualityLogs, pickups, createPickupRequest } = useRestaurant();
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const upcomingPickup = useMemo(() => getUpcomingPickup(pickups), [pickups]);
  const statusCard = useMemo(
    () => mapScheduleStatus({ tank, qualityLogs }),
    [tank, qualityLogs]
  );
  const pickupDate = useMemo(
    () => mapSchedulePickupDate(upcomingPickup),
    [upcomingPickup]
  );
  const driver = useMemo(
    () => mapScheduleDriver(upcomingPickup),
    [upcomingPickup]
  );

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');

    try {
      if (!upcomingPickup) {
        await createPickupRequest({
          status: 'scheduled',
          time_window: selectedSlot,
          notes: notes.trim() || null,
        });
      }

      setConfirmed(true);
      setTimeout(() => navigation.navigate('RestaurantTabs', { screen: 'Pickups' }), 1800);
    } catch (err) {
      setError(err.message ?? 'Could not schedule pickup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Schedule Pickup</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.green} />
          </View>
          <View>
            <Text style={styles.statusTitle}>{statusCard.title}</Text>
            <Text style={styles.statusSub}>{statusCard.subtitle}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Pickup Date</Text>
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={18} color={COLORS.green} />
            <Text style={styles.dateText}>{pickupDate}</Text>
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedBadgeText}>
                {upcomingPickup ? 'Scheduled' : 'New Request'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferred Time Window</Text>
        <View style={styles.slotGrid}>
          {TIME_SLOTS.map((slot) => (
            <Pressable
              key={slot}
              style={[styles.slotItem, selectedSlot === slot && styles.slotItemActive]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={selectedSlot === slot ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                {slot}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Assigned Driver</Text>
        <View style={styles.card}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{driver.initials}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.driverRatingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.driverRating}>
                  {driver.rating} • {driver.collections} collections
                </Text>
              </View>
            </View>
            <View style={styles.driverOnline}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Available</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Additional Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. Use back entrance, call on arrival..."
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {confirmed ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
            <Text style={styles.successText}>Pickup confirmed! Redirecting...</Text>
          </View>
        ) : (
          <Pressable style={styles.confirmButton} onPress={handleConfirm} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { width: 38, height: 38, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.textPrimary },
  content: { padding: 16 },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.greenLight, borderRadius: 14,
    padding: 14, marginBottom: 20,
  },
  statusIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  statusTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.greenDark },
  statusSub: { fontFamily: FONTS.bodyRegular, fontSize: 12, color: COLORS.green, marginTop: 2 },

  sectionLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 11,
    color: COLORS.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.7, marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: COLORS.border,
  },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { flex: 1, fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  confirmedBadge: {
    backgroundColor: COLORS.greenLight, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  confirmedBadgeText: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.green },

  slotGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18,
  },
  slotItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    width: '47%', backgroundColor: COLORS.card,
    borderRadius: 10, padding: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  slotItemActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  slotText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textSecondary },
  slotTextActive: { color: '#FFFFFF' },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center',
  },
  driverAvatarText: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.green },
  driverInfo: { flex: 1 },
  driverName: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  driverRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontFamily: FONTS.bodyRegular, fontSize: 12, color: COLORS.textMuted },
  driverOnline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  onlineText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.green },

  notesInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontFamily: FONTS.bodyRegular,
    fontSize: 14, color: COLORS.textPrimary,
    textAlignVertical: 'top', minHeight: 90,
    marginBottom: 20,
  },

  confirmButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8,
    backgroundColor: COLORS.greenDark,
    paddingVertical: 15, borderRadius: 13, marginBottom: 10,
  },
  confirmButtonText: {
    fontFamily: FONTS.bold, color: '#FFFFFF',
    fontSize: 14, letterSpacing: 0.4, textTransform: 'uppercase',
  },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.textMuted },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.greenLight, borderRadius: 13,
    padding: 16, marginBottom: 10, justifyContent: 'center',
  },
  successText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.green },
  errorText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 13,
    color: COLORS.error,
    marginBottom: 12,
  },
});
