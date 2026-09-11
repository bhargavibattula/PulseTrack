import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { api, apiErrorMessage } from '../../services/api';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';

export default function OperatorDashboard({ navigation }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

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
        <ActivityIndicator size="large" color="#F59E0B" />
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
      <View className="p-6 pt-10 bg-white border-b border-stone-200 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-displayExtraBold text-stone-900">Operator</Text>
          <Text className="text-stone-500 font-sansMedium text-sm mt-0.5">{user?.name || 'Production Floor'}</Text>
        </View>
        <TouchableOpacity 
          onPress={logout} 
          className="bg-stone-100 p-2.5 rounded-full border border-stone-200"
        >
          <Feather name="log-out" size={18} color="#57534E" />
        </TouchableOpacity>
      </View>

      <View className="p-6 space-y-6">

        {/* Quick Action Shortcuts */}
        <View className="flex-row space-x-3 mb-2">
          <TouchableOpacity 
            onPress={() => navigation.navigate('Processing')}
            className="flex-1 bg-amber-500 p-4 rounded-2xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-sansBold text-base">New Transfer</Text>
              <Text className="text-amber-100 text-xs font-sans">Record Input</Text>
            </View>
            <Feather name="plus-circle" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Yield')}
            className="flex-1 bg-white border border-stone-200 p-4 rounded-2xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-stone-800 font-sansBold text-base">Lab Yield</Text>
              <Text className="text-stone-400 text-xs font-sans">Submit Lab %</Text>
            </View>
            <FontAwesome5 name="flask" size={18} color="#F59E0B" />
          </TouchableOpacity>
        </View>
        
        {/* Pending Lab Entries Section */}
        <View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[13px] font-sansBold text-stone-500 uppercase tracking-wide">Pending Lab Yields</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Yield')}>
              <Text className="text-amber-600 font-sansBold text-xs">Submit Lab →</Text>
            </TouchableOpacity>
          </View>

          {data?.pendingLabEntries?.length > 0 ? (
            data.pendingLabEntries.map((entry: any) => (
              <TouchableOpacity 
                key={entry._id} 
                onPress={() => navigation.navigate('Yield')}
                className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-stone-200 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="font-sansBold text-stone-900">
                    {entry.processingQty >= 1000 ? `${(entry.processingQty / 1000).toFixed(1)} tons` : `${entry.processingQty.toLocaleString()} kg`}
                    {entry.inputMoisture != null ? ` @ ${entry.inputMoisture}%` : ''}
                  </Text>
                  <Text className="text-stone-500 text-xs mt-0.5 font-sans">
                    {entry.process?.name || 'Process'} • {entry.sourceLocation?.name || 'Source'}
                    {entry.destinationLocation ? ` → ${entry.destinationLocation?.name}` : ''}
                  </Text>
                  {entry.inputMoisture != null && entry.adjustedInputQty != null && (
                    <Text className="text-amber-600 text-[10px] mt-0.5 font-sans">
                      Adjusted: {entry.adjustedInputQty >= 1000 ? `${(entry.adjustedInputQty / 1000).toFixed(2)} T` : `${entry.adjustedInputQty} kg`} (10% Std)
                    </Text>
                  )}
                </View>
                <View className="bg-amber-500/10 px-3 py-1.5 rounded-full">
                  <Text className="text-amber-700 text-xs font-sansBold">AWAITING YIELD</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white border border-stone-200 p-4 rounded-2xl items-center">
              <Text className="text-stone-400 font-sans text-sm">No pending lab entries.</Text>
            </View>
          )}
        </View>

        {/* Silo Status with Idle Time */}
        {data?.siloStatus?.length > 0 && (
          <View>
            <Text className="text-[13px] font-sansBold text-stone-500 uppercase tracking-wide mb-3">Silo Status & Idle Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {data.siloStatus.map((silo: any) => (
                <View 
                  key={silo._id} 
                  className={`bg-white border rounded-2xl p-3.5 mr-3 shadow-sm ${silo.idleTimeMinutes != null && silo.idleTimeMinutes > 480 ? 'border-red-200' : 'border-stone-200'}`}
                  style={{ width: 160 }}
                >
                  <View className="flex-row items-center mb-2">
                    <MaterialCommunityIcons name="silo" size={16} color="#F59E0B" />
                    <Text className="font-sansBold text-stone-800 text-xs ml-1.5 flex-1" numberOfLines={1}>{silo.name}</Text>
                  </View>
                  <Text className="font-displayBold text-amber-600 text-base">
                    {silo.currentQuantityTons != null ? `${silo.currentQuantityTons} T` : `${(silo.currentQuantityKg || 0).toLocaleString()} kg`}
                  </Text>
                  <View className="flex-row items-center mt-1.5">
                    <Feather name="clock" size={10} color={silo.idleTimeMinutes != null && silo.idleTimeMinutes > 480 ? '#EF4444' : '#9CA3AF'} />
                    <Text className={`ml-1 text-[10px] font-sans ${silo.idleTimeMinutes != null && silo.idleTimeMinutes > 480 ? 'text-red-500 font-sansBold' : 'text-stone-400'}`}>
                      {silo.idleTimeFormatted || 'No activity'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Operational Stock Summary Section */}
        <View>
          <Text className="text-[13px] font-sansBold text-stone-500 uppercase tracking-wide mb-3">Operational Stock Summary</Text>
          <View className="flex-row flex-wrap justify-between">
            {data?.operationalStock?.length > 0 ? (
              data.operationalStock.map((stock: any, index: number) => (
                <View key={index} className="bg-white w-[48%] p-3.5 rounded-2xl mb-3 shadow-sm border border-stone-200">
                  <Text className="text-stone-400 text-[10px] uppercase font-sansBold tracking-wider mb-1" numberOfLines={1}>
                    {stock.materialCode || stock.materialName || stock.materialId?.substring(0,6)}
                  </Text>
                  <Text className="text-xl font-displayBold text-amber-600" numberOfLines={1} adjustsFontSizeToFit>
                    {stock.netQuantityTons != null ? stock.netQuantityTons : (stock.netQuantity / 1000).toFixed(1)} <Text className="text-xs font-sans text-stone-400">tons</Text>
                  </Text>
                  <Text className="text-stone-400 text-[10px] font-sans mt-0.5">{stock.netQuantity.toLocaleString()} kg</Text>
                </View>
              ))
            ) : (
              <View className="w-full bg-white p-6 rounded-2xl items-center border border-stone-200">
                <Text className="text-stone-400 font-sans text-sm">No operational stock recorded.</Text>
              </View>
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
