import React, { useCallback, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import StatusBadge from '../../components/status/StatusBadge';
import { api, apiErrorMessage } from '../../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SiloDetailScreen({ route }: any) {
  const { siloId } = route.params;
  const [silo, setSilo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get(`/silos/${siloId}`).then((res) => {
      setSilo(res.data.data.silo);
      setTransactions(res.data.data.transactions || []);
    }).catch(err => {
      setError(apiErrorMessage(err));
    });
  }, [siloId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!silo) return null;

  return (
    <ScreenContainer scroll={false}>
      <View className="bg-white border border-stone-200 rounded-[24px] p-5 mb-5 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="bg-amber-500/10 p-2.5 rounded-2xl mr-3">
              <MaterialCommunityIcons name="silo" size={24} color="#F59E0B" />
            </View>
            <View>
              <Text className="text-xl font-sansBold text-stone-900">{silo.name}</Text>
              <Text className="text-stone-400 font-sans text-xs">Code: {silo.code}</Text>
            </View>
          </View>
          <StatusBadge status={silo.status || 'EMPTY'} />
        </View>

        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-stone-100">
          <Text className="text-stone-500 font-sans text-sm">Capacity</Text>
          <Text className="font-displayBold text-stone-900 text-base">{silo.capacityKg ? `${silo.capacityKg.toLocaleString()} kg` : 'N/A'}</Text>
        </View>
      </View>

      <Text className="text-stone-500 font-sansBold text-[13px] uppercase tracking-wide mb-3">Location Stock Activity</Text>
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <View className="bg-white p-6 rounded-2xl items-center border border-dashed border-stone-200">
            <Text className="text-stone-400 font-sans text-sm">No transaction movements recorded for this silo.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCredit = item.direction === 'IN';
          return (
            <View className="bg-white border border-stone-200 rounded-2xl p-4 mb-2.5 shadow-sm flex-row justify-between items-center">
              <View>
                <View className="flex-row items-center space-x-2">
                  <View className={`px-2 py-0.5 rounded ${isCredit ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    <Text className={`text-[10px] font-sansBold ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {item.transactionType} ({item.direction})
                    </Text>
                  </View>
                  <Text className="text-stone-400 font-sans text-xs">
                    {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="text-stone-700 font-sansBold text-xs mt-1">
                  Material: {item.material?.name || 'Item'} • By {item.createdBy?.name || 'User'}
                </Text>
              </View>
              <Text className={`font-displayBold text-base ${isCredit ? 'text-emerald-600' : 'text-stone-900'}`}>
                {isCredit ? '+' : '-'}{item.quantity?.toLocaleString()} kg
              </Text>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}
