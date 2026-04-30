import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Admin Side' }}
      />

      {/* Team: import and add admin screens below this line */}
      {/* <Stack.Screen name="AdminReports" component={AdminReportsScreen} /> */}
    </Stack.Navigator>
  );
}
