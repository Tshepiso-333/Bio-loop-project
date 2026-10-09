// Last step of "forgot password": the recovery code has been verified, so
// Supabase has already signed this person in with a recovery session. That
// session is what authorises updateUser({ password }) — which is why this
// screen is only reachable straight after VerifyCodeScreen.
//
// Visual language follows ForgotPasswordScreen / VerifyCodeScreen (gradient
// hero + white form sheet) so the three screens read as one journey.
import React, { useState } from 'react';
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
import { updatePassword } from '../../src/services/authService';

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

const MIN_LENGTH = 8;

export default function ResetPasswordScreen({ route }) {
  const insets = useSafeAreaInsets();
  const email = route?.params?.email;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const longEnough = password.length >= MIN_LENGTH;
  const matches = password.length > 0 && password === confirm;

  const handleSave = async () => {
    if (!longEnough) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (!matches) {
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

  const renderField = (key, label, value, onChange, placeholder) => (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, focusedField === key && styles.inputWrapFocused]}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.green}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
        />
        <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.eyeButton}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textMuted}
          />
        </Pressable>
      </View>
    </>
  );

  const renderRule = (met, text) => (
    <View style={styles.ruleRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={met ? COLORS.green : COLORS.textMuted}
      />
      <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{text}</Text>
    </View>
  );

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
              <Ionicons name="key-outline" size={28} color="#FFFFFF" />
            </View>

            <Text style={styles.headline}>Set a new password</Text>
            <Text style={styles.subtext}>
              {email ? (
                <>
                  For <Text style={styles.subtextStrong}>{email}</Text>.{'\n'}
                </>
              ) : null}
              You will be signed in as soon as it is saved.
            </Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>
            {renderField(
              'password',
              'New password',
              password,
              setPassword,
              `At least ${MIN_LENGTH} characters`
            )}
            {renderField('confirm', 'Confirm password', confirm, setConfirm, 'Type it again')}

            <View style={styles.rules}>
              {renderRule(longEnough, `At least ${MIN_LENGTH} characters`)}
              {renderRule(matches, 'Both passwords match')}
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.errorText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable style={styles.primaryButton} onPress={handleSave} disabled={busy}>
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
                    <Text style={styles.primaryButtonText}>Save password</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.footNote}>
              Anyone signed in on another device stays signed in.
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
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rules: {
    gap: 8,
    marginBottom: 20,
    marginTop: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  ruleTextMet: {
    color: COLORS.textSecondary,
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
  footNote: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
});
