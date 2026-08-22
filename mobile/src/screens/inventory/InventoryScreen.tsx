import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import EmptyState from '../../components/feedback/EmptyState';
import { api } from '../../services/api';
import type { InventoryPool } from '../../types';

export default function InventoryScreen() {
  const [pools, setPools] = useState<InventoryPool[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get('/inventory').then((res) => setPools(res.data.data));
    }, [])
  );

  return (
    <ScreenContainer>
      <Text className="text-3xl font-displayExtraBold text-stone-900 mb-6">Inventory Pools</Text>
      
      {pools.length === 0 ? (
        <EmptyState 
          iconName="package-variant" 
          title="No inventory recorded" 
          subtitle="There is currently no inventory in this unit." 
        />
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {pools.map((p) => (
            <View key={p._id} className="bg-amber-50 rounded-[20px] px-5 py-4 w-[48%] mb-4 border border-amber-100">
              <Text className="text-stone-500 font-sansMedium text-xs mb-1">{p.poolType}</Text>
              <Text className="text-2xl font-displayBold text-amber-600">{p.quantityKg.toFixed(0)}</Text>
              <Text className="text-amber-600/70 text-[10px] font-sansBold">KG</Text>
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
