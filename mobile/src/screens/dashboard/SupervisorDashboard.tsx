import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { api, apiErrorMessage } from '../../services/api';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';

export default function SupervisorDashboard({ navigation }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/supervisor');
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
      <View className="p-4 pt-8 bg-sky-800 pb-6 rounded-b-3xl flex-row justify-between items-center">
        <View>
          <Text className="text-white text-2xl font-bold">Supervisor</Text>
          <Text className="text-sky-100 text-sm mt-1">Command Center</Text>
        </View>
        <TouchableOpacity onPress={logout} className="bg-sky-900 p-2 rounded-full">
          <Feather name="log-out" size={20} color="#bae6fd" />
        </TouchableOpacity>
      </View>

      <View className="p-4 space-y-6">

        {/* Quick Navigation Shortcuts */}
        <View className="flex-row space-x-3 mb-2">
          <TouchableOpacity 
            onPress={() => navigation.navigate('StockLedger')}
            className="flex-1 bg-sky-900 p-4 rounded-2xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-bold text-base">Stock Ledger</Text>
              <Text className="text-sky-200 text-xs">Audit History</Text>
            </View>
            <Feather name="book-open" size={22} color="#bae6fd" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('StockAdjustment')}
            className="flex-1 bg-amber-600 p-4 rounded-2xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-bold text-base">Adjustment</Text>
              <Text className="text-amber-100 text-xs">Manual Correction</Text>
            </View>
            <Feather name="edit-3" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Exceptions & Alerts */}
        <View>
          <Text className="text-lg font-bold text-stone-800 mb-3 flex-row items-center">
            <Feather name="bell" size={18} color="#dc2626" /> Action Required
          </Text>
          {data?.exceptions?.length > 0 ? (
            data.exceptions.map((ex: any) => (
              <TouchableOpacity 
                key={ex._id} 
                onPress={() => navigation.navigate('Yield')}
                className="bg-red-50 p-4 rounded-xl mb-3 border border-red-200 flex-row justify-between items-center"
              >
                <View>
                  <Text className="font-bold text-red-800">Pending Lab Yield</Text>
                  <Text className="text-red-600 text-xs mt-1">Ref: {ex._id.substring(0,6)} • {ex.processingQty} kg</Text>
                  <Text className="text-red-500 text-[10px] mt-0.5">{ex.process?.name} • Source: {ex.sourceLocation?.code}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#991b1b" />
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-emerald-50 p-4 rounded-xl items-center border border-emerald-200">
              <Feather name="check-circle" size={24} color="#059669" className="mb-2" />
              <Text className="text-emerald-700 font-bold">All caught up!</Text>
            </View>
          )}
        </View>

        {/* Global Stock Overview */}
        <View>
          <Text className="text-lg font-bold text-stone-800 mb-3">Unit Stock Overview</Text>
          <View className="flex-row flex-wrap justify-between">
            {data?.stock?.length > 0 ? (
              data.stock.map((s: any, index: number) => (
                <View key={index} className="bg-white w-[48%] p-4 rounded-xl mb-3 shadow-sm border border-stone-100">
                  <Text className="text-stone-500 text-xs uppercase font-bold tracking-wider mb-1">Mat: {s.materialId?.substring(0,6)}</Text>
                  <Text className="text-xl font-black text-sky-700">{s.netQuantity.toLocaleString()} <Text className="text-xs font-normal text-stone-400">kg</Text></Text>
                </View>
              ))
            ) : (
              <Text className="text-stone-500 text-sm">No stock on hand.</Text>
            )}
          </View>
        </View>

        {/* Silo / Location Status */}
        <View>
          <Text className="text-lg font-bold text-stone-800 mb-3">Location Status & Idle Time</Text>
          {data?.siloStatus?.map((loc: any) => {
            const idleHours = loc.lastActivityAt 
              ? Math.floor((new Date().getTime() - new Date(loc.lastActivityAt).getTime()) / (1000 * 3600))
              : 'Unknown';
            return (
              <View key={loc._id} className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-stone-100 flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="silo" size={24} color="#0369a1" />
                  <View className="ml-3">
                    <Text className="font-bold text-stone-800">{loc.name}</Text>
                    <Text className="text-stone-500 text-xs">Code: {loc.code} {loc.capacityKg ? `• ${loc.capacityKg.toLocaleString()} kg` : ''}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className={`text-xs font-bold ${idleHours !== 'Unknown' && idleHours > 24 ? 'text-amber-600' : 'text-stone-400'}`}>
                    {idleHours === 'Unknown' ? 'Never active' : `${idleHours} hrs idle`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Adjustments */}
        <View className="mt-4 mb-8">
          <PrimaryButton 
            label="Make Stock Adjustment" 
            iconName="edit-3" 
            onPress={() => navigation.navigate('StockAdjustment')} 
          />
        </View>

      </View>
    </ScrollView>
  );
}
