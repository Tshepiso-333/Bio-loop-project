import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../AuthContext';
<<<<<<< HEAD

export default function UnknownRoleScreen() {
  const { userRole, logout } = useAuth();
=======
import { useProfile } from '../../src/hooks/useProfile';

export default function UnknownRoleScreen() {
  const { signOut } = useAuth();
  const { role } = useProfile();
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  return (
    <View style={styles.container}>
      <Text style={styles.title}>No stack mapped for this role</Text>
<<<<<<< HEAD
      <Text style={styles.role}>Typed role: {userRole}</Text>
      <Text style={styles.help}>Use one of: restaurant, driver, manufacturer, admin.</Text>

      <Pressable style={styles.button} onPress={logout}>
=======
      <Text style={styles.role}>Typed role: {role ?? 'unknown'}</Text>
      <Text style={styles.help}>Use one of: collector, admin, manufacturer, restaurant.</Text>

      <Pressable style={styles.button} onPress={signOut}>
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
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
