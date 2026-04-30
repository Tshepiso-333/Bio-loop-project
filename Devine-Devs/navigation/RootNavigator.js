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
  const { userRole, isAuthenticated } = useAuth();
  const ActiveStack = ROLE_STACKS[userRole];

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated && <Stack.Screen name="Auth" component={AuthStack} />}

        {isAuthenticated && ActiveStack && (
          <Stack.Screen name="TeamArea" component={ActiveStack} />
        )}

        {isAuthenticated && !ActiveStack && (
          <Stack.Screen name="UnknownRole" component={UnknownRoleScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
