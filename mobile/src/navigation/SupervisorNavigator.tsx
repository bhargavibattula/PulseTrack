import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SupervisorDashboard from '../screens/dashboard/SupervisorDashboard';
import StockLedgerScreen from '../screens/inventory/StockLedgerScreen';
import StockAdjustmentScreen from '../screens/inventory/StockAdjustmentScreen';
import YieldScreen from '../screens/yield/YieldScreen';

const Stack = createNativeStackNavigator();

export default function SupervisorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboard} />
      <Stack.Screen name="StockLedger" component={StockLedgerScreen} options={{ headerShown: true, title: 'Stock Ledger' }} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} options={{ headerShown: true, title: 'Stock Adjustment' }} />
      <Stack.Screen name="Yield" component={YieldScreen} options={{ headerShown: true, title: 'Lab Yield Entry' }} />
    </Stack.Navigator>
  );
}
