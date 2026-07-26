// Devine-Devs/navigation/DriverStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverCollectionsScreen from '../screens/driver/DriverCollectionsScreen';
import DriverMapScreen from '../screens/driver/DriverMapScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import ProfileEditRoute from '../screens/profile/ProfileEditRoute';
import { DRV_COLORS, DRV_FONTS } from '../src/driver/driverTheme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
}

export default function DriverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs" component={DriverTabs} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditRoute} options={{ presentation: 'card' }} />
    </Stack.Navigator>
  );
}
