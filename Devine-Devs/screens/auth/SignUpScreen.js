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
import { supabase } from '../../supabase'; // Un-commented your client import

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

const ROLES = [
  { key: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' },
  { key: 'driver', label: 'Driver', icon: 'car-outline' },
  { key: 'manufacturer', label: 'Manufacturer', icon: 'flask-outline' },
];

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [surnameFocused, setSurnameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const insets = useSafeAreaInsets();

  const handleSignUp = async () => {
    if (!name || !surname || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!role) {
      setError('Please select a role to continue.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    // Map frontend 'driver' key to database 'collector' app_role
    const databaseRole = role === 'driver' ? 'collector' : role;

    try {

   console.log('SIGNUP STARTED');
      // Execute the signup network write to Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            surname: surname.trim(),
            role: databaseRole, // Passed safely inside meta-data payload
          },
        },
      });

      if (authError) throw authError;

      if (data?.user) {
        // Handle scenario depending on your Supabase dashboard configuration
        if (data.session) {
          Alert.alert("Success", "Account created successfully!");
        } else {
          Alert.alert(
            "Check your email", 
            "We've sent a verification link to your email address. Please confirm it to finish logging in."
          );
          navigation.goBack();
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
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

            {/* Headline */}
            <Text style={styles.headline}>Join BioLoop</Text>
            <Text style={styles.subtext}>
              Create an account to start collecting, supplying, or
              processing used cooking oil with our smart network.
            </Text>
          </LinearGradient>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.formHeaderRow}>
              <View style={styles.formHeaderCentered}>
                <Text style={styles.formTitle}>Create Account</Text>
                <Text style={styles.formSubtitle}>Get started with BioLoop</Text>
              </View>
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={[styles.inputWrap, nameFocused && styles.inputWrapFocused]}>
              <Ionicons
                name="person-outline"
                size={17}
                color={nameFocused ? COLORS.green : COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Jane"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            {/* Surname */}
            <Text style={styles.fieldLabel}>Surname</Text>
            <View style={[styles.inputWrap, surnameFocused && styles.inputWrapFocused]}>
              <Ionicons
                name="person-outline"
                size={17}
                color={surnameFocused ? COLORS.green : COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor={COLORS.textMuted}
                value={surname}
                onChangeText={setSurname}
                onFocus={() => setSurnameFocused(true)}
                onBlur={() => setSurnameFocused(false)}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
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
                editable={!loading}
              />
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>Create Password</Text>
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
                onSubmitEditing={handleSignUp}
                editable={!loading}
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

            {/* Role selector */}
            <Text style={styles.fieldLabel}>I am signing up as a...</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const active = role === r.key;
                return (
                  <Pressable
                    key={r.key}
                    style={[styles.roleChip, active && styles.roleChipActive]}
                    onPress={() => setRole(r.key)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={r.icon}
                      size={16}
                      color={active ? '#FFFFFF' : COLORS.textSecondary}
                    />
                    <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Error message */}
            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.errorText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign up button */}
            <Pressable
              style={[styles.signInButton, loading && { opacity: 0.7 }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                <Ionicons
                  name={loading ? 'hourglass-outline' : 'person-add-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.signInButtonText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Back to sign in */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Already have an account? </Text>
              <Pressable
                style={styles.registerLinkRow}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.registerLink}>Back to sign in</Text>
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
  root: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { flexGrow: 1 },
  heroSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: 56, height: 56, borderRadius: 28 },
  logoText: { fontFamily: FONTS.bold, fontSize: 28, color: '#fff', letterSpacing: 1 },
  headline: { fontFamily: FONTS.bold, fontSize: 32, color: '#fff', textAlign: 'center', marginBottom: 12 },
  subtext: { fontFamily: FONTS.bodyRegular, fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, textAlign: 'center' },
  formSection: { flex: 1, backgroundColor: COLORS.formBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 28, marginTop: -10 },
  formHeaderRow: { alignItems: 'center', marginBottom: 24 },
  formHeaderCentered: { alignItems: 'center' },
  formTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.textPrimary, marginBottom: 6 },
  formSubtitle: { fontFamily: FONTS.bodyRegular, fontSize: 14, color: COLORS.textSecondary },
  fieldLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.inputBorder, borderRadius: 14, marginBottom: 16, overflow: 'hidden' },
  inputWrapFocused: { borderColor: COLORS.inputBorderFocus, borderWidth: 2 },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, fontFamily: FONTS.bodyRegular, fontSize: 15, color: COLORS.textPrimary },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 13 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  roleChip: { flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.inputBorder, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12 },
  roleChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.greenDark },
  roleChipText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.textSecondary },
  roleChipTextActive: { color: '#FFFFFF', fontFamily: FONTS.bodySemiBold },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.errorBg, borderWidth: 1, borderColor: COLORS.errorBorder, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.errorText, flex: 1 },
  signInButton: { borderRadius: 14, marginBottom: 20, overflow: 'hidden' },
  signInGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16 },
  signInButtonText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 15, letterSpacing: 0.5, textTransform: 'uppercase' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textMuted },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontFamily: FONTS.bodyRegular, fontSize: 13, color: COLORS.textSecondary },
  registerLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  registerLink: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.green },
});