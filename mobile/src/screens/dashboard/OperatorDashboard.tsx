import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { api, apiErrorMessage } from '../../services/api';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';

export default function OperatorDashboard({ navigation }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/operator');
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50 p-4">
        <Feather name="alert-circle" size={48} color="#dc2626" />
        <Text className="text-red-600 mt-4 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-stone-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4 pt-8 bg-teal-800 pb-6 rounded-b-3xl flex-row justify-between items-center">
        <View>
          <Text className="text-white text-2xl font-bold">Operator</Text>
          <Text className="text-teal-100 text-sm mt-1">Live Stock & Production Overview</Text>
        </View>
        <TouchableOpacity onPress={logout} className="bg-teal-900 p-2 rounded-full">
          <Feather name="log-out" size={20} color="#99f6e4" />
        </TouchableOpacity>
      </View>

      <View className="p-4 space-y-6">

        {/* Quick Action Shortcuts */}
        <View className="flex-row space-x-3 mb-2">
          <TouchableOpacity 
            onPress={() => navigation.navigate('Processing')}
            className="flex-1 bg-teal-700 p-4 rounded-2xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-bold text-base">New Transfer</Text>
              <Text className="text-teal-200 text-xs">Record Input</Text>
            </View>
            <Feather name="plus-circle" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Yield')}
            className="flex-1 bg-amber-600 p-4 rounded-2xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-bold text-base">Lab Yield</Text>
              <Text className="text-amber-100 text-xs">Submit Results</Text>
            </View>
            <Feather name="flask" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Pending Lab Entries Section */}
        <View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-stone-800">Pending Lab Yields</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Yield')}>
              <Text className="text-teal-700 font-bold text-xs">Submit Lab →</Text>
            </TouchableOpacity>
          </View>

          {data?.pendingLabEntries?.length > 0 ? (
            data.pendingLabEntries.map((entry: any) => (
              <TouchableOpacity 
                key={entry._id} 
                onPress={() => navigation.navigate('Yield')}
                className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-stone-100 flex-row justify-between items-center"
              >
                <View>
                  <Text className="font-bold text-teal-700">Ref: {entry._id.substring(0,6)}</Text>
                  <Text className="text-stone-500 text-sm mt-1">Input Qty: {entry.processingQty} kg</Text>
                  <Text className="text-stone-400 text-xs mt-0.5">{entry.process?.name || 'Process'} • Source: {entry.sourceLocation?.code || 'N/A'}</Text>
                </View>
                <View className="bg-amber-100 px-3 py-1 rounded-full">
                  <Text className="text-amber-800 text-xs font-bold">AWAITING YIELD</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-stone-100 p-4 rounded-xl items-center border border-dashed border-stone-300">
              <Text className="text-stone-500">No pending lab entries.</Text>
            </View>
          )}
        </View>

        {/* Operational Stock Summary Section */}
        <View>
          <Text className="text-lg font-bold text-stone-800 mb-3">Operational Stock Summary</Text>
          <View className="flex-row flex-wrap justify-between">
            {data?.operationalStock?.length > 0 ? (
              data.operationalStock.map((stock: any, index: number) => (
                <View key={index} className="bg-white w-[48%] p-4 rounded-xl mb-3 shadow-sm border border-stone-100">
                  <Text className="text-stone-500 text-xs uppercase font-bold tracking-wider mb-1">Material ID</Text>
                  <Text className="text-stone-800 font-bold mb-2">{stock.materialId?.substring(0,6) || 'Unknown'}</Text>
                  <Text className="text-2xl font-black text-teal-700">{stock.netQuantity.toLocaleString()} <Text className="text-sm font-normal text-stone-400">kg</Text></Text>
                </View>
              ))
            ) : (
              <View className="w-full bg-stone-100 p-4 rounded-xl items-center border border-dashed border-stone-300">
                <Text className="text-stone-500">No operational stock recorded.</Text>
              </View>
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
