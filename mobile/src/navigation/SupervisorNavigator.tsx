import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SupervisorDashboard from '../screens/dashboard/SupervisorDashboard';
import StockLedgerScreen from '../screens/inventory/StockLedgerScreen';
import StockAdjustmentScreen from '../screens/inventory/StockAdjustmentScreen';
import YieldScreen from '../screens/yield/YieldScreen';
import AuditLogsScreen from '../screens/audit/AuditLogsScreen';
import UserListScreen from '../screens/users/UserListScreen';
import CreateUserScreen from '../screens/users/CreateUserScreen';

const Stack = createNativeStackNavigator();

export default function SupervisorNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboard} />
      <Stack.Screen name="StockLedger" component={StockLedgerScreen} options={{ headerShown: true, title: 'Stock Ledger' }} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} options={{ headerShown: true, title: 'Stock Adjustment' }} />
      <Stack.Screen name="Yield" component={YieldScreen} options={{ headerShown: true, title: 'Lab Yield Entry' }} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ headerShown: true, title: 'Audit Logs' }} />
      <Stack.Screen name="UserList" component={UserListScreen} options={{ headerShown: true, title: 'Team Profiles' }} />
      <Stack.Screen name="CreateUser" component={CreateUserScreen} options={{ headerShown: true, title: 'Create Profile' }} />
    </Stack.Navigator>
  );
}
