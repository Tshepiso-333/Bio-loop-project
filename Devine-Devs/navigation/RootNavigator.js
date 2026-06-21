import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../AuthContext';
import { useProfile } from '../src/hooks/useProfile';
import { useOnboarding } from '../src/hooks/useOnboarding';
import AuthStack from './AuthStack';
import RoleProviderGate, { ROLE_STACKS } from '../src/providers/RoleProviderGate';
import UnknownRoleScreen from '../screens/auth/UnknownRoleScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
    <ActivityIndicator size="large" color="#4ADE00" />
  </View>
);

export default function RootNavigator() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useProfile();
  const { seen: onboardingSeen, loading: onboardingLoading, markSeen } = useOnboarding();

  if (authLoading || onboardingLoading || (isAuthenticated && profileLoading)) {
    return <LoadingScreen />;
  }

  // First-launch onboarding takes precedence over everything else.
  if (!onboardingSeen) {
    return <OnboardingScreen onDone={markSeen} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : ROLE_STACKS[role] ? (
          <Stack.Screen name="TeamArea" component={RoleProviderGate} />
        ) : (
          <Stack.Screen name="UnknownRole" component={UnknownRoleScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
