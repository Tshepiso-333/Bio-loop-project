import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, StatusBar, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS as _C, FONTS } from '../../constants/theme';

const COLORS = {
  ..._C,
  greenDark:   _C.greenDeep,
  alertBg:     '#FFF7ED',
  alertBorder: '#FED7AA',
  alertText:   '#C2410C',
};

const URGENCY_OPTIONS = [
  { key: 'standard', label: 'Standard', subtitle: 'Within 24 hrs', icon: 'time-outline' },
  { key: 'urgent',   label: 'Urgent',   subtitle: 'Within 4 hrs',  icon: 'flash-outline' },
];

const REASONS = [
  'Tank overflow risk',
  'Emergency disposal',
  'Equipment maintenance',
  'Other',
];

export default function ManualPickupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [urgency, setUrgency] = useState('standard');
  const [selectedReason, setSelectedReason] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    // In production: POST to your API here, then navigate back
    setTimeout(() => navigation.navigate('RestaurantTabs', { screen: 'Pickups' }), 1800);
  };

  return (
    <View style={styles.root}>
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
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Emergency / Overflow Request</Text>
            <Text style={styles.warningSub}>
              Use this only for unscheduled collections. Additional fees may apply for urgent pickups.
            </Text>
          </View>
        </View>

        {/* Current tank status */}
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
            <Text style={styles.tankStatusValue}>40°C</Text>
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
        <View style={styles.card}>
          {REASONS.map((reason, index) => (
            <Pressable
              key={reason}
              style={[
                styles.reasonRow,
                index < REASONS.length - 1 && styles.reasonRowBorder,
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={[styles.radioOuter, selectedReason === reason && styles.radioOuterActive]}>
                {selectedReason === reason && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                {reason}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Describe the Situation</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Describe what's happening with your tank..."
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        {/* Submit */}
        {submitted ? (
          <View style={styles.successBanner}>
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

  urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  urgencyCard: {
    flex: 1, alignItems: 'center', gap: 4,
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
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14,
  },
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