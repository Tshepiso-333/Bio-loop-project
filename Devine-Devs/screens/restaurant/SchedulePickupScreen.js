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

const TIME_SLOTS = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00'];

export default function SchedulePickupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { tank, qualityLogs, pickups, createPickupRequest } = useRestaurant();
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [notesFocused, setNotesFocused] = useState(false);
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
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferred time window</Text>
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
            <View style={styles.driverOnline}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Available</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Additional notes (optional)</Text>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {confirmed ? (
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
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: REST_COLORS.page },
  content: { padding: REST_SPACING.screenPadding, paddingTop: 8 },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: REST_COLORS.paleGreen, borderRadius: REST_RADII.card,
    padding: 14, marginBottom: 20,
  },
  statusIconWrap: {
    width: 44, height: 44, borderRadius: 12,
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

  slotGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18,
  },
  slotItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    width: '47%', backgroundColor: REST_COLORS.card,
    borderRadius: REST_RADII.chip, padding: 12,
    borderWidth: 1.5, borderColor: REST_COLORS.border,
  },
  slotItemActive: { backgroundColor: REST_COLORS.primary, borderColor: REST_COLORS.primary },
  slotText: { fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.body },
  slotTextActive: { color: REST_COLORS.white },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: REST_COLORS.paleGreen,
    justifyContent: 'center', alignItems: 'center',
  },
  driverAvatarText: { fontFamily: REST_FONTS.bold, fontSize: 16, color: REST_COLORS.primary },
  driverInfo: { flex: 1 },
  driverName: { fontFamily: REST_FONTS.semiBold, fontSize: 15, color: REST_COLORS.ink },
  driverRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.muted },
  driverOnline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: REST_COLORS.primary },
  onlineText: { fontFamily: REST_FONTS.medium, fontSize: 12, color: REST_COLORS.primary },

  notesInput: {
    backgroundColor: REST_COLORS.surfaceSoft, borderWidth: 1.5,
    borderColor: REST_COLORS.border, borderRadius: REST_RADII.input,
    padding: 14, fontFamily: REST_FONTS.medium,
    fontSize: 16, color: REST_COLORS.ink,
    textAlignVertical: 'top', minHeight: 90,
    marginBottom: 20,
  },
  notesInputFocused: { borderColor: REST_COLORS.primary, borderWidth: 2 },

  confirmButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8,
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
