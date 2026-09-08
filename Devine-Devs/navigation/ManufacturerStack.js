<<<<<<< HEAD
// navigation/ManufacturerStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManufacturerHomeScreen from '../screens/manufacturer/ManufacturerHomeScreen';
import ManufacturerDashboard from '../screens/manufacturer/ManufacturerDashboard';
=======
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
import ManufacturerPaymentScreen from '../screens/manufacturer/ManufacturerPaymentScreen';
import ProfileEditRoute from '../screens/profile/ProfileEditRoute';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

const Stack = createNativeStackNavigator();

function ManufacturerStack() {
  return (
<<<<<<< HEAD
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManufacturerHome" component={ManufacturerHomeScreen} />
      <Stack.Screen name="ManufacturerDashboard" component={ManufacturerDashboard} />
=======
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

      <Stack.Screen
        name="ManufacturerPayment"
        component={ManufacturerPaymentScreen}
        options={{ presentation: 'card' }}
      />

>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </Stack.Navigator>
  );
}

export default ManufacturerStack;