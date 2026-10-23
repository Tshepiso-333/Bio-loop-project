import React, { useCallback, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { addNotificationTapListener } from '../src/services/pushService';
import { markAlertRead } from '../src/services/notificationService';

import { useAuth } from '../AuthContext';
import { useProfile } from '../src/hooks/useProfile';
import { useOnboarding } from '../src/hooks/useOnboarding';
import AlertBanner from '../src/components/AlertBanner';
import AuthStack from './AuthStack';
import RoleProviderGate, { ROLE_STACKS } from '../src/providers/RoleProviderGate';
import UnknownRoleScreen from '../screens/auth/UnknownRoleScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
    <ActivityIndicator size="large" color="#4ADE00" />
  </View>
);

export default function RootNavigator() {
  const { user, isAuthenticated, loading: authLoading, recoveringPassword } = useAuth();
  const { role, loading: profileLoading } = useProfile();
  const { seen: onboardingSeen, loading: onboardingLoading, markSeen } = useOnboarding();
  const navigationRef = useRef(null);

  // Both the push tap and the in-app banner land here, so there is exactly
  // one place that knows how to open an alert's subject.
  const openAlertTarget = useCallback(({ screen, params }) => {
    try {
      navigationRef.current?.navigate('TeamArea', { screen, params });
    } catch {
      // A route that no longer exists must not crash the app on a tap.
    }
  }, []);

  // Tapping a push notification should land on the thing it is about, and
  // mark that alert read so the bell badge doesn't nag about something the
  // person has just dealt with. Route names differ per role, so the role is
  // passed in; an unresolvable route just opens the app rather than throwing.
  useEffect(() => {
    if (!isAuthenticated || !role) return undefined;

    return addNotificationTapListener(({ screen, params, alertId }) => {
      if (alertId) {
        markAlertRead(alertId, true).catch(() => {});
      }
      openAlertTarget({ screen, params });
    }, role);
  }, [isAuthenticated, role, openAlertTarget]);

  // Don't let the profile fetch hold a spinner over the reset screen.
  if (authLoading || onboardingLoading || (isAuthenticated && profileLoading && !recoveringPassword)) {
    return <LoadingScreen />;
  }

  // First-launch onboarding takes precedence over everything else.
  if (!onboardingSeen) {
    return <OnboardingScreen onDone={markSeen} />;
  }

  // The banner is a sibling of the navigator, not a screen, so it can sit
  // over whichever stack is mounted. Hidden mid password reset, where the
  // only thing that should be on screen is the new-password form.
  const showAlertBanner = isAuthenticated && !recoveringPassword && !!role && !!user?.id;

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {recoveringPassword ? (
            /* Mid password reset. The recovery session already counts as
               signed in, so this has to outrank the role stacks or the reset
               screen never gets shown. */
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          ) : !isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthStack} />
          ) : ROLE_STACKS[role] ? (
            <Stack.Screen name="TeamArea" component={RoleProviderGate} />
          ) : (
            <Stack.Screen name="UnknownRole" component={UnknownRoleScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {showAlertBanner ? (
        <AlertBanner userId={user.id} role={role} onOpen={openAlertTarget} />
      ) : null}
    </View>
  );
}
