// navigation/ManufacturerStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManufacturerDashboardScreen from '../screens/manufacturer/ManufacturerDashboardScreen';
import QualityScreen from '../screens/manufacturer/QualityScreen';
import ForecastsScreen from '../screens/manufacturer/ForecastsScreen';
import AIChatScreen from '../screens/manufacturer/AIChatScreen';
import SuppliersScreen from '../screens/manufacturer/SuppliersScreen';
import AlertsScreen from '../screens/manufacturer/AlertsScreen';
import ProfileScreen from '../screens/manufacturer/ProfileScreen';
import ManufacturerPaymentScreen from '../screens/manufacturer/ManufacturerPaymentScreen';
import ProfileEditRoute from '../screens/profile/ProfileEditRoute';

const Stack = createNativeStackNavigator();

function ManufacturerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Entry screen — the updated dashboard */}
      <Stack.Screen
        name="ManufacturerDashboardScreen"
        component={ManufacturerDashboardScreen}
        options={{ animation: 'fade_from_bottom' }}
      />

      {/* Feature screens navigable from the dashboard */}
      <Stack.Screen name="Quality" component={QualityScreen} />
      <Stack.Screen name="Forecasts" component={ForecastsScreen} />
      <Stack.Screen name="AIChat" component={AIChatScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditRoute}
        options={{ presentation: 'card' }}
      />

      <Stack.Screen
        name="ManufacturerPayment"
        component={ManufacturerPaymentScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}

export default ManufacturerStack;