import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import RestaurantHomeScreen  from '../screens/restaurant/RestaurantHomeScreen';
import MonitoringScreen      from '../screens/restaurant/MonitoringScreen';
import PickupsScreen         from '../screens/restaurant/PickupsScreen';
import EarningsScreen        from '../screens/restaurant/EarningsScreen';
<<<<<<< HEAD
import SchedulePickupScreen  from '../screens/restaurant/SchedulePickupScreen';
import ManualPickupScreen    from '../screens/restaurant/ManualPickupScreen';
=======
import RestaurantProfileScreen from '../screens/restaurant/RestaurantProfileScreen';
import SchedulePickupScreen  from '../screens/restaurant/SchedulePickupScreen';
import ManualPickupScreen    from '../screens/restaurant/ManualPickupScreen';
import ProfileEditRoute      from '../screens/profile/ProfileEditRoute';
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0

// ─── NAVIGATORS ───────────────────────────────────────────────────────────────

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

<<<<<<< HEAD
// ─── COLORS / FONTS ───────────────────────────────────────────────────────────

const COLORS = {
  active:     '#16A34A',
  inactive:   '#94A3B8',
  background: '#FFFFFF',
  border:     '#E2E8F0',
=======
// ─── THEME COLOURS (matching manufacturer and driver) ─────────────────────────

const THEME = {
  primary: '#15643E',
  primaryDark: '#2E8B5A',
  white: '#FFFFFF',
  gray: '#A9B5AD',
  grayLight: '#E4EDE7',
  border: '#E4EDE7',
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
};

// ─── BOTTOM TAB NAVIGATOR ─────────────────────────────────────────────────────
// Holds the four main screens. All tab-switching happens here automatically.

function RestaurantTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
<<<<<<< HEAD
        tabBarActiveTintColor:   COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor:  COLORS.border,
          borderTopWidth:  1,
          paddingTop:      8,
          height:          62,
        },
        tabBarLabelStyle: {
          fontFamily:   'Inter_500Medium',
          fontSize:     10,
          paddingBottom: 6,
=======
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.gray,
        tabBarStyle: {
          backgroundColor: THEME.white,
          borderTopColor: THEME.grayLight,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 10,
          height: 65,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
        },
      }}
    >
      <Tab.Screen
<<<<<<< HEAD
        name="Dashboard"
        component={RestaurantHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
=======
        name="Home"
        component={RestaurantHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
          ),
        }}
      />
      <Tab.Screen
        name="Monitoring"
        component={MonitoringScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Pickups"
        component={PickupsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="truck-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
<<<<<<< HEAD
=======
      <Tab.Screen
        name="Profile"
        component={RestaurantProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </Tab.Navigator>
  );
}

// ─── ROOT STACK ───────────────────────────────────────────────────────────────
// Wraps the tab navigator so extra screens (SchedulePickup, ManualPickup) can
// slide in on top of the tabs without hiding the tab bar context.

export default function RestaurantStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tabs — always the entry point */}
      <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} />

      {/* Screens that slide in over the tabs */}
      <Stack.Screen
        name="SchedulePickup"
        component={SchedulePickupScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ManualPickup"
        component={ManualPickupScreen}
        options={{ presentation: 'card' }}
      />
<<<<<<< HEAD
=======
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditRoute}
        options={{ presentation: 'card' }}
      />
>>>>>>> 16206bc651f58ce09f2b1efc8bc5fba053d2c1d0
    </Stack.Navigator>
  );
}