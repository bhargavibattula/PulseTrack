import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import StatusBadge from '../../components/status/StatusBadge';
import EmptyState from '../../components/feedback/EmptyState';
import { api } from '../../services/api';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function SiloListScreen({ navigation }: any) {
  const [silos, setSilos] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSilos = useCallback(async () => {
    try {
      const res = await api.get('/silos');
      setSilos(res.data.data || []);
    } catch {
      // Non-blocking
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSilos();
    }, [loadSilos])
  );

  return (
    <ScreenContainer scroll={false}>
      <Text className="text-3xl font-displayExtraBold text-stone-900 mb-1">Silos & Locations</Text>
      <Text className="text-stone-500 font-sans text-sm mb-5">Storage capacity, stock and idle time</Text>
      
      <FlatList
        data={silos}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadSilos(); }} />}
        ListEmptyComponent={
          <EmptyState 
            iconName="silo" 
            title="No silos configured" 
            subtitle="There are no silos tracked in this unit yet." 
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('SiloDetail', { siloId: item._id })}
            className="bg-white border border-stone-200 rounded-[24px] p-5 mb-3.5 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View className="bg-amber-500/10 p-2.5 rounded-2xl mr-3">
                  <MaterialCommunityIcons name="silo" size={22} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="font-sansBold text-lg text-stone-900">{item.name}</Text>
                  <Text className="text-stone-400 font-sans text-xs">Code: {item.code}</Text>
                </View>
              </View>
              <StatusBadge status={item.status || 'EMPTY'} />
            </View>

            {/* Capacity Progress Bar */}
            <View className="bg-stone-100 h-2.5 rounded-full overflow-hidden mb-3">
              <View 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, item.fillPercentage || 0)}%` }} 
              />
            </View>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-stone-500 font-sans text-xs">
                Stored: <Text className="font-sansBold text-stone-900">
                  {item.currentQuantityTons != null
                    ? `${item.currentQuantityTons} T`
                    : `${(item.currentQuantityKg || 0).toLocaleString()} kg`}
                </Text>
              </Text>
              <Text className="text-stone-400 font-sans text-xs">
                Cap: {item.capacityKg ? `${(item.capacityKg / 1000).toFixed(0)} T` : 'N/A'} ({item.fillPercentage || 0}%)
              </Text>
            </View>

            {/* Idle Time Display */}
            <View className="flex-row items-center mt-1 pt-2 border-t border-stone-100">
              <Feather name="clock" size={12} color={item.idleTimeMinutes != null && item.idleTimeMinutes > 480 ? '#EF4444' : '#9CA3AF'} />
              <Text className={`ml-1.5 font-sans text-xs ${item.idleTimeMinutes != null && item.idleTimeMinutes > 480 ? 'text-red-500 font-sansBold' : 'text-stone-400'}`}>
                {item.idleTimeFormatted || 'No activity'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
