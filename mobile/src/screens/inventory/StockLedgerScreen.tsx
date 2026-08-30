import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function StockLedgerScreen() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await api.get('/stock/ledger');
      setLedger(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLedger();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCredit = item.direction === 'IN';
    return (
      <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-stone-100 flex-row justify-between items-center">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center space-x-2">
            <View className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              <Text className={`text-[10px] font-bold ${isCredit ? 'text-emerald-800' : 'text-rose-800'}`}>
                {item.transactionType} ({item.direction})
              </Text>
            </View>
            <Text className="text-xs text-stone-400">
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <Text className="font-bold text-stone-800 text-sm mt-1">
            {item.location?.name || 'Location'} ({item.location?.code || 'N/A'})
          </Text>
          <Text className="text-stone-500 text-xs mt-0.5">
            Material: {item.material?.name || item.material?.code || 'Material'} • User: {item.createdBy?.name || 'User'}
          </Text>
        </View>

        <View className="items-end">
          <Text className={`text-base font-extrabold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isCredit ? '+' : '-'}{item.quantity.toLocaleString()} <Text className="text-xs font-normal text-stone-400">kg</Text>
          </Text>
          <Text className="text-[10px] text-stone-400 mt-1">
            Ref: {item.referenceType?.substring(0, 10)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-2xl font-bold text-stone-900">Stock Ledger</Text>
          <Text className="text-stone-500 text-xs">Immutable audit trail of all physical movements</Text>
        </View>
        <Feather name="book-open" size={24} color="#0f766e" />
      </View>

      {error ? (
        <View className="bg-red-50 p-4 rounded-xl border border-red-200 mb-4">
          <Text className="text-red-700 text-xs">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={ledger}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="bg-white p-8 rounded-2xl items-center justify-center border border-dashed border-stone-200 mt-8">
            <Feather name="inbox" size={40} color="#a8a29e" />
            <Text className="text-stone-500 font-medium mt-3">No stock transactions posted yet.</Text>
          </View>
        }
      />
    </View>
  );
}
