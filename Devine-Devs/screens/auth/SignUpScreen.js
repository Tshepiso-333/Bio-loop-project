/*import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert, // Added for feedback
} from 'react-native';
import { supabase } from '../../supabase'; // 1. Import your real client

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // 2. Add loading state

  const handleSignUp = async () => { // 3. Make it async
    if (!email || !password) {
      setError('Enter an email and password.');
      return;
    }

    setError('');
    setLoading(true);

    // 4. Call real Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // 5. Check if Supabase requires email confirmation
      if (data.session) {
        // User is logged in immediately
        Alert.alert("Success", "Account created!");
      } else {
        // User needs to check email
        Alert.alert("Check your email", "Please confirm your email address to log in.");
        navigation.goBack(); 
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading} // Disable during request
        />

        <TextInput
          style={styles.input}
          placeholder="Create password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

        <Pressable 
          style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} disabled={loading}>
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
  errorMessage: {
    color: '#b91c1c',
    marginBottom: 14,
    fontSize: 14,
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

import React, { useEffect, useState } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { supabase } from '../../supabase'; // 1. Import your real client

import { AUTH_COLORS, AUTH_FONTS, AUTH_BUTTON_SHADOW } from '../../src/auth/authTheme';
import RolePickerModal from '../../src/auth/components/RolePickerModal';

// Role keys ('restaurant' | 'driver' | 'manufacturer') are sent to Supabase via
// options.data.role — they must not change. `desc` is presentational only.
const ROLES = [
  {
    key: 'restaurant',
    label: 'Restaurant',
    icon: 'restaurant-outline',
    desc: 'I have used cooking oil to be collected.',
  },
  {
    key: 'driver',
    label: 'Driver',
    icon: 'car-outline',
    desc: 'I collect used oil from restaurants.',
  },
  {
    key: 'manufacturer',
    label: 'Manufacturer',
    icon: 'flask-outline',
    desc: 'I turn used oil into clean biodiesel.',
  },
];

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // 2. Add loading state

  const [showPassword, setShowPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [surnameFocused, setSurnameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Role pop-up: opens automatically on arrival (from "Create an account") when
  // no role is selected yet. Selecting a card drives the existing setRole.
  const [showRoleModal, setShowRoleModal] = useState(false);
  useEffect(() => {
    if (!role) setShowRoleModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRole = (key) => {
    setRole(key); // existing setter — single source of truth for role
    setShowRoleModal(false);
  };

  const selectedRole = ROLES.find((r) => r.key === role);

  const insets = useSafeAreaInsets();

  const handleSignUp = async () => { // 3. Make it async
    if (!name || !surname || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!role) {
      setError('Please select a role to continue.');
      return;
    }

    setError('');
    setLoading(true);

    /*
    // 4. Call real Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          name: name.trim(),
          surname: surname.trim(),
          role: role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // 5. Check if Supabase requires email confirmation
      if (data.session) {
        // User is logged in immediately
        Alert.alert("Success", "Account created!");
      } else {
        // User needs to check email
        Alert.alert("Check your email", "Please confirm your email address to log in.");
        navigation.goBack();
      }
    }
    */

    setLoading(false);
    Alert.alert('Design mode', 'Sign up is disabled while Supabase is switched off.');
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
            { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back chevron */}
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={20} color={AUTH_COLORS.ink} />
          </Pressable>

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Just a few details to get you started.</Text>
          </View>

          {/* Role badge + change */}
          <View style={styles.badgeRow}>
            {selectedRole ? (
              <>
                <View style={styles.badge}>
                  <View style={styles.badgeIcon}>
                    <Ionicons name={selectedRole.icon} size={16} color={AUTH_COLORS.white} />
                  </View>
                  <Text style={styles.badgeText}>Signing up as {selectedRole.label}</Text>
                </View>
                <Pressable onPress={() => setShowRoleModal(true)} disabled={loading}>
                  <Text style={styles.changeLink}>Change</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={styles.chooseBadge}
                onPress={() => setShowRoleModal(true)}
                disabled={loading}
              >
                <Text style={styles.chooseBadgeText}>Choose your role</Text>
                <Ionicons name="chevron-forward" size={16} color={AUTH_COLORS.primary} />
              </Pressable>
            )}
          </View>

          {/* Name + Surname */}
          <View style={styles.nameRow}>
            <View style={styles.nameCol}>
              <Text style={styles.label}>Name</Text>
              <View style={[styles.inputWrap, nameFocused && styles.inputWrapFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Jane"
                  placeholderTextColor={AUTH_COLORS.placeholder}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!loading}
                />
              </View>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.label}>Surname</Text>
              <View style={[styles.inputWrap, surnameFocused && styles.inputWrapFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor={AUTH_COLORS.placeholder}
                  value={surname}
                  onChangeText={setSurname}
                  onFocus={() => setSurnameFocused(true)}
                  onBlur={() => setSurnameFocused(false)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
            <Ionicons name="mail-outline" size={19} color={AUTH_COLORS.primary} style={styles.inputIcon} />
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
              editable={!loading}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Create password</Text>
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <Ionicons name="lock-closed-outline" size={19} color={AUTH_COLORS.primary} style={styles.inputIcon} />
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
              onSubmitEditing={handleSignUp}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color={AUTH_COLORS.iconMuted}
              />
            </Pressable>
          </View>

          {/* Error message */}
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={15} color={AUTH_COLORS.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Create account button */}
          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Creating account...' : 'Create account'}
            </Text>
            <Ionicons
              name={loading ? 'hourglass-outline' : 'arrow-forward'}
              size={19}
              color={AUTH_COLORS.white}
            />
          </Pressable>

          {/* Back to sign in */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Role-selection pop-up (presentational) */}
        <RolePickerModal
          visible={showRoleModal}
          role={role}
          roles={ROLES}
          onSelect={handleSelectRole}
          onClose={() => setShowRoleModal(false)}
        />
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
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AUTH_COLORS.selectedBg,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 22,
  },
  title: {
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 30,
    color: AUTH_COLORS.ink,
    letterSpacing: -0.5,
    marginBottom: 7,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 15,
    color: AUTH_COLORS.body,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: AUTH_COLORS.roleCircle,
    borderRadius: 999,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 15,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 13.5,
    color: AUTH_COLORS.primary,
  },
  changeLink: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 13.5,
    color: AUTH_COLORS.primary,
    textDecorationLine: 'underline',
  },
  chooseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AUTH_COLORS.roleCircle,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  chooseBadgeText: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 13.5,
    color: AUTH_COLORS.primary,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameCol: {
    flex: 1,
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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: AUTH_COLORS.primary,
    borderWidth: 2,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontFamily: AUTH_FONTS.medium,
    fontSize: 15.5,
    color: AUTH_COLORS.ink,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    marginTop: 4,
    marginBottom: 4,
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
    marginTop: 14,
    ...AUTH_BUTTON_SHADOW,
  },
  primaryButtonText: {
    fontFamily: AUTH_FONTS.bold,
    color: AUTH_COLORS.white,
    fontSize: 17,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 22,
  },
  footerText: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 14.5,
    color: AUTH_COLORS.body,
  },
  footerLink: {
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 14.5,
    color: AUTH_COLORS.primary,
  },
});
