import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string; // 'kg' | '%' etc.
  placeholder?: string;
}

export default function NumericInput({ label, value, onChangeText, suffix, placeholder }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-stone-500 text-[13px] mb-2 font-sansMedium">{label}</Text>
      <View className={`flex-row items-center bg-stone-100 rounded-2xl px-4 h-14 border ${isFocused ? 'border-amber-500 border-2' : 'border-stone-200 border'}`}>
        <TextInput
          className="flex-1 text-3xl font-displayBold text-stone-900 h-full"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || '0'}
          placeholderTextColor="#A8A29E"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {suffix ? <Text className="text-lg text-stone-400 ml-2 font-sansMedium">{suffix}</Text> : null}
      </View>
    </View>
  );
}
