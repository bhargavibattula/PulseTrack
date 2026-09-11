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
import MenuScreen from '../screens/menu/MenuScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OperatorDashboard" component={OperatorDashboard} />
      <Stack.Screen name="Yield" component={YieldScreen} options={{ headerShown: true, title: 'Lab Yield Entry' }} />
      <Stack.Screen name="NewIntake" component={NewIntakeScreen} options={{ headerShown: true, title: 'New Intake' }} />
      <Stack.Screen name="Intake" component={IntakeListScreen} options={{ headerShown: true, title: 'Raw Intake' }} />
      <Stack.Screen name="Shifts" component={ShiftScreen} options={{ headerShown: true, title: 'Shift Summary' }} />
      <Stack.Screen name="ProductionDetail" component={ProductionDetailScreen} options={{ headerShown: true, title: 'Production Run Details' }} />
      <Stack.Screen name="NewTransfer" component={ProductionTransferScreen} options={{ headerShown: true, title: 'New Production Transfer' }} />
      <Stack.Screen name="SiloDetail" component={SiloDetailScreen} options={{ headerShown: true, title: 'Silo Details' }} />
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

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="Intake" component={IntakeListScreen} options={{ headerShown: true, title: 'Raw Intake Register' }} />
      <Stack.Screen name="NewIntake" component={NewIntakeScreen} options={{ headerShown: true, title: 'New Intake' }} />
      <Stack.Screen name="ByProducts" component={ByproductsScreen} options={{ headerShown: true, title: 'By-products Management' }} />
      <Stack.Screen name="Transfers" component={TransfersScreen} options={{ headerShown: true, title: 'Inter-Unit Transfers' }} />
      <Stack.Screen name="Dispatch" component={DispatchScreen} options={{ headerShown: true, title: 'Finished Dispatch' }} />
      <Stack.Screen name="Shifts" component={ShiftScreen} options={{ headerShown: true, title: 'Shift Summary' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
    </Stack.Navigator>
  );
}

const renderIcon = (focused: boolean, color: string, Provider: any, name: string) => (
  <View className="items-center justify-center pt-1.5">
    {focused && <View className="w-1.5 h-1.5 bg-amber-500 rounded-full absolute top-0" />}
    <Provider name={name} size={22} color={color} />
  </View>
);

export default function OperatorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D97706',
        tabBarInactiveTintColor: '#78716C',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E7E5E4',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ 
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'home') 
        }} 
      />
      <Tab.Screen 
        name="Processing" 
        component={ProcessingStack} 
        options={{ 
          tabBarLabel: 'Processing',
          tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'layers') 
        }} 
      />
      <Tab.Screen 
        name="Silos" 
        component={SilosStack} 
        options={{ 
          tabBarLabel: 'Silos',
          tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'silo') 
        }} 
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ 
          headerShown: true, 
          title: 'Live Inventory', 
          tabBarLabel: 'Stock',
          tabBarIcon: ({ focused, color }) => renderIcon(focused, color, MaterialCommunityIcons, 'package-variant') 
        }} 
      />
      <Tab.Screen 
        name="Operations" 
        component={MoreStack} 
        options={{ 
          tabBarLabel: 'More',
          tabBarIcon: ({ focused, color }) => renderIcon(focused, color, Feather, 'grid') 
        }} 
      />
    </Tab.Navigator>
  );
}
