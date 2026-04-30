import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';

const Stack = createNativeStackNavigator();

export default function DriverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ title: 'Driver Side' }}
      />

      {/* Team: import and add driver screens below this line */}
      {/* <Stack.Screen name="Deliveries" component={DeliveriesScreen} /> */}
    </Stack.Navigator>
  );
}
