import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';

interface Props {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ iconName, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center p-6 mt-10">
      <View className="w-24 h-24 rounded-full bg-amber-100 items-center justify-center mb-6">
        <MaterialCommunityIcons name={iconName} size={64} color="#FBBF24" />
      </View>
      <Text className="text-base font-sansBold text-stone-900 mb-2 text-center">{title}</Text>
      <Text className="text-[13px] font-sans text-stone-500 text-center mb-8">{subtitle}</Text>
      {actionLabel && onAction && (
        <View className="w-full">
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}
