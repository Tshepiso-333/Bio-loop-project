import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../AuthContext';

export default function UnknownRoleScreen() {
  const { userRole, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>No stack mapped for this role</Text>
      <Text style={styles.role}>Typed role: {userRole}</Text>
      <Text style={styles.help}>Use one of: restaurant, driver, manufacturer, admin.</Text>

      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Back To Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  role: {
    marginTop: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  help: {
    marginTop: 8,
    color: '#475569',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
