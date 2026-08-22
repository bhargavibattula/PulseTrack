import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import ManagerDashboard from '../screens/dashboard/ManagerDashboard';
import ConfigurationScreen from '../screens/configuration/ConfigurationScreen';
import AuditLogsScreen from '../screens/audit/AuditLogsScreen';
import LaboratoryScreen from '../screens/laboratory/LaboratoryScreen';
import YieldScreen from '../screens/yield/YieldScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import SiloListScreen from '../screens/silos/SiloListScreen';
import SiloDetailScreen from '../screens/silos/SiloDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function OverviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} />
      <Stack.Screen name="Configuration" component={ConfigurationScreen} options={{ headerShown: true, title: 'Configuration' }} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ headerShown: true, title: 'Audit Logs' }} />
      <Stack.Screen name="Laboratory" component={LaboratoryScreen} options={{ headerShown: true, title: 'Laboratory' }} />
    </Stack.Navigator>
  );
}

function SilosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SiloList" component={SiloListScreen} />
      <Stack.Screen name="SiloDetail" component={SiloDetailScreen} options={{ headerShown: true, title: 'Silo' }} />
    </Stack.Navigator>
  );
}

const renderIcon = (focused: boolean, color: string, Provider: any, name: string) => (
  <View className="items-center justify-center pt-2">
    {focused && <View className="w-1 h-1 bg-amber-500 rounded-full absolute top-0" />}
    <Provider name={name} size={24} color={color} />
  </View>
);

export default function ManagerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D97706',
        tabBarInactiveTintColor: '#A8A29E',
        tabBarStyle: {
          backgroundColor: '#FAFAF9',
          borderTopColor: '#E7E5E4',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen name="Overview" component={OverviewStack} options={{ tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'home') }} />
      <Tab.Screen name="Yield" component={YieldScreen} options={{ headerShown: true, title: 'Yield', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'chart-line') }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: true, title: 'Inventory', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'package-variant') }} />
      <Tab.Screen name="Silos" component={SilosStack} options={{ tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'silo') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'settings') }} />
    </Tab.Navigator>
  );
}
