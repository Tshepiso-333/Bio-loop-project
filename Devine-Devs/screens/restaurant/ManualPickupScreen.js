import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, StatusBar, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// ─── THEME COLOURS (matching manufacturer, keeping emergency orange) ─────────

const COLORS = {
  background: '#F4F4EF', 
  card: '#FFFFFF',
  green: '#10b981',
  greenLight: '#D1FAE5', 
  greenDark: '#059669',
  // Urgent colour - shows urgency
  urgent: '#EA580C',
  urgentLight: '#FFF7ED',
  // Emergency colours
  alertBg: '#FFF7ED', 
  alertBorder: '#FED7AA', 
  alertText: '#C2410C',
  textPrimary: '#0F172A', 
  textSecondary: '#64748B', 
  textMuted: '#94A3B8',
  border: '#E2E8F0', 
  inputBg: '#F8FAFC',
};

const FONTS = {
  bold: 'Poppins_700Bold', 
  semiBold: 'Poppins_600SemiBold',
  bodyMedium: 'Inter_500Medium', 
  bodySemiBold: 'Inter_600SemiBold',
  bodyRegular: 'Inter_400Regular',
};

const URGENCY_OPTIONS = [
  { key: 'standard', label: 'Standard', subtitle: 'Within 24 hrs', icon: 'time-outline', color: COLORS.green },
  { key: 'urgent',   label: 'Urgent',   subtitle: 'Within 4 hrs',  icon: 'flash-outline', color: COLORS.urgent },
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

  // Get the color for the selected urgency
  const getUrgencyColor = () => {
    return urgency === 'urgent' ? COLORS.urgent : COLORS.green;
  };

  // Header Component with Gradient
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />
      <LinearGradient
        colors={[COLORS.green, COLORS.greenDark, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Manual Pickup</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.root}>
      <Header />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Warning banner - emergency colours kept */}
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
            <Text style={styles.tankStatusValue}>104°F</Text>
          </View>
        </View>

        {/* Urgency selector */}
        <Text style={styles.sectionLabel}>Urgency Level</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map((opt) => {
            const isActive = urgency === opt.key;
            const activeColor = opt.color;
            return (
              <Pressable
                key={opt.key}
                style={[
                  styles.urgencyCard,
                  isActive && { backgroundColor: activeColor, borderColor: activeColor }
                ]}
                onPress={() => setUrgency(opt.key)}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={isActive ? '#FFFFFF' : COLORS.textSecondary}
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
            <LinearGradient
              colors={[getUrgencyColor(), getUrgencyColor() === COLORS.urgent ? '#9A3412' : COLORS.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Ionicons name="send-outline" size={17} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {urgency === 'urgent' ? 'Submit Urgent Request' : 'Submit Request'}
              </Text>
            </LinearGradient>
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
  
  // Header Styles
  header: {
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  
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
  radioInner: { width: 10, height: 10, borderRadius: 5 },
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
    borderRadius: 13,
    marginBottom: 10,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
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