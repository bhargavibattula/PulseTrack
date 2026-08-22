import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenContainer({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Body className="flex-1 px-5 pt-4" contentContainerStyle={scroll ? { paddingBottom: 40 } : undefined}>
        {children}
      </Body>
    </SafeAreaView>
  );
}
