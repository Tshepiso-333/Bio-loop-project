import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DriverHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Side</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
});
