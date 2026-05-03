import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../AuthContext';

// ─── STATIC CONTENT ───────────────────────────────────────────────────────────

const HERO = {
  appName: 'KitchenSteward',
  headline: 'Sustainable\nOil Logistics',
  subtext:
    'Professional waste management for high-velocity industrial kitchens. Monitor your tank, schedule pickups, and track earnings with precision.',
};

const TESTIMONIAL = {
  quote:
    '"This tool turned our waste into a revenue stream while keeping our floors spotless."',
  author: '— Executive Chef, Central Plaza',
  avatarInitials: 'CP',
};

// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  heroBg: '#0F2D1A',
  heroCard: '#1A3D28',
  heroText: '#FFFFFF',
  heroSubtext: 'rgba(255,255,255,0.65)',
  formBg: '#FFFFFF',
  green: '#16A34A',
  greenDark: '#14532D',
  greenLight: '#DCFCE7',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  inputBorder: '#E2E8F0',
  inputBorderFocus: '#16A34A',
  inputBg: '#F8FAFC',
  checkboxBorder: '#CBD5E1',
  border: '#E2E8F0',
};

// ─── FONTS ────────────────────────────────────────────────────────────────────

const FONTS = {
  bold: 'Poppins_700Bold',
  semiBold: 'Poppins_600SemiBold',
  medium: 'Poppins_500Medium',
  regular: 'Poppins_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyRegular: 'Inter_400Regular',
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ── Dev login ─────────────────────────────────────────────────────────────
  // Type a role name (restaurant / driver / admin / manufacturer) into the
  // email field and tap Sign In. Replace this body with a real API call when
  // the backend is ready — only keep the login() call at the end.
  const handleSignIn = () => {
    if (!email.trim()) return;
    login(email.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Dark green hero section ── */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 28 }]}>

          {/* Logo row */}
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <Ionicons name="restaurant-outline" size={18} color={COLORS.green} />
            </View>
            <Text style={styles.logoText}>{HERO.appName}</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>{HERO.headline}</Text>

          {/* Subtext */}
          <Text style={styles.subtext}>{HERO.subtext}</Text>

          {/* Feature pills */}
          <View style={styles.pillRow}>
            <FeaturePill icon="analytics-outline"   label="AI Monitoring" />
            <FeaturePill icon="car-outline"          label="Smart Routing" />
            <FeaturePill icon="cash-outline"         label="Auto Earnings" />
          </View>

          {/* Testimonial card */}
          <View style={styles.testimonialCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.quoteIcon} />
            <View style={styles.testimonialInner}>
              <View style={styles.testimonialAvatar}>
                <Text style={styles.testimonialAvatarText}>{TESTIMONIAL.avatarInitials}</Text>
              </View>
              <View style={styles.testimonialTextBlock}>
                <Text style={styles.testimonialQuote}>{TESTIMONIAL.quote}</Text>
                <Text style={styles.testimonialAuthor}>{TESTIMONIAL.author}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── White form section ── */}
        <View style={styles.formSection}>

          {/* Form header */}
          <View style={styles.formHeaderRow}>
            <View>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Access your operational dashboard</Text>
            </View>
            <View style={styles.formHeaderIcon}>
              <Ionicons name="leaf-outline" size={22} color={COLORS.green} />
            </View>
          </View>

          {/* Email field */}
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
            <Ionicons name="mail-outline" size={17} color={emailFocused ? COLORS.green : COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="chef@restaurant.com"
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

          {/* Password field */}
          <View style={styles.passwordLabelRow}>
            <Text style={styles.fieldLabel}>Password</Text>
            <Pressable style={styles.forgotRow}>
              <Ionicons name="lock-open-outline" size={12} color={COLORS.green} />
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </Pressable>
          </View>
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <Ionicons name="lock-closed-outline" size={17} color={passwordFocused ? COLORS.green : COLORS.textMuted} style={styles.inputIcon} />
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
              onSubmitEditing={handleSignIn}
            />
            {/* Show / hide password toggle */}
            <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textMuted}
              />
            </Pressable>
          </View>

          {/* Remember this device */}
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setRememberDevice((prev) => !prev)}
          >
            <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
              {rememberDevice && (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Remember this device</Text>
          </Pressable>

          {/* Sign in button */}
          <Pressable style={styles.signInButton} onPress={handleSignIn}>
            <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
            <Text style={styles.signInButtonText}>Sign In to Dashboard</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Pressable style={styles.registerLinkRow}>
              <Text style={styles.registerLink}>Register your kitchen</Text>
              <Ionicons name="arrow-forward" size={13} color={COLORS.green} />
            </Pressable>
          </View>

          {/* Bottom safe area padding */}
          <View style={{ height: insets.bottom + 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

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
  root: { flex: 1, backgroundColor: COLORS.heroBg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ── Hero section
  heroSection: {
    backgroundColor: COLORS.heroBg,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 32,
  },
  logoIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.heroCard,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.heroText },

  headline: {
    fontFamily: FONTS.bold, fontSize: 40,
    color: COLORS.heroText, lineHeight: 46, marginBottom: 14,
  },
  subtext: {
    fontFamily: FONTS.bodyRegular, fontSize: 14,
    color: COLORS.heroSubtext, lineHeight: 22, marginBottom: 20,
  },

  // Feature pills
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  pillText: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  // Testimonial
  testimonialCard: {
    backgroundColor: COLORS.heroCard, borderRadius: 14, padding: 16,
  },
  quoteIcon: { marginBottom: 8 },
  testimonialInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  testimonialAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.green,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  testimonialAvatarText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' },
  testimonialTextBlock: { flex: 1 },
  testimonialQuote: {
    fontFamily: FONTS.regular, fontSize: 13,
    color: COLORS.heroText, lineHeight: 19,
    fontStyle: 'italic', marginBottom: 6,
  },
  testimonialAuthor: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: COLORS.heroSubtext },

  // ── Form section
  formSection: {
    backgroundColor: COLORS.formBg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 32, flex: 1,
  },
  formHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 28,
  },
  formTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.textPrimary, marginBottom: 4 },
  formSubtitle: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary },
  formHeaderIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Input fields
  fieldLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: 11,
    color: COLORS.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.inputBorder,
    borderRadius: 12, marginBottom: 18, overflow: 'hidden',
  },
  inputWrapFocused: { borderColor: COLORS.inputBorderFocus },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 13,
    fontFamily: FONTS.bodyRegular, fontSize: 14, color: COLORS.textPrimary,
  },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 13 },

  passwordLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  forgotLink: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.green },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 26,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: COLORS.checkboxBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkboxLabel: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary },

  // Sign in button
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
  dividerText: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textMuted },

  // Register
  registerRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', flexWrap: 'wrap',
  },
  registerText: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary },
  registerLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  registerLink: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.green },
});