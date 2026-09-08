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
  alertBg: '#FFF7ED', alertBorder: '#FED7AA', alertText: '#C2410C',
  textPrimary: '#0F172A', textSecondary: '#64748B', textMuted: '#94A3B8',
  border: '#E2E8F0', inputBg: '#F8FAFC',
};

const FONTS = {
  bold: 'Poppins_700Bold', semiBold: 'Poppins_600SemiBold',
  bodyMedium: 'Inter_500Medium', bodySemiBold: 'Inter_600SemiBold',
  bodyRegular: 'Inter_400Regular',
};

const URGENCY_OPTIONS = [
  { key: 'standard', label: 'Standard', subtitle: 'Within 24 hrs', icon: 'time-outline' },
  { key: 'urgent',   label: 'Urgent',   subtitle: 'Within 4 hrs',  icon: 'flash-outline' },
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
import { mapTankCardData } from '../../src/utils/restaurantViewModels';

// Urgent orange is semantic — kept deliberately, not forest-greened.
const URGENT_COLOR = '#EA580C';

const URGENCY_OPTIONS = [
  { key: 'standard', label: 'Standard', subtitle: 'Within 24 hrs', icon: 'time-outline', color: REST_COLORS.primary },
  { key: 'urgent',   label: 'Urgent',   subtitle: 'Within 4 hrs',  icon: 'flash-outline', color: URGENT_COLOR },
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
];

const REASONS = [
  'Tank overflow risk',
  'Emergency disposal',
  'Equipment maintenance',
  'Other',
];

export default function ManualPickupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
<<<<<<< HEAD
  const [urgency, setUrgency] = useState('standard');
  const [selectedReason, setSelectedReason] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    // In production: POST to your API here, then navigate back
    setTimeout(() => navigation.navigate('RestaurantTabs', { screen: 'Pickups' }), 1800);
=======
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
        <Text style={styles.headerTitle}>Manual Pickup Request</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Warning banner */}
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color={COLORS.alertText} />
=======
      <RestaurantHeader
        title="Manual Pickup"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Warning banner - emergency colours kept */}
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color={REST_COLORS.warnText} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Emergency / Overflow Request</Text>
            <Text style={styles.warningSub}>
              Use this only for unscheduled collections. Additional fees may apply for urgent pickups.
            </Text>
          </View>
        </View>

        {/* Current tank status */}
<<<<<<< HEAD
        <Text style={styles.sectionLabel}>Current Tank Status</Text>
        <View style={styles.tankStatusCard}>
          <View style={styles.tankStatusRow}>
            <Ionicons name="water-outline" size={18} color={COLORS.green} />
            <Text style={styles.tankStatusLabel}>Fill Level</Text>
            <Text style={styles.tankStatusValue}>82%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '82%' }]} />
          </View>
          <View style={styles.tankStatusRow}>
            <Ionicons name="thermometer-outline" size={18} color={COLORS.green} />
            <Text style={styles.tankStatusLabel}>Temperature</Text>
            <Text style={styles.tankStatusValue}>104°F</Text>
          </View>
        </View>

        {/* Urgency selector */}
        <Text style={styles.sectionLabel}>Urgency Level</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.urgencyCard, urgency === opt.key && styles.urgencyCardActive]}
              onPress={() => setUrgency(opt.key)}
            >
              <Ionicons
                name={opt.icon}
                size={20}
                color={urgency === opt.key ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text style={[styles.urgencyLabel, urgency === opt.key && styles.urgencyLabelActive]}>
                {opt.label}
              </Text>
              <Text style={[styles.urgencySub, urgency === opt.key && styles.urgencySubActive]}>
                {opt.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Reason selector */}
        <Text style={styles.sectionLabel}>Reason for Request</Text>
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        <View style={styles.card}>
          {REASONS.map((reason, index) => (
            <Pressable
              key={reason}
<<<<<<< HEAD
              style={[
                styles.reasonRow,
                index < REASONS.length - 1 && styles.reasonRowBorder,
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={[styles.radioOuter, selectedReason === reason && styles.radioOuterActive]}>
                {selectedReason === reason && <View style={styles.radioInner} />}
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
              </View>
              <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                {reason}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
<<<<<<< HEAD
        <Text style={styles.sectionLabel}>Describe the Situation</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Describe what's happening with your tank..."
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
=======
        <Text style={styles.sectionLabel}>Describe the situation</Text>
        <TextInput
          style={[styles.notesInput, notesFocused && styles.notesInputFocused]}
          placeholder="Describe what's happening with your tank..."
          placeholderTextColor={REST_COLORS.muted}
          value={notes}
          onChangeText={setNotes}
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          multiline
          numberOfLines={4}
        />

        {/* Submit */}
        {submitted ? (
          <View style={styles.successBanner}>
<<<<<<< HEAD
            <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
            <Text style={styles.successText}>Request submitted! A driver will be assigned shortly.</Text>
          </View>
        ) : (
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="send-outline" size={17} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </Pressable>
        )}

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          <Text style={styles.cancelButtonText}>Cancel</Text>
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

  warningCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: COLORS.alertBg, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.alertBorder,
    padding: 14, marginBottom: 20, alignItems: 'flex-start',
  },
  warningText: { flex: 1 },
  warningTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.alertText, marginBottom: 4 },
  warningSub: { fontFamily: FONTS.bodyRegular, fontSize: 12, color: '#92400E', lineHeight: 18 },

  sectionLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 11,
    color: COLORS.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.7, marginBottom: 8,
  },

  tankStatusCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  tankStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tankStatusLabel: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textSecondary },
  tankStatusValue: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.textPrimary },
  progressTrack: {
    height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 4 },
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  urgencyCard: {
    flex: 1, alignItems: 'center', gap: 4,
<<<<<<< HEAD
    backgroundColor: COLORS.card, borderRadius: 12,
    padding: 14, borderWidth: 1.5, borderColor: COLORS.border,
  },
  urgencyCardActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  urgencyLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.textPrimary },
  urgencyLabelActive: { color: '#FFFFFF' },
  urgencySub: { fontFamily: FONTS.bodyRegular, fontSize: 11, color: COLORS.textMuted },
  urgencySubActive: { color: 'rgba(255,255,255,0.75)' },

  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    marginBottom: 18, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14,
  },
<<<<<<< HEAD
  reasonRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: COLORS.green },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green },
  reasonText: { fontFamily: FONTS.bodyRegular, fontSize: 14, color: COLORS.textSecondary },
  reasonTextActive: { fontFamily: FONTS.bodySemiBold, color: COLORS.textPrimary },

  notesInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontFamily: FONTS.bodyRegular,
    fontSize: 14, color: COLORS.textPrimary,
    textAlignVertical: 'top', minHeight: 100, marginBottom: 20,
  },

  submitButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8,
    backgroundColor: COLORS.greenDark,
    paddingVertical: 15, borderRadius: 13, marginBottom: 10,
  },
  submitButtonText: {
    fontFamily: FONTS.bold, color: '#FFFFFF',
    fontSize: 14, letterSpacing: 0.4, textTransform: 'uppercase',
  },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.textMuted },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.greenLight, borderRadius: 13,
    padding: 16, marginBottom: 10,
  },
  successText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.green, flex: 1 },
});
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
