import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManufacturerHomeScreen from '../screens/manufacturer/ManufacturerHomeScreen';
import ManufacturerDashboardScreen from '../screens/manufacturer/ManufacturerDashboardScreen';
import QualityScreen from '../screens/manufacturer/QualityScreen';
import ForecastsScreen from '../screens/manufacturer/ForecastsScreen';
import AIChatScreen from '../screens/manufacturer/AIChatScreen';
import SuppliersScreen from '../screens/manufacturer/SuppliersScreen';
import AlertsScreen from '../screens/manufacturer/AlertsScreen';
import ProfileScreen from '../screens/manufacturer/ProfileScreen';
import ProfileEditRoute from '../screens/profile/ProfileEditRoute';

const Stack = createNativeStackNavigator();

function ManufacturerStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right', // Smooth transitions between screens
      }}
    >
      {/* Welcome/Entry Screen */}
      <Stack.Screen 
        name="ManufacturerHome" 
        component={ManufacturerHomeScreen} 
        options={{ animation: 'fade_from_bottom' }}
      />
      
      {/* Main Dashboard with Bottom Tabs */}
      {/* FIXED: Changed from "ManufacturerDashboard" to "ManufacturerDashboardScreen" */}
      <Stack.Screen 
        name="ManufacturerDashboardScreen" 
        component={ManufacturerDashboardScreen} 
      />
      
      {/* Feature Screens - can be accessed from dashboard tabs */}
      <Stack.Screen 
        name="Quality" 
        component={QualityScreen} 
      />
      
      <Stack.Screen 
        name="Forecasts" 
        component={ForecastsScreen} 
      />
      
      <Stack.Screen 
        name="AIChat" 
        component={AIChatScreen} 
      />
      
      <Stack.Screen 
        name="Suppliers" 
        component={SuppliersScreen} 
      />
      
      <Stack.Screen 
        name="Alerts" 
        component={AlertsScreen} 
      />
      
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />

      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditRoute}
        options={{ presentation: 'card' }}
      />
      
    </Stack.Navigator>
  );
}

export default ManufacturerStack;