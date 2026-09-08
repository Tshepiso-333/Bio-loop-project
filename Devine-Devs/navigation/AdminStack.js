<<<<<<< HEAD
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
=======
// navigation/AdminStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
<<<<<<< HEAD
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Admin Side' }}
=======
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
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
      />

      {/* Team: import and add admin screens below this line */}
      {/* <Stack.Screen name="AdminReports" component={AdminReportsScreen} /> */}
    </Stack.Navigator>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
