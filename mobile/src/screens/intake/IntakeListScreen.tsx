import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import { api } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function IntakeListScreen({ navigation }: any) {
  const [intakes, setIntakes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadIntakes = useCallback(async () => {
    try {
      const res = await api.get('/intake');
      setIntakes(res.data.data || []);
    } catch {
      // Non-blocking
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIntakes();
    }, [loadIntakes])
  );

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-3xl font-displayExtraBold text-stone-900">Raw Intake</Text>
        <View className="bg-amber-500/10 p-2.5 rounded-2xl">
          <Feather name="truck" size={20} color="#F59E0B" />
        </View>
      </View>
      <Text className="text-stone-500 font-sans text-sm mb-5">Incoming raw toor arrivals and moisture deductions</Text>

      <FlatList
        data={intakes}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadIntakes(); }} />}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="bg-white p-8 rounded-2xl items-center justify-center border border-dashed border-stone-200 mt-6">
            <Feather name="truck" size={36} color="#a8a29e" />
            <Text className="text-stone-400 font-sans mt-2">No intake records yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white border border-stone-200 rounded-[22px] p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="font-sansBold text-stone-900 text-base">{item.vehicleNumber}</Text>
              <Text className="text-stone-400 font-sans text-xs">{new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <View>
                <Text className="text-stone-400 text-[10px] uppercase font-sansBold">Moisture (10% Std)</Text>
                <Text className="text-stone-700 font-sansBold text-xs">{item.moisturePct}% ({item.moistureDeductionKg || 0} kg ded.)</Text>
              </View>
              <View className="items-end">
                <Text className="text-stone-400 text-[10px] uppercase font-sansBold">Adjusted Net</Text>
                <Text className="text-amber-600 font-displayBold text-base">{item.adjustedNetWeightKg?.toLocaleString()} kg</Text>
              </View>
            </View>
          </View>
        )}
      />
      <View className="absolute bottom-4 left-5 right-5">
        <PrimaryButton label="New Intake Entry" onPress={() => navigation.navigate('NewIntake')} iconName="plus" />
      </View>
    </ScreenContainer>
  );
}
