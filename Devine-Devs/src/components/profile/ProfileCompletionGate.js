import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useProfile } from '../../hooks/useProfile';
import ProfileEditScreen from './ProfileEditScreen';

/**
 * Shows profile completion flow before the main role app when required fields are missing.
 * Admin users bypass this gate.
 */
export default function ProfileCompletionGate({ children }) {
  const { role, completion, loading } = useProfile();
  const [skipped, setSkipped] = useState(false);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15643E" />
      </View>
    );
  }

  if (role === 'admin' || skipped || completion?.isComplete) {
    return children;
  }

  return (
    <ProfileEditScreen
      mode="completion"
      onDone={() => setSkipped(false)}
      onSkip={() => setSkipped(true)}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8F7',
  },
});
