import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function ProductionListScreen({ navigation }: any) {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransfers = useCallback(async () => {
    try {
      const res = await api.get('/production/transfers');
      setTransfers(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransfers();
    }, [loadTransfers])
  );

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-3xl font-displayExtraBold text-stone-900">Production Runs</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NewTransfer')}
          className="bg-amber-500 p-2.5 rounded-2xl flex-row items-center space-x-1.5"
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text className="text-white font-sansBold text-xs ml-1">New Transfer</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-stone-500 font-sans text-sm mb-5">History of all processing passes and yields</Text>

      {error ? (
        <View className="bg-red-50 p-4 rounded-2xl border border-red-200 mb-4">
          <Text className="text-red-700 text-xs font-sans">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={transfers}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTransfers(); }} />}
        ListEmptyComponent={
          <View className="bg-white p-8 rounded-2xl items-center justify-center border border-dashed border-stone-200 mt-6">
            <Feather name="layers" size={36} color="#a8a29e" />
            <Text className="text-stone-400 font-sans mt-2">No production runs recorded yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ProductionDetail', { transferId: item._id })}
            className="bg-white border border-stone-200 rounded-[22px] p-4 mb-3 shadow-sm"
          >
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="font-sansBold text-stone-900 text-base">Ref: {item._id.substring(0, 8)}</Text>
              <View className={`px-2.5 py-0.5 rounded-md ${item.status === 'COMPLETED' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                <Text className={`text-[10px] font-sansBold ${item.status === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text className="text-stone-700 font-sansBold text-sm">
              {item.process?.name || 'Process Pass'} • {item.shift?.name || 'Shift'}
            </Text>

            <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-stone-100">
              <Text className="text-stone-500 font-sans text-xs">
                Source: <Text className="font-sansBold text-stone-800">{item.sourceLocation?.name || 'Silo'}</Text>
              </Text>
              <Text className="text-stone-900 font-displayBold text-sm">
                {item.processingQty?.toLocaleString()} kg
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
