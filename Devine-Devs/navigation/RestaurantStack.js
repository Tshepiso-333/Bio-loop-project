import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RestaurantHomeScreen from '../screens/restaurant/RestaurantHomeScreen';

const Stack = createNativeStackNavigator();

export default function RestaurantStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RestaurantHome"
        component={RestaurantHomeScreen}
        options={{ title: 'Restaurant Side' }}
      />

      {/* Team: import and add restaurant screens below this line */}
      {/* <Stack.Screen name="Menu" component={MenuScreen} /> */}
    </Stack.Navigator>
  );
}
