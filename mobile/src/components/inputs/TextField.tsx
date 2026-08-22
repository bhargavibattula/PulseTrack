import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
}

export default function TextField({ label, ...rest }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-stone-500 text-[13px] mb-2 font-sansMedium">{label}</Text>
      <TextInput
        className={`bg-stone-100 rounded-2xl px-4 h-14 border text-base font-sans text-stone-900 ${isFocused ? 'border-amber-500 border-2' : 'border-stone-200 border'}`}
        placeholderTextColor="#A8A29E"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}
      />
    </View>
  );
}
