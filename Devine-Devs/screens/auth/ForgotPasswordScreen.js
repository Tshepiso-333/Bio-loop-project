import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { findUserByEmail, normalizeEmail } from '../../auth/hardcodedUsers';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const handleRecoverPassword = () => {
    const user = findUserByEmail(normalizeEmail(email));

    if (!email.trim()) {
      setMessageType('error');
      setMessage('Enter your email address first.');
      return;
    }

    if (!user) {
      setMessageType('error');
      setMessage('That email is not in the hardcoded demo list yet.');
      return;
    }

    setMessageType('info');
    setMessage(`Demo password for ${user.email}: ${user.password}`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Forgot Password</Text>

      <View style={styles.formCard}>
        <Text style={styles.description}>
          Enter your email and the app will show the hardcoded demo password for now.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="done"
          onSubmitEditing={handleRecoverPassword}
        />

        {message ? (
          <Text
            style={[
              styles.message,
              messageType === 'error' ? styles.errorMessage : styles.infoMessage,
            ]}
          >
            {message}
          </Text>
        ) : null}

        <Pressable style={styles.primaryButton} onPress={handleRecoverPassword}>
          <Text style={styles.primaryButtonText}>Show Password</Text>
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
  description: {
    color: '#475569',
    marginBottom: 14,
    lineHeight: 20,
  },
  label: {
    color: '#334155',
    fontWeight: '600',
    marginBottom: 8,
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
  message: {
    marginBottom: 14,
    fontSize: 14,
  },
  errorMessage: {
    color: '#b91c1c',
  },
  infoMessage: {
    color: '#0369a1',
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
