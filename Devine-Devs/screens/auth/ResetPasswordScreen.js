// Last step of "forgot password": the recovery code has been verified, so
// Supabase has already signed this person in with a recovery session. That
// session is what authorises updateUser({ password }) — which is why this
// screen is only reachable straight after VerifyCodeScreen.
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_FONTS, AUTH_BUTTON_SHADOW } from '../../src/auth/authTheme';
import { updatePassword } from '../../src/services/authService';

const MIN_LENGTH = 8;

export default function ResetPasswordScreen({ route }) {
  const insets = useSafeAreaInsets();
  const email = route?.params?.email;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      // The recovery session is now a normal session, so RootNavigator
      // swaps straight to this user's role stack — nothing to navigate.
    } catch (err) {
      setError(err.message ?? 'Could not update the password.');
    } finally {
      setBusy(false);
    }
  };

  const renderField = (label, value, onChange, placeholder) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={AUTH_COLORS.primary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={AUTH_COLORS.placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow((s) => !s)} style={styles.eye}>
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={AUTH_COLORS.iconMuted}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.white} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.body, { paddingTop: insets.top + 28 }]}>
          <View style={styles.logoTile}>
            <Ionicons name="key-outline" size={28} color={AUTH_COLORS.white} />
          </View>

          <Text style={styles.title}>Set a new password</Text>
          <Text style={styles.subtitle}>
            {email ? `For ${email}. ` : ''}You will be signed in once it is saved.
          </Text>

          {renderField('New password', password, setPassword, `At least ${MIN_LENGTH} characters`)}
          {renderField('Confirm password', confirm, setConfirm, 'Type it again')}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={AUTH_COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Save password</Text>
            )}
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
  logoTile: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    ...AUTH_BUTTON_SHADOW,
  },
  title: { fontFamily: AUTH_FONTS.extraBold, fontSize: 26, color: AUTH_COLORS.ink },
  subtitle: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 14,
    color: AUTH_COLORS.body,
    marginTop: 8,
    marginBottom: 26,
    lineHeight: 21,
  },
  label: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 13,
    color: AUTH_COLORS.ink,
    marginBottom: 8,
    marginTop: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: AUTH_FONTS.medium, fontSize: 15, color: AUTH_COLORS.ink },
  eye: { padding: 6 },
  error: { fontFamily: AUTH_FONTS.medium, fontSize: 13, color: '#DC2626', marginTop: 16 },
  primaryBtn: {
    marginTop: 28,
    height: 54,
    borderRadius: 27,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...AUTH_BUTTON_SHADOW,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontFamily: AUTH_FONTS.bold, fontSize: 16, color: AUTH_COLORS.white },
});
