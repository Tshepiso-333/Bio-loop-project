import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS } from '../../constants/theme';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;
const DEFAULT_TANK_NAME = 'Main Storage Tank';
const DEFAULT_THRESHOLD = '80';

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshOnboarding } = useAuth();

  const [step, setStep] = useState(1);

  // Step 1 — business details
  const [businessName, setBusinessName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');

  // Step 2 — tank setup
  const [tankName, setTankName] = useState(DEFAULT_TANK_NAME);
  const [capacityLitres, setCapacityLitres] = useState('');
  const [thresholdPercent, setThresholdPercent] = useState(DEFAULT_THRESHOLD);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Validation per step ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (
      !businessName.trim() ||
      !contactPersonName.trim() ||
      !contactPhone.trim() ||
      !physicalAddress.trim() ||
      !operatingHours.trim()
    ) {
      setError('Please fill in all business details.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const capacity = Number(capacityLitres);
    if (!capacityLitres.trim() || Number.isNaN(capacity) || capacity <= 0) {
      setError('Enter a valid tank capacity in litres.');
      return false;
    }
    const threshold = Number(thresholdPercent);
    if (Number.isNaN(threshold) || threshold <= 0 || threshold > 100) {
      setError('Collection threshold must be between 1 and 100%.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      // 1. Create the restaurant row.
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          owner_user_id: user.id,
          business_name: businessName.trim(),
          contact_person_name: contactPersonName.trim(),
          contact_phone: contactPhone.trim(),
          physical_address: physicalAddress.trim(),
          operating_hours: operatingHours.trim(),
          collection_notes: collectionNotes.trim() || null,
          latitude: null,
          longitude: null,
          onboarding_completed: true,
        })
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // 2. Create the tank linked to that restaurant.
      const { error: tankError } = await supabase.from('tanks').insert({
        restaurant_id: restaurant.id,
        tank_name: tankName.trim() || DEFAULT_TANK_NAME,
        capacity_litres: Number(capacityLitres),
        collection_threshold_percent: Number(thresholdPercent),
      });

      if (tankError) throw tankError;

      // 3. Refresh auth state so navigation swaps to the dashboard tabs.
      await refreshOnboarding();
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="leaf-outline" size={18} color={COLORS.green} />
          </View>
          <Text style={styles.brandName}>BioLoop</Text>
        </View>
        <Text style={styles.stepCounter}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      <ProgressBar step={step} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <StepBusiness
            businessName={businessName} setBusinessName={setBusinessName}
            contactPersonName={contactPersonName} setContactPersonName={setContactPersonName}
            contactPhone={contactPhone} setContactPhone={setContactPhone}
            physicalAddress={physicalAddress} setPhysicalAddress={setPhysicalAddress}
            operatingHours={operatingHours} setOperatingHours={setOperatingHours}
            collectionNotes={collectionNotes} setCollectionNotes={setCollectionNotes}
            disabled={submitting}
          />
        )}

        {step === 2 && (
          <StepTank
            tankName={tankName} setTankName={setTankName}
            capacityLitres={capacityLitres} setCapacityLitres={setCapacityLitres}
            thresholdPercent={thresholdPercent} setThresholdPercent={setThresholdPercent}
            disabled={submitting}
          />
        )}

        {step === 3 && (
          <StepConfirm
            summary={{
              businessName, contactPersonName, contactPhone, physicalAddress,
              operatingHours, collectionNotes, tankName, capacityLitres, thresholdPercent,
            }}
          />
        )}

        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
      </ScrollView>

      {/* ── Footer nav ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step > 1 && (
          <Pressable
            style={[styles.secondaryButton, submitting && styles.disabled]}
            onPress={goBack}
            disabled={submitting}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.textPrimary} />
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        )}

        {step < TOTAL_STEPS ? (
          <Pressable style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryButton, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Start Monitoring</Text>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── STEP 1: BUSINESS ─────────────────────────────────────────────────────────────

function StepBusiness(props) {
  return (
    <View>
      <StepHeader
        title="Business details"
        subtitle="Tell us about your restaurant so collectors can find you."
      />
      <View style={styles.card}>
        <Field
          label="Business name"
          placeholder="e.g. Mama's Kitchen"
          value={props.businessName}
          onChangeText={props.setBusinessName}
          disabled={props.disabled}
        />
        <Field
          label="Contact person"
          placeholder="Full name"
          value={props.contactPersonName}
          onChangeText={props.setContactPersonName}
          disabled={props.disabled}
        />
        <Field
          label="Contact phone"
          placeholder="e.g. 071 234 5678"
          value={props.contactPhone}
          onChangeText={props.setContactPhone}
          keyboardType="phone-pad"
          disabled={props.disabled}
        />
        <Field
          label="Physical address"
          placeholder="Street, suburb, city"
          value={props.physicalAddress}
          onChangeText={props.setPhysicalAddress}
          multiline
          disabled={props.disabled}
        />
        <Field
          label="Operating hours"
          placeholder="e.g. Mon–Sat, 08:00–22:00"
          value={props.operatingHours}
          onChangeText={props.setOperatingHours}
          disabled={props.disabled}
        />
        <Field
          label="Collection notes (optional)"
          placeholder="Access notes, gate code, where the tank is located…"
          value={props.collectionNotes}
          onChangeText={props.setCollectionNotes}
          multiline
          optional
          disabled={props.disabled}
        />
      </View>
    </View>
  );
}

// ─── STEP 2: TANK ─────────────────────────────────────────────────────────────────

function StepTank(props) {
  return (
    <View>
      <StepHeader
        title="Tank setup"
        subtitle="Set up the storage tank we'll monitor for you."
      />
      <View style={styles.card}>
        <Field
          label="Tank name"
          placeholder={DEFAULT_TANK_NAME}
          value={props.tankName}
          onChangeText={props.setTankName}
          disabled={props.disabled}
        />
        <Field
          label="Capacity (litres)"
          placeholder="e.g. 200"
          value={props.capacityLitres}
          onChangeText={props.setCapacityLitres}
          keyboardType="numeric"
          disabled={props.disabled}
        />
        <Field
          label="Collection threshold (%)"
          placeholder="80"
          value={props.thresholdPercent}
          onChangeText={props.setThresholdPercent}
          keyboardType="numeric"
          disabled={props.disabled}
        />
        <Text style={styles.helperText}>
          We'll automatically request a collection when your tank reaches this fill level.
        </Text>
      </View>
    </View>
  );
}

// ─── STEP 3: CONFIRM ───────────────────────────────────────────────────────────────

function StepConfirm({ summary }) {
  return (
    <View>
      <StepHeader
        title="Confirm your details"
        subtitle="Review everything before we start monitoring."
      />

      <View style={styles.card}>
        <Text style={styles.summarySectionTitle}>BUSINESS</Text>
        <SummaryRow label="Business name" value={summary.businessName} />
        <SummaryRow label="Contact person" value={summary.contactPersonName} />
        <SummaryRow label="Contact phone" value={summary.contactPhone} />
        <SummaryRow label="Physical address" value={summary.physicalAddress} />
        <SummaryRow label="Operating hours" value={summary.operatingHours} />
        {summary.collectionNotes ? (
          <SummaryRow label="Collection notes" value={summary.collectionNotes} />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.summarySectionTitle}>TANK</Text>
        <SummaryRow label="Tank name" value={summary.tankName || DEFAULT_TANK_NAME} />
        <SummaryRow label="Capacity" value={`${summary.capacityLitres} Litres`} />
        <SummaryRow label="Collection threshold" value={`${summary.thresholdPercent}%`} />
      </View>
    </View>
  );
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
    </View>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );
}

function Field({ label, optional, disabled, multiline, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor={COLORS.textMuted}
        editable={!disabled}
        multiline={multiline}
        autoCorrect={false}
        {...inputProps}
      />
    </View>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center',
  },
  brandName: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.textPrimary },
  stepCounter: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.textSecondary },

  progressTrack: {
    height: 6, backgroundColor: COLORS.border,
    marginHorizontal: 20, borderRadius: 6, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 6 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  stepHeader: { marginBottom: 14, paddingHorizontal: 4 },
  stepTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.textPrimary, marginBottom: 4 },
  stepSubtitle: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },

  field: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.textSecondary,
    marginBottom: 6, letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: COLORS.inputBg,
    fontFamily: FONTS.bodyRegular, fontSize: 14, color: COLORS.textPrimary,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  helperText: {
    fontFamily: FONTS.bodyRegular, fontSize: 12, color: COLORS.textMuted,
    lineHeight: 17, marginTop: 2,
  },

  summarySectionTitle: {
    fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.textMuted,
    letterSpacing: 0.8, marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, gap: 16,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  summaryLabel: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  summaryValue: {
    fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textPrimary,
    flex: 1.4, textAlign: 'right',
  },

  errorMessage: {
    fontFamily: FONTS.bodyMedium, fontSize: 13, color: '#DC2626',
    paddingHorizontal: 4, marginTop: 4,
  },

  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  primaryButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.green, paddingVertical: 14, borderRadius: 12,
  },
  primaryButtonText: { fontFamily: FONTS.semiBold, fontSize: 15, color: '#FFFFFF' },
  secondaryButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  secondaryButtonText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary },
  disabled: { opacity: 0.6 },
});
