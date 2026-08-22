import React, { useCallback, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import { api } from '../../services/api';
import type { Intake } from '../../types';

export default function IntakeListScreen({ navigation }: any) {
  const [intakes, setIntakes] = useState<Intake[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get('/intake').then((res) => setIntakes(res.data.data));
    }, [])
  );

  return (
    <ScreenContainer scroll={false}>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-4">Intake History</Text>
      <FlatList
        data={intakes}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text className="text-stone-400 font-sans">No intake records yet.</Text>}
        renderItem={({ item }) => (
          <View className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
            <View className="flex-row justify-between">
              <Text className="font-sansBold text-stone-900 font-sansBold">{item.vehicleNumber}</Text>
              <Text className="text-stone-500 font-sansMedium text-xs">{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text className="text-stone-500 font-sansMedium text-sm mt-1">
              {item.grossWeightKg} kg gross · {item.moisturePct}% moisture → {item.adjustedNetWeightKg} kg adjusted
            </Text>
          </View>
        )}
      />
      <PrimaryButton label="New Intake" onPress={() => navigation.navigate('NewIntake')} />
    </ScreenContainer>
  );
}
