import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import RestaurantHomeScreen  from '../screens/restaurant/RestaurantHomeScreen';
import MonitoringScreen      from '../screens/restaurant/MonitoringScreen';
import PickupsScreen         from '../screens/restaurant/PickupsScreen';
import EarningsScreen        from '../screens/restaurant/EarningsScreen';
import SchedulePickupScreen  from '../screens/restaurant/SchedulePickupScreen';
import ManualPickupScreen    from '../screens/restaurant/ManualPickupScreen';
import OnboardingScreen      from '../screens/restaurant/OnboardingScreen';

import { useAuth } from '../AuthContext';

// ─── NAVIGATORS ───────────────────────────────────────────────────────────────

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── COLORS / FONTS ───────────────────────────────────────────────────────────

const COLORS = {
  active:     '#16A34A',
  inactive:   '#94A3B8',
  background: '#FFFFFF',
  border:     '#E2E8F0',
};

// ─── BOTTOM TAB NAVIGATOR ─────────────────────────────────────────────────────
// Holds the four main screens. All tab-switching happens here automatically.

function RestaurantTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
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
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={RestaurantHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
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
    </Tab.Navigator>
  );
}

// ─── ROOT STACK ───────────────────────────────────────────────────────────────
// Wraps the tab navigator so extra screens (SchedulePickup, ManualPickup) can
// slide in on top of the tabs without hiding the tab bar context.

export default function RestaurantStack() {
  const { onboardingCompleted } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingCompleted ? (
        // First-run: force the one-time onboarding wizard before anything else.
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
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
        </>
      )}
    </Stack.Navigator>
  );
}