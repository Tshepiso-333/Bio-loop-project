// navigation/ManufacturerStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManufacturerHomeScreen from '../screens/manufacturer/ManufacturerHomeScreen';
import ManufacturerDashboard from '../screens/manufacturer/ManufacturerDashboard';

const Stack = createNativeStackNavigator();

function ManufacturerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManufacturerHome" component={ManufacturerHomeScreen} />
      <Stack.Screen name="ManufacturerDashboard" component={ManufacturerDashboard} />
    </Stack.Navigator>
  );
}

export default ManufacturerStack;