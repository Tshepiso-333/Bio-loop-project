import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../AuthContext';
import { useProfile } from '../src/hooks/useProfile';
import AuthStack from './AuthStack';
import RoleProviderGate, { ROLE_STACKS } from '../src/providers/RoleProviderGate';
import UnknownRoleScreen from '../screens/auth/UnknownRoleScreen';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
    <ActivityIndicator size="large" color="#4ADE00" />
  </View>
);

export default function RootNavigator() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useProfile();

  if (authLoading || (isAuthenticated && profileLoading)) {
    return <LoadingScreen />;
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
