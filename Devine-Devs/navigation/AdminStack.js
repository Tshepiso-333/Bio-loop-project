// navigation/AdminStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
      />
      
      <Stack.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
      />

      {/* Team: import and add admin screens below this line */}
      {/* <Stack.Screen name="AdminReports" component={AdminReportsScreen} /> */}
    </Stack.Navigator>
  );
}