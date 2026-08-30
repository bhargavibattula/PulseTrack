import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import EmptyState from '../../components/feedback/EmptyState';
import { api } from '../../services/api';

export default function InventoryScreen() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStock = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/operator');
      setStocks(res.data.data?.operationalStock || []);
    } catch {
      // Non-blocking
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStock();
    }, [loadStock])
  );

  return (
    <ScreenContainer>
      <Text className="text-3xl font-displayExtraBold text-stone-900 mb-2">Live Inventory</Text>
      <Text className="text-stone-500 font-sans text-sm mb-6">Real-time stock balance calculated from transaction ledger</Text>
      
      {stocks.length === 0 ? (
        <EmptyState 
          iconName="package-variant" 
          title="No stock on hand" 
          subtitle="There is currently no inventory recorded in this unit." 
        />
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {stocks.map((item, index) => (
            <View key={index} className="bg-white rounded-[24px] p-5 w-[48%] mb-4 border border-stone-200 shadow-sm">
              <Text className="text-stone-400 font-sansBold text-[11px] uppercase tracking-wider mb-1">
                {item.materialCode || 'MATERIAL'}
              </Text>
              <Text className="text-stone-800 font-sansBold text-sm mb-2" numberOfLines={1}>
                {item.materialName}
              </Text>
              <Text className="text-2xl font-displayBold text-amber-600">
                {item.netQuantity.toLocaleString()}
              </Text>
              <Text className="text-stone-400 text-[11px] font-sansBold mt-0.5">
                {item.unitOfMeasure || 'KG'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
