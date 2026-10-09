// One code-entry screen serving both passwordless flows.
//
// route.params:
//   email    - where the code was sent
//   purpose  - 'signin' (sign in / sign up) or 'recovery' (forgot password)
//   profile  - { full_name, role } for a sign-up resend; ignored otherwise
//
// On success:
//   signin   -> nothing to navigate to; the auth listener swaps the stack
//   recovery -> push ResetPassword, where the new password is set
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_FONTS, AUTH_BUTTON_SHADOW } from '../../src/auth/authTheme';
import {
  sendPasswordResetCode,
  sendSignInCode,
  verifyEmailCode,
  verifyRecoveryCode,
} from '../../src/services/authService';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function VerifyCodeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
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
        await verifyRecoveryCode(email, token);
        navigation.replace('ResetPassword', { email });
      } else {
        // The session lands here; RootNavigator swaps to the role stack.
        await verifyEmailCode(email, token);
      }
    } catch (err) {
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
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.white} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.body, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={AUTH_COLORS.ink} />
          </TouchableOpacity>

          <View style={styles.logoTile}>
            <Ionicons name="mail-open-outline" size={28} color={AUTH_COLORS.white} />
          </View>

          <Text style={styles.title}>Enter your code</Text>
          <Text style={styles.subtitle}>
            We sent a {CODE_LENGTH}-digit code to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

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

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
            onPress={() => handleVerify()}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={AUTH_COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} disabled={secondsLeft > 0 || busy}>
            <Text style={[styles.resend, secondsLeft > 0 && styles.resendMuted]}>
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Send me a new code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AUTH_COLORS.white },
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 24 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  logoTile: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 22,
    ...AUTH_BUTTON_SHADOW,
  },
  title: { fontFamily: AUTH_FONTS.extraBold, fontSize: 26, color: AUTH_COLORS.ink },
  subtitle: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 14,
    color: AUTH_COLORS.body,
    marginTop: 8,
    lineHeight: 21,
  },
  email: { fontFamily: AUTH_FONTS.bold, color: AUTH_COLORS.ink },

  boxRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: AUTH_COLORS.primary },
  boxFilled: { backgroundColor: AUTH_COLORS.selectedBg, borderColor: AUTH_COLORS.primary },
  boxText: { fontFamily: AUTH_FONTS.extraBold, fontSize: 22, color: AUTH_COLORS.ink },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },

  error: { fontFamily: AUTH_FONTS.medium, fontSize: 13, color: '#DC2626', marginTop: 16 },
  notice: { fontFamily: AUTH_FONTS.medium, fontSize: 13, color: AUTH_COLORS.primary, marginTop: 16 },

  primaryBtn: {
    marginTop: 26,
    height: 54,
    borderRadius: 27,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...AUTH_BUTTON_SHADOW,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontFamily: AUTH_FONTS.bold, fontSize: 16, color: AUTH_COLORS.white },

  resend: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 14,
    color: AUTH_COLORS.primary,
    textAlign: 'center',
    marginTop: 22,
  },
  resendMuted: { color: AUTH_COLORS.placeholder },
});
