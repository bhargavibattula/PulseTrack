import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenContainer({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView 
      className="flex-1 bg-stone-50" 
      edges={['top', 'left', 'right']}
    >
      <Body 
        className="flex-1 px-5 pt-3" 
        contentContainerStyle={scroll ? { paddingBottom: Platform.OS === 'ios' ? 50 : 30 } : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}
