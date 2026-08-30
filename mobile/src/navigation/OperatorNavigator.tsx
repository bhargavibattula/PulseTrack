import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import OperatorDashboard from '../screens/dashboard/OperatorDashboard';
import IntakeListScreen from '../screens/intake/IntakeListScreen';
import NewIntakeScreen from '../screens/intake/NewIntakeScreen';
import SiloListScreen from '../screens/silos/SiloListScreen';
import SiloDetailScreen from '../screens/silos/SiloDetailScreen';
import ShiftScreen from '../screens/shifts/ShiftScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import ProductionListScreen from '../screens/processing/ProductionListScreen';
import ProductionTransferScreen from '../screens/processing/ProductionTransferScreen';
import ProductionDetailScreen from '../screens/processing/ProductionDetailScreen';
import ByproductsScreen from '../screens/byproducts/ByproductsScreen';
import TransfersScreen from '../screens/transfers/TransfersScreen';
import DispatchScreen from '../screens/dispatch/DispatchScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import YieldScreen from '../screens/yield/YieldScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OperatorDashboard" component={OperatorDashboard} />
      <Stack.Screen name="Yield" component={YieldScreen} options={{ headerShown: true, title: 'Lab Yield Entry' }} />
      <Stack.Screen name="NewIntake" component={NewIntakeScreen} options={{ headerShown: true, title: 'New Intake' }} />
      <Stack.Screen name="Shifts" component={ShiftScreen} options={{ headerShown: true, title: 'Shift Summary' }} />
      <Stack.Screen name="ProductionDetail" component={ProductionDetailScreen} options={{ headerShown: true, title: 'Production Run Details' }} />
    </Stack.Navigator>
  );
}

function ProcessingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductionList" component={ProductionListScreen} />
      <Stack.Screen name="NewTransfer" component={ProductionTransferScreen} options={{ headerShown: true, title: 'New Production Transfer' }} />
      <Stack.Screen name="ProductionDetail" component={ProductionDetailScreen} options={{ headerShown: true, title: 'Run Details' }} />
      <Stack.Screen name="Yield" component={YieldScreen} options={{ headerShown: true, title: 'Lab Yield Entry' }} />
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

export default function OperatorNavigator() {
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
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'home') }} />
      <Tab.Screen name="Intake" component={IntakeListScreen} options={{ headerShown: true, title: 'Intake', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'truck') }} />
      <Tab.Screen name="Silos" component={SilosStack} options={{ tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'silo') }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: true, title: 'Inventory', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'package-variant') }} />
      <Tab.Screen name="Processing" component={ProcessingStack} options={{ headerShown: false, tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'settings') }} />
      <Tab.Screen name="ByProducts" component={ByproductsScreen} options={{ headerShown: true, title: 'By-products', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'recycle-variant') }} />
      <Tab.Screen name="Transfers" component={TransfersScreen} options={{ headerShown: true, title: 'Transfers', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'swap-horizontal') }} />
      <Tab.Screen name="Dispatch" component={DispatchScreen} options={{ headerShown: true, title: 'Dispatch', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'truck-fast-outline') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings', tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'settings') }} />
    </Tab.Navigator>
  );
}
