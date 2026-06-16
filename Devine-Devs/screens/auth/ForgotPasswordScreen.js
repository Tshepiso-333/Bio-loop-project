/*import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Forgot Password</Text>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="done"
        />

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#0f172a',
    fontWeight: '600',
  },
});*/

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
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { supabase } from '../../supabase'; // 1. Import your real client

const COLORS = {
  formBg:           '#FFFFFF',
  green:            '#10b981',
  greenDark:        '#059669',
  greenLight:       '#D1FAE5',
  textPrimary:      '#0F172A',
  textSecondary:    '#64748B',
  textMuted:        '#94A3B8',
  inputBorder:      '#E2E8F0',
  inputBorderFocus: '#10b981',
  inputBg:          '#F8FAFC',
  border:           '#E2E8F0',
  errorBg:          '#FFF1F1',
  errorBorder:      '#FECACA',
  errorText:        '#DC2626',
  successBg:        '#ECFDF5',
  successBorder:    '#A7F3D0',
};

const FONTS = {
  bold:        'Poppins_700Bold',
  semiBold:    'Poppins_600SemiBold',
  regular:     'Poppins_400Regular',
  bodyRegular: 'Inter_400Regular',
  bodyMedium:  'Inter_500Medium',
  bodySemiBold:'Inter_600SemiBold',
};

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const insets = useSafeAreaInsets();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setLoading(true);

    /*
    // 2. Call real Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: 'bioloop://reset-password', // your deep link / app scheme
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
    */

    setLoading(false);
    Alert.alert('Design mode', 'Password reset email is disabled while Supabase is switched off.');
    setSent(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="light-content" backgroundColor="#10b981" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section with Green Gradient */}
          <LinearGradient
            colors={['#10b981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroSection, { paddingTop: insets.top + 28 }]}
          >
            {/* Back button */}
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../assets/BioLoop_Logo.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.logoText}>BioLoop</Text>
            </View>

            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-open-outline" size={28} color="#FFFFFF" />
            </View>

            <Text style={styles.headline}>Forgot your password?</Text>
            <Text style={styles.subtext}>
              No worries. Enter the email linked to your account and
              we'll send you a link to reset it.
            </Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>
            {!sent ? (
              <>
                <View style={styles.formHeaderRow}>
                  <View style={styles.formHeaderCentered}>
                    <Text style={styles.formTitle}>Reset Password</Text>
                    <Text style={styles.formSubtitle}>
                      We'll email you a secure reset link
                    </Text>
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
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                    editable={!loading}
                  />
                </View>

                {/* Error message */}
                {error ? (
                  <View style={styles.errorCard}>
                    <Ionicons name="alert-circle-outline" size={15} color={COLORS.errorText} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Send reset link button */}
                <Pressable
                  style={[styles.signInButton, loading && { opacity: 0.7 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.signInGradient}
                  >
                    <Ionicons
                      name={loading ? 'hourglass-outline' : 'paper-plane-outline'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.signInButtonText}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                {/* Success state */}
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark-circle" size={56} color={COLORS.green} />
                </View>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.successSubtitle}>
                  We've sent a password reset link to{'\n'}
                  <Text style={styles.successEmail}>{email}</Text>
                </Text>

                <View style={styles.successCard}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.greenDark} />
                  <Text style={styles.successCardText}>
                    Didn't get an email? Check your spam folder or try again with a different address.
                  </Text>
                </View>

                <Pressable
                  style={styles.resendButton}
                  onPress={() => setSent(false)}
                >
                  <Text style={styles.resendButtonText}>Try a different email</Text>
                </Pressable>
              </>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Back to sign in */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Remembered your password? </Text>
              <Pressable
                style={styles.registerLinkRow}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.registerLink}>Sign in</Text>
                <Ionicons name="arrow-forward" size={13} color={COLORS.green} />
              </Pressable>
            </View>

            <View style={{ height: insets.bottom + 20 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  logoText: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: '#fff',
    letterSpacing: 1,
  },
  lockIconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: '#fff',
    lineHeight: 34,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    backgroundColor: COLORS.formBg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 28,
    marginTop: -10,
  },
  formHeaderRow: {
    alignItems: 'center',
    marginBottom: 28,
  },
  formHeaderCentered: {
    alignItems: 'center',
  },
  formTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fieldLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: COLORS.inputBorderFocus,
    borderWidth: 2,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontFamily: FONTS.bodyRegular,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.errorText,
    flex: 1,
  },
  signInButton: {
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  signInGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  signInButtonText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  successIconWrap: {
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  successTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  successEmail: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textPrimary,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  successCardText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 13,
    color: COLORS.greenDark,
    flex: 1,
    lineHeight: 19,
  },
  resendButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    marginBottom: 20,
  },
  resendButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  registerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registerLink: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.green,
  },
});
