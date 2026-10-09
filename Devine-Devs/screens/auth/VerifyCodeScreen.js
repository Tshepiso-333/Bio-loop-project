// One code-entry screen serving both passwordless flows.
//
// route.params:
//   email    - where the code was sent
//   purpose  - 'signin' (sign in / sign up) or 'recovery' (forgot password)
//   profile  - { name, surname, role } for a sign-up resend; ignored otherwise
//
// On success:
//   signin   -> nothing to navigate to; the auth listener swaps the stack
//   recovery -> push ResetPassword, where the new password is set
//
// Visual language follows ForgotPasswordScreen (gradient hero + white form
// sheet), since this screen sits in the middle of that same journey. COLORS
// and FONTS are declared locally there too — kept the same way here on
// purpose so the two files read alike.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../AuthContext';
import {
  sendPasswordResetCode,
  sendSignInCode,
  verifyEmailCode,
  verifyRecoveryCode,
} from '../../src/services/authService';

const COLORS = {
  formBg:           '#FFFFFF',
  green:            '#15643E',
  greenDark:        '#0F4D30',
  greenLight:       '#E7F1EB',
  textPrimary:      '#122A1F',
  textSecondary:    '#6B7F75',
  textMuted:        '#A9B5AD',
  inputBorder:      '#E4EDE7',
  inputBorderFocus: '#15643E',
  inputBg:          '#F5F8F6',
  errorBg:          '#FFF1F1',
  errorBorder:      '#FECACA',
  errorText:        '#DC2626',
  successBg:        '#E7F1EB',
  successBorder:    '#9FD3B3',
};

const FONTS = {
  bold:        'Poppins_700Bold',
  semiBold:    'Poppins_600SemiBold',
  regular:     'Poppins_400Regular',
  bodyRegular: 'Inter_400Regular',
  bodyMedium:  'Inter_500Medium',
  bodySemiBold:'Inter_600SemiBold',
};

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function VerifyCodeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { beginPasswordRecovery, endPasswordRecovery } = useAuth();
  const { email, purpose = 'signin', profile = null } = route?.params ?? {};

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Verify as soon as the last digit lands — no extra tap for the common case.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !busy) handleVerify(code);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async (value) => {
    const token = (value ?? code).trim();
    if (token.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (purpose === 'recovery') {
        // Set before verifying: verifyOtp returns a session, and RootNavigator
        // would otherwise swap to the role stack before we could navigate.
        beginPasswordRecovery(email);
        await verifyRecoveryCode(email, token);
      } else {
        // The session lands here; RootNavigator swaps to the role stack.
        await verifyEmailCode(email, token);
      }
    } catch (err) {
      // A wrong code must not leave the app stuck on the reset screen.
      if (purpose === 'recovery') endPasswordRecovery();
      setError(err.message ?? 'Could not verify that code.');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (purpose === 'recovery') {
        await sendPasswordResetCode(email);
      } else {
        await sendSignInCode(email, { allowSignUp: !!profile, profile });
      }
      setSecondsLeft(RESEND_SECONDS);
      setNotice('New code sent. Check your email.');
    } catch (err) {
      setError(err.message ?? 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  };

  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.green} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section with Green Gradient */}
          <LinearGradient
            colors={['#15643E', '#0F4D30', '#0B3A24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroSection, { paddingTop: insets.top + 28 }]}
          >
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={busy}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

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

            <View style={styles.heroIconWrap}>
              <Ionicons name="mail-open-outline" size={28} color="#FFFFFF" />
            </View>

            <Text style={styles.headline}>Check your email</Text>
            <Text style={styles.subtext}>
              We sent a {CODE_LENGTH}-digit code to{'\n'}
              <Text style={styles.subtextStrong}>{email}</Text>
            </Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Verification code</Text>

            {/* One hidden input drives six visible boxes — keeps paste working */}
            <Pressable style={styles.boxRow} onPress={() => inputRef.current?.focus()}>
              {digits.map((digit, index) => (
                <View
                  key={index}
                  style={[
                    styles.box,
                    index === code.length && styles.boxActive,
                    digit !== '' && styles.boxFilled,
                  ]}
                >
                  <Text style={styles.boxText}>{digit}</Text>
                </View>
              ))}
            </Pressable>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus
              maxLength={CODE_LENGTH}
            />

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.errorText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {notice ? (
              <View style={styles.successCard}>
                <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.greenDark} />
                <Text style={styles.successCardText}>{notice}</Text>
              </View>
            ) : null}

            <Pressable
              style={styles.primaryButton}
              onPress={() => handleVerify()}
              disabled={busy}
            >
              <LinearGradient
                colors={['#15643E', '#0F4D30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.primaryGradient, busy && { opacity: 0.75 }]}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.resendButton}
              onPress={handleResend}
              disabled={secondsLeft > 0 || busy}
            >
              <Text
                style={[styles.resendButtonText, secondsLeft > 0 && { color: COLORS.textMuted }]}
              >
                {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Send me a new code'}
              </Text>
            </Pressable>

            <Text style={styles.footNote}>
              The code expires 15 minutes after it is sent.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F8F7',
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
  heroIconWrap: {
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
  subtextStrong: {
    fontFamily: FONTS.bodySemiBold,
    color: '#fff',
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
  fieldLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: COLORS.inputBorderFocus,
    borderWidth: 2,
  },
  boxFilled: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.inputBorderFocus,
  },
  boxText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
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
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successCardText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 13,
    color: COLORS.greenDark,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  primaryGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resendButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    marginBottom: 18,
  },
  resendButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  footNote: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
});
