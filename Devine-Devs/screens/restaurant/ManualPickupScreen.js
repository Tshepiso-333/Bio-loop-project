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
import { mapTankCardData } from '../../src/utils/restaurantViewModels';

// Urgent orange is semantic — kept deliberately, not forest-greened.
const URGENT_COLOR = '#EA580C';

const URGENCY_OPTIONS = [
  { key: 'standard', label: 'Standard', subtitle: 'Within 24 hrs', icon: 'time-outline', color: REST_COLORS.primary },
  { key: 'urgent',   label: 'Urgent',   subtitle: 'Within 4 hrs',  icon: 'flash-outline', color: URGENT_COLOR },
];

const REASONS = [
  'Tank overflow risk',
  'Emergency disposal',
  'Equipment maintenance',
  'Other',
];

export default function ManualPickupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { tank, createManualPickupRequest } = useRestaurant();
  const [urgency, setUrgency] = useState('standard');
  const [selectedReason, setSelectedReason] = useState(null);
  const [notes, setNotes] = useState('');
  const [notesFocused, setNotesFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tankData = useMemo(() => mapTankCardData(tank), [tank]);
  const fillPercent = tankData?.fillPercent ?? 0;
  const temperature = tankData?.temperature ?? 0;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason for the request.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createManualPickupRequest({
        urgency,
        reason: selectedReason,
        notes: notes.trim() || null,
      });
      setSubmitted(true);
      setTimeout(() => navigation.navigate('RestaurantTabs', { screen: 'Pickups' }), 1800);
    } catch (err) {
      setError(err.message ?? 'Could not submit manual pickup request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get the color for the selected urgency
  const getUrgencyColor = () => {
    return urgency === 'urgent' ? URGENT_COLOR : REST_COLORS.primary;
  };

  return (
    <View style={styles.root}>
      <RestaurantHeader
        title="Manual Pickup"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Warning banner - emergency colours kept */}
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color={REST_COLORS.warnText} />
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Emergency / Overflow Request</Text>
            <Text style={styles.warningSub}>
              Use this only for unscheduled collections. Additional fees may apply for urgent pickups.
            </Text>
          </View>
        </View>

        {/* Current tank status */}
        <Text style={styles.sectionLabel}>Current tank status</Text>
        <View style={styles.tankStatusCard}>
          <View style={styles.tankStatusRow}>
            <Ionicons name="water-outline" size={18} color={REST_COLORS.primary} />
            <Text style={styles.tankStatusLabel}>Fill level</Text>
            <Text style={styles.tankStatusValue}>{fillPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(fillPercent, 100)}%` }]} />
          </View>
          <View style={styles.tankStatusRow}>
            <Ionicons name="thermometer-outline" size={18} color={REST_COLORS.primary} />
            <Text style={styles.tankStatusLabel}>Temperature</Text>
            <Text style={styles.tankStatusValue}>{temperature}°C</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Urgency selector */}
        <Text style={styles.sectionLabel}>Urgency level</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map((opt) => {
            const isActive = urgency === opt.key;
            const activeColor = opt.color;
            return (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [
                  styles.urgencyCard,
                  isActive && { backgroundColor: activeColor, borderColor: activeColor },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setUrgency(opt.key)}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={isActive ? REST_COLORS.white : REST_COLORS.body}
                />
                <Text style={[styles.urgencyLabel, isActive && styles.urgencyLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={[styles.urgencySub, isActive && styles.urgencySubActive]}>
                  {opt.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Reason selector */}
        <Text style={styles.sectionLabel}>Reason for request</Text>
        <View style={styles.card}>
          {REASONS.map((reason, index) => (
            <Pressable
              key={reason}
              style={({ pressed }) => [
                styles.reasonRow,
                index < REASONS.length - 1 && styles.reasonRowBorder,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={[
                styles.radioOuter,
                selectedReason === reason && { borderColor: getUrgencyColor() }
              ]}>
                {selectedReason === reason && <View style={[styles.radioInner, { backgroundColor: getUrgencyColor() }]} />}
              </View>
              <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                {reason}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Describe the situation</Text>
        <TextInput
          style={[styles.notesInput, notesFocused && styles.notesInputFocused]}
          placeholder="Describe what's happening with your tank..."
          placeholderTextColor={REST_COLORS.muted}
          value={notes}
          onChangeText={setNotes}
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
          multiline
          numberOfLines={4}
        />

        {/* Submit */}
        {submitted ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={REST_COLORS.primary} />
            <Text style={styles.successText}>Request submitted! A driver will be assigned shortly.</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: getUrgencyColor(), shadowColor: getUrgencyColor() },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={REST_COLORS.white} />
            ) : (
              <>
                <Ionicons name="send-outline" size={17} color={REST_COLORS.white} />
                <Text style={styles.submitButtonText}>
                  {urgency === 'urgent' ? 'Submit Urgent Request' : 'Submit Request'}
                </Text>
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

  warningCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: REST_COLORS.warnBg, borderRadius: REST_RADII.card,
    borderWidth: 1, borderColor: REST_COLORS.warnBorder,
    padding: 14, marginBottom: 20, alignItems: 'flex-start',
  },
  warningText: { flex: 1 },
  warningTitle: { fontFamily: REST_FONTS.bold, fontSize: 13, color: REST_COLORS.warnText, marginBottom: 4 },
  warningSub: { fontFamily: REST_FONTS.medium, fontSize: 12, color: '#92400E', lineHeight: 18 },

  sectionLabel: {
    fontFamily: REST_FONTS.semiBold, fontSize: 13,
    color: REST_COLORS.body, marginBottom: 8,
  },

  tankStatusCard: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: REST_COLORS.border, gap: 10,
    ...REST_SHADOWS.card,
  },
  tankStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tankStatusLabel: { flex: 1, fontFamily: REST_FONTS.medium, fontSize: 13, color: REST_COLORS.body },
  tankStatusValue: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.ink },
  progressTrack: {
    height: 8, backgroundColor: REST_COLORS.border, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: REST_COLORS.primary, borderRadius: 4 },

  urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  urgencyCard: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.chip,
    padding: 14, borderWidth: 1.5, borderColor: REST_COLORS.border,
  },
  urgencyLabel: { fontFamily: REST_FONTS.bold, fontSize: 14, color: REST_COLORS.ink },
  urgencyLabelActive: { color: REST_COLORS.white },
  urgencySub: { fontFamily: REST_FONTS.medium, fontSize: 11, color: REST_COLORS.muted },
  urgencySubActive: { color: 'rgba(255,255,255,0.75)' },

  card: {
    backgroundColor: REST_COLORS.card, borderRadius: REST_RADII.card,
    marginBottom: 18, borderWidth: 1, borderColor: REST_COLORS.border, overflow: 'hidden',
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14,
  },
  reasonRowBorder: { borderBottomWidth: 1, borderBottomColor: REST_COLORS.divider },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: REST_COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontFamily: REST_FONTS.medium, fontSize: 14, color: REST_COLORS.body },
  reasonTextActive: { fontFamily: REST_FONTS.semiBold, color: REST_COLORS.ink },

  notesInput: {
    backgroundColor: REST_COLORS.surfaceSoft, borderWidth: 1.5,
    borderColor: REST_COLORS.border, borderRadius: REST_RADII.input,
    padding: 14, fontFamily: REST_FONTS.medium,
    fontSize: 16, color: REST_COLORS.ink,
    textAlignVertical: 'top', minHeight: 100, marginBottom: 20,
  },
  notesInputFocused: { borderColor: REST_COLORS.primary, borderWidth: 2 },

  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: REST_RADII.pill,
    marginBottom: 10,
    ...REST_SHADOWS.button,
  },
  submitButtonText: {
    fontFamily: REST_FONTS.bold, color: REST_COLORS.white, fontSize: 14,
  },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelButtonText: { fontFamily: REST_FONTS.semiBold, fontSize: 14, color: REST_COLORS.muted },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: REST_COLORS.paleGreen, borderRadius: REST_RADII.card,
    padding: 16, marginBottom: 10,
  },
  successText: { fontFamily: REST_FONTS.bold, fontSize: 13, color: REST_COLORS.primary, flex: 1 },
  errorText: {
    fontFamily: REST_FONTS.medium,
    fontSize: 13,
    color: REST_COLORS.alertText,
    marginBottom: 12,
  },
});
