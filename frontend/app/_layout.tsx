import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/theme';

function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for Android navigation bar
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 16) + 8  // Ensure minimum padding + extra space
    : insets.bottom > 0 ? insets.bottom : 24;
  
  const tabBarHeight = Platform.OS === 'android' 
    ? 60 + Math.max(insets.bottom, 16)  // Base height + navigation bar space
    : 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabBarHeight,
          // Ensure the tab bar sits above the system navigation
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'android' ? 4 : 0,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
        // Add content padding to avoid overlap with tab bar
        sceneContainerStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Übersicht',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Abos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="credit-card-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Fixkosten',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription/[id]"
        options={{
          href: null,
          title: 'Abo Details',
        }}
      />
      <Tabs.Screen
        name="subscription/add"
        options={{
          href: null,
          title: 'Abo hinzufügen',
        }}
      />
      <Tabs.Screen
        name="expense/[id]"
        options={{
          href: null,
          title: 'Fixkosten Details',
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <TabLayout />
    </SafeAreaProvider>
  );
}
