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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

import { AUTH_COLORS, AUTH_FONTS, AUTH_BUTTON_SHADOW } from '../../src/auth/authTheme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.white} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo tile + heading */}
          <View style={styles.header}>
            <View style={styles.logoTile}>
              <Ionicons name="leaf" size={30} color={AUTH_COLORS.white} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to keep the loop going.</Text>
          </View>

          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
            <Ionicons name="mail-outline" size={20} color={AUTH_COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@bioloop.app"
              placeholderTextColor={AUTH_COLORS.placeholder}
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
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color={AUTH_COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={AUTH_COLORS.placeholder}
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
            <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={AUTH_COLORS.iconMuted}
              />
            </Pressable>
          </View>

          {/* Forgot password */}
          <Pressable
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </Pressable>

          {/* Error message */}
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={15} color={AUTH_COLORS.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Sign in button */}
          <Pressable
            style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Text>
            <Ionicons
              name={isSubmitting ? 'hourglass-outline' : 'arrow-forward'}
              size={20}
              color={AUTH_COLORS.white}
            />
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New to BioLoop? </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.registerLink}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 38,
  },
  logoTile: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...AUTH_BUTTON_SHADOW,
  },
  title: {
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 33,
    color: AUTH_COLORS.ink,
    letterSpacing: -0.7,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 15.5,
    color: AUTH_COLORS.body,
    textAlign: 'center',
  },
  label: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 11,
    color: AUTH_COLORS.body,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 9,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: AUTH_COLORS.primary,
    borderWidth: 2,
  },
  inputIcon: {
    paddingLeft: 18,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontFamily: AUTH_FONTS.medium,
    fontSize: 16,
    color: AUTH_COLORS.ink,
  },
  eyeButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: 22,
  },
  forgotLink: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 14,
    color: AUTH_COLORS.primary,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AUTH_COLORS.errorBg,
    borderWidth: 1,
    borderColor: AUTH_COLORS.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 13,
    color: AUTH_COLORS.errorText,
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    height: 60,
    borderRadius: 30,
    backgroundColor: AUTH_COLORS.primary,
    ...AUTH_BUTTON_SHADOW,
  },
  primaryButtonText: {
    fontFamily: AUTH_FONTS.bold,
    color: AUTH_COLORS.white,
    fontSize: 17,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 26,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH_COLORS.divider,
  },
  dividerText: {
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 13,
    color: '#9AA89F',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 15,
    color: AUTH_COLORS.body,
  },
  registerLink: {
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 15,
    color: AUTH_COLORS.primary,
  },
});
