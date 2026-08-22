import React from 'react';
import { View, Text } from 'react-native';

export default function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
      <Text className="text-red-700 text-sm">{message}</Text>
    </View>
  );
}
