import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
<<<<<<< HEAD

import { useAuth } from '../AuthContext';
import AdminStack from './AdminStack';
import AuthStack from './AuthStack';
import DriverStack from './DriverStack';
import ManufacturerStack from './ManufacturerStack';
import RestaurantStack from './RestaurantStack';
import UnknownRoleScreen from '../screens/auth/UnknownRoleScreen';

const Stack = createNativeStackNavigator();

const ROLE_STACKS = {
  restaurant: RestaurantStack,
  driver: DriverStack,
  manufacturer: ManufacturerStack,
  admin: AdminStack,
};

export default function RootNavigator() {
  // 1. Grab everything from Context
  const { userRole, isAuthenticated, loading } = useAuth();
  
  // 2. Identify the correct stack based on the DB role
  const ActiveStack = ROLE_STACKS[userRole];

  /*
  // 3. Show a loading spinner while fetching the role from Supabase
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
        <ActivityIndicator size="large" color="#4ADE00" />
      </View>
    );
  }
  */
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
<<<<<<< HEAD
          // Screen for logged-out users
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : ActiveStack ? (
          // Screen for logged-in users with a valid role
          <Stack.Screen name="TeamArea" component={ActiveStack} />
        ) : (
          // Screen for logged-in users whose role isn't found in ROLE_STACKS
=======
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : ROLE_STACKS[role] ? (
          <Stack.Screen name="TeamArea" component={RoleProviderGate} />
        ) : (
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          <Stack.Screen name="UnknownRole" component={UnknownRoleScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
