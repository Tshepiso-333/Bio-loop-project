// Tracks whether the user has completed/skipped the onboarding flow.
// Backed by AsyncStorage using the app's existing "@bioloop" key prefix.

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEY = '@bioloop/hasSeenOnboarding';

export function useOnboarding() {
  const [seen, setSeen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (active) setSeen(value === 'true');
      } catch (err) {
        // On a read failure, fail open (show onboarding) rather than block.
        console.warn('Onboarding flag read failed:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const markSeen = useCallback(async () => {
    setSeen(true); // optimistic — navigate away immediately
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (err) {
      console.warn('Onboarding flag write failed:', err.message);
    }
  }, []);

  return { seen, loading, markSeen };
}
