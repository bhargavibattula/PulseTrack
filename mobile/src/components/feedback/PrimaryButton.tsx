import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  iconName?: keyof typeof Feather.glyphMap;
  className?: string;
}

export default function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary', iconName, className = '' }: Props) {
  const base = 'rounded-[16px] h-[52px] flex-row items-center justify-center mb-3 shadow-sm';
  const variants: Record<string, string> = {
    primary: 'bg-amber-500',
    secondary: 'bg-stone-100 border border-stone-200',
    danger: 'bg-red-50 text-red-600',
    outline: 'bg-white border border-stone-200',
  };
  
  let textColor = 'text-white';
  let iconColor = '#ffffff';

  if (variant === 'secondary' || variant === 'outline') {
    textColor = 'text-stone-700';
    iconColor = '#44403C'; // stone-700
  } else if (variant === 'danger') {
    textColor = 'text-red-600';
    iconColor = '#DC2626'; // red-600
  }

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {iconName && <Feather name={iconName} size={18} color={iconColor} />}
          <Text className={`text-base font-sansBold tracking-wide ${iconName ? 'ml-2.5' : ''} ${textColor}`}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
