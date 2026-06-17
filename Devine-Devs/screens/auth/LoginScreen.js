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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';

const COLORS = {
  heroBg:           '#111111',
  heroCard:         '#1C1C1C',
  heroText:         '#FFFFFF',
  heroSubtext:      'rgba(255,255,255,0.55)',
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
};

const FONTS = {
  bold:        'Poppins_700Bold',
  semiBold:    'Poppins_600SemiBold',
  regular:     'Poppins_400Regular',
  bodyRegular: 'Inter_400Regular',
  bodyMedium:  'Inter_500Medium',
  bodySemiBold:'Inter_600SemiBold',
};

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

            {/* Headline */}
            <Text style={styles.headline}>Smart Oil Collection</Text>
            <Text style={styles.subtext}>
              Intelligent waste oil logistics connecting restaurants, collectors,
              and biodiesel manufacturers in one unified system.
            </Text>

            {/* Feature pills */}
            <View style={styles.pillRow}>
              <FeaturePill icon="analytics-outline" label="AI Monitoring" />
              <FeaturePill icon="car-outline" label="Smart Routing" />
              <FeaturePill icon="cash-outline" label="Auto Earnings" />
            </View>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Welcome Back - Centered */}
            <View style={styles.formHeaderRow}>
              <View style={styles.formHeaderCentered}>
                <Text style={styles.formTitle}>Welcome Back</Text>
                <Text style={styles.formSubtitle}>Access your BioLoop dashboard</Text>
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

            {/* Error message */}
            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.errorText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign in button - Updated to match header color */}
            <Pressable 
              style={[styles.signInButton, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                <Ionicons 
                  name={isSubmitting ? "hourglass-outline" : "log-in-outline"} 
                  size={18} 
                  color="#FFFFFF" 
                />
                <Text style={styles.signInButtonText}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
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
              <Pressable
                style={styles.registerLinkRow}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.registerLink}>Create an account</Text>
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

function FeaturePill({ icon, label }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.9)" />
      <Text style={styles.pillText}>{label}</Text>
    </View>
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
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  logoText: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: '#fff',
    letterSpacing: 1,
  },
  headline: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: '#fff',
    lineHeight: 40,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: FONTS.bodyRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
  },
  pillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
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
  formHeaderRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formHeaderCentered: {
    alignItems: 'center',
  },
  formTitle: {
    fontFamily: FONTS.bold,
    fontSize: 28,
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
    paddingLeft: 14 
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
    paddingVertical: 13 
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  forgotLink: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.green,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: COLORS.border 
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
