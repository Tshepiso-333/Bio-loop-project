<<<<<<< HEAD
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, StatusBar, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#F4F4EF', card: '#FFFFFF',
  green: '#16A34A', greenLight: '#DCFCE7', greenDark: '#14532D',
  textPrimary: '#0F172A', textSecondary: '#64748B', textMuted: '#94A3B8',
  border: '#E2E8F0', inputBg: '#F8FAFC', inputBorderFocus: '#16A34A',
};

const FONTS = {
  bold: 'Poppins_700Bold', semiBold: 'Poppins_600SemiBold',
  bodyMedium: 'Inter_500Medium', bodySemiBold: 'Inter_600SemiBold',
  bodyRegular: 'Inter_400Regular',
};
=======
import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurant } from '../../src/hooks/useRestaurant';
import RestaurantHeader from '../../src/restaurant/components/RestaurantHeader';
import {
  REST_COLORS,
  REST_FONTS,
  REST_RADII,
  REST_SHADOWS,
  REST_SPACING,
} from '../../src/restaurant/restaurantTheme';
import {
  getUpcomingPickup,
  mapScheduleDriver,
  mapSchedulePickupDate,
  mapScheduleStatus,
} from '../../src/utils/restaurantViewModels';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

const TIME_SLOTS = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00'];

export default function SchedulePickupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
<<<<<<< HEAD
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    // In production: POST to your API here, then navigate back
    setTimeout(() => navigation.navigate('RestaurantTabs', { screen: 'Pickups' }), 1800);
=======
  const { tank, qualityLogs, pickups, createPickupRequest } = useRestaurant();
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [notesFocused, setNotesFocused] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const upcomingPickup = useMemo(() => getUpcomingPickup(pickups), [pickups]);
  // Once a pickup already exists there's no update path for its time/notes —
  // this screen used to let you "change" them and silently discard it on
  // Confirm. Rather than build real edit support, it's now view-only for an
  // existing pickup so nothing implies a change is being saved when it isn't.
  const isExisting = !!upcomingPickup;
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
  const existingTimeWindow = useMemo(() => {
    if (!upcomingPickup?.pickup_time_start || !upcomingPickup?.pickup_time_end) return null;
    const fmt = (t) => t?.slice(0, 5) ?? '';
    return `${fmt(upcomingPickup.pickup_time_start)} - ${fmt(upcomingPickup.pickup_time_end)}`;
  }, [upcomingPickup]);

  const handleConfirm = async () => {
    if (isExisting) return;
    setSubmitting(true);
    setError('');

    try {
      await createPickupRequest({
        status: 'scheduled',
        time_window: selectedSlot,
        notes: notes.trim() || null,
      });

      setConfirmed(true);
      setTimeout(() => navigation.navigate('RestaurantTabs', { screen: 'Pickups' }), 1800);
    } catch (err) {
      setError(err.message ?? 'Could not schedule pickup.');
    } finally {
      setSubmitting(false);
    }
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  };

  return (
    <View style={styles.root}>
<<<<<<< HEAD
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Schedule Pickup</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.green} />
          </View>
          <View>
            <Text style={styles.statusTitle}>Auto-Scheduled Pickup</Text>
            <Text style={styles.statusSub}>Tank at 75% • Grade A oil detected</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={styles.sectionLabel}>Pickup Date</Text>
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={18} color={COLORS.green} />
            <Text style={styles.dateText}>Oct 24, 2023</Text>
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedBadgeText}>Confirmed</Text>
=======
      <RestaurantHeader
        title="Schedule Pickup"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Ionicons name="calendar-outline" size={22} color={REST_COLORS.primary} />
          </View>
          <View>
            <Text style={styles.statusTitle}>{statusCard.title}</Text>
            <Text style={styles.statusSub}>{statusCard.subtitle}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Pickup date</Text>
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={18} color={REST_COLORS.primary} />
            <Text style={styles.dateText}>{pickupDate}</Text>
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedBadgeText}>
                {upcomingPickup ? 'Scheduled' : 'New Request'}
              </Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
            </View>
          </View>
        </View>

<<<<<<< HEAD
        {/* Time slot selector */}
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

        {/* Driver info */}
        <Text style={styles.sectionLabel}>Assigned Driver</Text>
        <View style={styles.card}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>S</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>Simphiwe</Text>
              <View style={styles.driverRatingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.driverRating}>4.9 • 120 collections</Text>
              </View>
            </View>
            <View style={styles.driverOnline}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Available</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
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

        {/* Confirm button */}
        {confirmed ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
            <Text style={styles.successText}>Pickup confirmed! Redirecting...</Text>
          </View>
        ) : (
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
          </Pressable>
        )}

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
=======
        <Text style={styles.sectionLabel}>Preferred time window</Text>
        {isExisting ? (
          <View style={styles.card}>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={18} color={REST_COLORS.primary} />
              <Text style={styles.dateText}>{existingTimeWindow ?? 'Not set'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((slot) => (
              <Pressable
                key={slot}
                style={({ pressed }) => [
                  styles.slotItem,
                  selectedSlot === slot && styles.slotItemActive,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={selectedSlot === slot ? REST_COLORS.white : REST_COLORS.body}
                />
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                  {slot}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>Assigned driver</Text>
        <View style={styles.card}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{driver.initials}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.driverRatingRow}>
                <Ionicons name="star" size={12} color={REST_COLORS.amber} />
                <Text style={styles.driverRating}>
                  {driver.rating} • {driver.collections} collections
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Additional notes (optional)</Text>
        {isExisting ? (
          <View style={[styles.card, { marginBottom: 20 }]}>
            <Text style={styles.notesReadOnlyText}>
              {upcomingPickup.notes?.trim() || 'No notes added.'}
            </Text>
          </View>
        ) : (
          <TextInput
            style={[styles.notesInput, notesFocused && styles.notesInputFocused]}
            placeholder="e.g. Use back entrance, call on arrival..."
            placeholderTextColor={REST_COLORS.muted}
            value={notes}
            onChangeText={setNotes}
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
            multiline
            numberOfLines={3}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isExisting ? (
          <View style={styles.successBanner}>
            <Ionicons name="information-circle" size={20} color={REST_COLORS.primary} />
            <Text style={styles.successText}>This pickup is already scheduled.</Text>
          </View>
        ) : confirmed ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={REST_COLORS.primary} />
            <Text style={styles.successText}>Pickup confirmed! Redirecting...</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.confirmButton, pressed && { opacity: 0.85 }]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={REST_COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={REST_COLORS.white} />
                <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>{isExisting ? 'Back' : 'Cancel'}</Text>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        </Pressable>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
  root: { flex: 1, backgroundColor: REST_COLORS.page },
  content: { padding: REST_SPACING.screenPadding, paddingTop: 8 },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: REST_COLORS.paleGreen, borderRadius: REST_RADII.card,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    padding: 14, marginBottom: 20,
  },
  statusIconWrap: {
    width: 44, height: 44, borderRadius: 12,
<<<<<<< HEAD
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
=======
    backgroundColor: REST_COLORS.white, justifyContent: 'center', alignItems: 'center',
  },
  statusTitle: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.primary },
  statusSub: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.body, marginTop: 2 },

  sectionLabel: {
    fontFamily: REST_FONTS.semiBold, fontSize: 13,
    color: REST_COLORS.body, marginBottom: 8,
  },
  card: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: REST_COLORS.border,
    ...REST_SHADOWS.card,
  },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { flex: 1, fontFamily: REST_FONTS.semiBold, fontSize: 15, color: REST_COLORS.ink },
  confirmedBadge: {
    backgroundColor: REST_COLORS.paleGreen, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  confirmedBadgeText: { fontFamily: REST_FONTS.semiBold, fontSize: 11, color: REST_COLORS.primary },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  slotGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18,
  },
  slotItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
<<<<<<< HEAD
    width: '47%', backgroundColor: COLORS.card,
    borderRadius: 10, padding: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  slotItemActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  slotText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textSecondary },
  slotTextActive: { color: '#FFFFFF' },
=======
    width: '47%', backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.chip, padding: 12,
    borderWidth: 1.5, borderColor: REST_COLORS.border,
  },
  slotItemActive: { backgroundColor: REST_COLORS.primary, borderColor: REST_COLORS.primary },
  slotText: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.body },
  slotTextActive: { color: REST_COLORS.white },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
<<<<<<< HEAD
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
=======
    backgroundColor: REST_COLORS.paleGreen,
    justifyContent: 'center', alignItems: 'center',
  },
  driverAvatarText: { fontFamily: REST_FONTS.bold, fontSize: 16, color: REST_COLORS.primary },
  driverInfo: { flex: 1 },
  driverName: { fontFamily: REST_FONTS.semiBold, fontSize: 15, color: REST_COLORS.ink },
  driverRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.muted },

  notesReadOnlyText: {
    fontFamily: REST_FONTS.medium, fontSize: 14, color: REST_COLORS.ink, lineHeight: 20,
  },
  notesInput: {
    backgroundColor: REST_COLORS.surfaceSoft, borderWidth: 1.5,
    borderColor: REST_COLORS.border, borderRadius: REST_RADII.input,
    padding: 14, fontFamily: REST_FONTS.medium,
    fontSize: 16, color: REST_COLORS.ink,
    textAlignVertical: 'top', minHeight: 90,
    marginBottom: 20,
  },
  notesInputFocused: { borderColor: REST_COLORS.primary, borderWidth: 2 },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  confirmButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8,
<<<<<<< HEAD
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
});
=======
    backgroundColor: REST_COLORS.primary,
    paddingVertical: 15, borderRadius: REST_RADII.pill, marginBottom: 10,
    ...REST_SHADOWS.button,
  },
  confirmButtonText: {
    fontFamily: REST_FONTS.bold, color: REST_COLORS.white, fontSize: 14,
  },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelButtonText: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.muted },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: REST_COLORS.paleGreen, borderRadius: REST_RADII.card,
    padding: 16, marginBottom: 10, justifyContent: 'center',
  },
  successText: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.primary },
  errorText: {
    fontFamily: REST_FONTS.medium,
    fontSize: 13,
    color: REST_COLORS.alertText,
    marginBottom: 12,
  },
});
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
