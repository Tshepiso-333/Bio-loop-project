// Devine-Devs/navigation/DriverStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
<<<<<<< HEAD
=======
import { createNativeStackNavigator } from '@react-navigation/native-stack';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
import { Ionicons } from '@expo/vector-icons';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverCollectionsScreen from '../screens/driver/DriverCollectionsScreen';
import DriverMapScreen from '../screens/driver/DriverMapScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
<<<<<<< HEAD

const Tab = createBottomTabNavigator();

export default function DriverStack() {
=======
import ProfileEditRoute from '../screens/profile/ProfileEditRoute';
import { DRV_COLORS, DRV_FONTS } from '../src/driver/driverTheme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DriverTabs() {
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
<<<<<<< HEAD
        tabBarActiveTintColor: '#1A6B3C',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 10,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
=======
        tabBarActiveTintColor: DRV_COLORS.primary,
        tabBarInactiveTintColor: DRV_COLORS.muted,
        tabBarStyle: {
          backgroundColor: DRV_COLORS.white,
          borderTopColor: DRV_COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 10,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: DRV_FONTS.medium,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons = {
            DriverHome: focused ? 'home' : 'home-outline',
            DriverCollections: focused ? 'list' : 'list-outline',
            DriverMap: focused ? 'map' : 'map-outline',
            DriverProfile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DriverHome" component={DriverHomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="DriverCollections" component={DriverCollectionsScreen} options={{ tabBarLabel: 'Collections' }} />
      <Tab.Screen name="DriverMap" component={DriverMapScreen} options={{ tabBarLabel: 'Map' }} />
      <Tab.Screen name="DriverProfile" component={DriverProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
<<<<<<< HEAD
}
=======
}

export default function DriverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditRoute} options={{ presentation: 'card' }} />
    </Stack.Navigator>
  );
}
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
