// Devine-Devs/navigation/DriverStack.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverCollectionsScreen from '../screens/driver/DriverCollectionsScreen';
import DriverMapScreen from '../screens/driver/DriverMapScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';

const Tab = createBottomTabNavigator();

export default function DriverStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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