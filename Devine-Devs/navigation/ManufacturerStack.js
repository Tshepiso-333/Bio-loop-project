import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManufacturerHomeScreen from '../screens/manufacturer/ManufacturerHomeScreen';

const Stack = createNativeStackNavigator();

export default function ManufacturerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManufacturerHome"
        component={ManufacturerHomeScreen}
        options={{ title: 'Manufacturer Side' }}
      />

      {/* Team: import and add manufacturer screens below this line */}
      {/* <Stack.Screen name="Inventory" component={InventoryScreen} /> */}
    </Stack.Navigator>
  );
}
