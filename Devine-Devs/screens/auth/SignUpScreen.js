import React, { useState } from 'react';
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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      setError('Enter your name, email and password.');
      return;
    }

    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: { data: { role: 'restaurant', full_name: fullName.trim() } },
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
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
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
});
