import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import AuthNavigator from './AuthNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import OperatorNavigator from './OperatorNavigator';

// Login -> role detection -> route to Supervisor or Operator navigator
export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? <AuthNavigator /> : user.role === 'SUPERVISOR' ? <SupervisorNavigator /> : <OperatorNavigator />}
    </NavigationContainer>
  );
}
