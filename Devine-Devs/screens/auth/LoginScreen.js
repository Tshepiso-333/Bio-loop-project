import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../AuthContext';

//import { validateCredentials } from '../../auth/hardcodedUsers';

const HARDCODED_USERS = [
  {
    email: 'thobile23@gmail.com',
    password: 'thobile23',
    role: 'driver',
  },
  {
    email: 'kgopotsobeverly2@gmail.com',
    password: 'KB12345',
    role: 'manufacturer',
  },
  {
    email: 'tshepisomolefe1605@gmail.com',
    password: 'Tshepiso333',
    role: 'restaurant',
  },
  {
    email: 'admin@gmail.com',
    password: 'admin',
    role: 'admin',
  },
];

// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  heroBg:           '#111111',
  heroCard:         '#1C1C1C',
  heroText:         '#FFFFFF',
  heroSubtext:      'rgba(255,255,255,0.55)',
  formBg:           '#FFFFFF',
  green:            '#4ADE00',
  greenDark:        '#2DA800',
  greenLight:       '#EDFFD4',
  textPrimary:      '#0F172A',
  textSecondary:    '#64748B',
  textMuted:        '#94A3B8',
  inputBorder:      '#E2E8F0',
  inputBorderFocus: '#4ADE00',
  inputBg:          '#F8FAFC',
  border:           '#E2E8F0',
  errorBg:          '#FFF1F1',
  errorBorder:      '#FECACA',
  errorText:        '#DC2626',
};

// ─── FONTS ────────────────────────────────────────────────────────────────────

const FONTS = {
  bold:        'Poppins_700Bold',
  semiBold:    'Poppins_600SemiBold',
  regular:     'Poppins_400Regular',
  bodyRegular: 'Inter_400Regular',
  bodyMedium:  'Inter_500Medium',
  bodySemiBold:'Inter_600SemiBold',
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }) {
  // ── All original state and logic unchanged ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  // ── New UI-only state (no effect on auth) ──
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

  const insets = useSafeAreaInsets();

  // ── Original handler — untouched ──
const handleLogin = async () => {
  if (!email || !password) {
    setError('Please enter both email and password.');
    return;
  }

  setError('');
  setIsSubmitting(true);

  const matchedUser = HARDCODED_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.trim().toLowerCase() &&
      user.password === password
  );

  if (!matchedUser) {
    setError('Invalid login details.');
    setIsSubmitting(false);
    return;
  }

  login({ email: matchedUser.email, role: matchedUser.role });
  setIsSubmitting(false);
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroBg} />

      {/* ── Hero section ── */}
      <View style={[styles.heroSection, { paddingTop: insets.top + 28 }]}>

        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="sync-outline" size={18} color={COLORS.green} />
          </View>
          <Text style={styles.logoText}>BioLoop</Text>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>{'Smart\nOil Collection'}</Text>
        <Text style={styles.subtext}>
          Intelligent waste oil logistics connecting restaurants, collectors,
          and biodiesel manufacturers in one unified system.
        </Text>

        {/* Feature pills */}
        <View style={styles.pillRow}>
          <FeaturePill icon="analytics-outline"  label="AI Monitoring" />
          <FeaturePill icon="car-outline"         label="Smart Routing" />
          <FeaturePill icon="cash-outline"        label="Auto Earnings" />
        </View>
      </View>

      {/* ── Form section ── */}
      <View style={styles.formSection}>

        {/* Form header */}
        <View style={styles.formHeaderRow}>
          <View>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Access your BioLoop dashboard</Text>
          </View>
          <View style={styles.formHeaderIcon}>
            <Ionicons name="leaf-outline" size={22} color={COLORS.green} />
          </View>
        </View>

        {/* Email */}
        <Text style={styles.fieldLabel}>Email Address</Text>
        <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
          <Ionicons
            name="mail-outline"
            size={17}
            color={emailFocused ? COLORS.green : COLORS.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="you@bioloop.app"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
          />
        </View>

        {/* Password */}
        <View style={styles.passwordLabelRow}>
          <Text style={styles.fieldLabel}>Password</Text>
          {/* Original navigation call — untouched */}
          <Pressable
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Ionicons name="lock-open-outline" size={12} color={COLORS.green} />
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </Pressable>
        </View>
        <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
          <Ionicons
            name="lock-closed-outline"
            size={17}
            color={passwordFocused ? COLORS.green : COLORS.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Pressable
            onPress={() => setShowPassword((p) => !p)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textMuted}
            />
          </Pressable>
        </View>

        {/* Error message — original logic, restyled */}
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={15} color={COLORS.errorText} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Sign in button — original onPress untouched */}
      <Pressable 
  style={[styles.signInButton, isSubmitting && { opacity: 0.7 }]} 
  onPress={handleLogin}
  disabled={isSubmitting} // Prevent double-tapping
>
  <Ionicons 
    name={isSubmitting ? "hourglass-outline" : "log-in-outline"} 
    size={18} 
    color="#FFFFFF" 
  />
  <Text style={styles.signInButtonText}>
    {isSubmitting ? 'Signing in...' : 'Sign In'}
  </Text>
</Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register link — original navigation.navigate untouched */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <Pressable
            style={styles.registerLinkRow}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.registerLink}>Create an account</Text>
            <Ionicons name="arrow-forward" size={13} color={COLORS.green} />
          </Pressable>
        </View>

        <View style={{ height: insets.bottom + 8 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── SMALL HELPER COMPONENT ───────────────────────────────────────────────────

function FeaturePill({ icon, label }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.8)" />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.heroBg,
  },

  // Hero
  heroSection: {
    backgroundColor: COLORS.heroBg,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 28,
  },
  logoIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.heroCard,
    borderWidth: 1,
    borderColor: 'rgba(74,222,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: {
    fontFamily: FONTS.bold, fontSize: 16, color: COLORS.heroText,
    letterSpacing: 0.5,
  },
  headline: {
    fontFamily: FONTS.bold, fontSize: 38,
    color: COLORS.heroText, lineHeight: 44, marginBottom: 12,
  },
  subtext: {
    fontFamily: FONTS.bodyRegular, fontSize: 13,
    color: COLORS.heroSubtext, lineHeight: 20, marginBottom: 18,
  },
  pillRow: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(74,222,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,0,0.2)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  pillText: {
    fontFamily: FONTS.bodyMedium, fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },

  // Form
  formSection: {
    flex: 1,
    backgroundColor: COLORS.formBg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 28,
  },
  formHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
  },
  formTitle: {
    fontFamily: FONTS.bold, fontSize: 22,
    color: COLORS.textPrimary, marginBottom: 3,
  },
  formSubtitle: {
    fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary,
  },
  formHeaderIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Fields
  fieldLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 11,
    color: COLORS.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.inputBorder,
    borderRadius: 12, marginBottom: 16, overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: COLORS.inputBorderFocus,
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 13,
    fontFamily: FONTS.bodyRegular, fontSize: 14, color: COLORS.textPrimary,
  },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 13 },

  passwordLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  forgotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8,
  },
  forgotLink: {
    fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.green,
  },

  // Error
  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.errorBg,
    borderWidth: 1, borderColor: COLORS.errorBorder,
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium, fontSize: 13,
    color: COLORS.errorText, flex: 1,
  },

  // Button
  signInButton: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8,
    backgroundColor: COLORS.greenDark,
    paddingVertical: 15, borderRadius: 13, marginBottom: 20,
  },
  signInButtonText: {
    fontFamily: FONTS.bold, color: '#FFFFFF',
    fontSize: 14, letterSpacing: 0.4, textTransform: 'uppercase',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textMuted,
  },

  // Register
  registerRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', flexWrap: 'wrap',
  },
  registerText: {
    fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary,
  },
  registerLinkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  registerLink: {
    fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.green,
  },
});
