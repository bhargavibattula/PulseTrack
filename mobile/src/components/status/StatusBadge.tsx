import React from 'react';
import { View, Text } from 'react-native';
import type { SiloStatus } from '../../types';

const STYLES: Record<SiloStatus, { bg: string; text: string; dot: string; label: string }> = {
  EMPTY: { bg: 'bg-stone-400/10', text: 'text-stone-400', dot: 'bg-stone-400', label: 'Empty' },
  FILLING: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500', label: 'Filling' },
  FULL_SITTING: { bg: 'bg-green-600/10', text: 'text-green-600', dot: 'bg-green-600', label: 'Full' },
  EMPTYING: { bg: 'bg-orange-600/10', text: 'text-orange-600', dot: 'bg-orange-600', label: 'Emptying' },
};

export default function StatusBadge({ status }: { status: SiloStatus }) {
  const s = STYLES[status] || STYLES.EMPTY;
  return (
    <View className={`flex-row items-center px-3 py-1 rounded-full ${s.bg}`}>
      <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`} />
      <Text className={`text-xs font-sansBold ${s.text}`}>{s.label}</Text>
    </View>
  );
}
