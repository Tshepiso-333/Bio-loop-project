import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Screen for logged-out users
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : ActiveStack ? (
          // Screen for logged-in users with a valid role
          <Stack.Screen name="TeamArea" component={ActiveStack} />
        ) : (
          // Screen for logged-in users whose role isn't found in ROLE_STACKS
          <Stack.Screen name="UnknownRole" component={UnknownRoleScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
