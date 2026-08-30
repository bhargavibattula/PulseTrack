import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import StatusBadge from '../../components/status/StatusBadge';
import EmptyState from '../../components/feedback/EmptyState';
import { api } from '../../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      <Text className="text-stone-500 font-sans text-sm mb-5">Storage capacity and real-time fill status</Text>
      
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
          <View
            className="bg-white border border-stone-200 rounded-[24px] p-5 mb-3.5 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="bg-amber-500/10 p-2.5 rounded-2xl mr-3">
                  <MaterialCommunityIcons name="silo" size={22} color="#F59E0B" />
                </View>
                <View>
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

            <View className="flex-row justify-between items-center">
              <Text className="text-stone-500 font-sans text-xs">
                Stored: <Text className="font-sansBold text-stone-900">{(item.currentQuantityKg || 0).toLocaleString()} kg</Text>
              </Text>
              <Text className="text-stone-400 font-sans text-xs">
                Cap: {item.capacityKg ? `${item.capacityKg.toLocaleString()} kg` : 'N/A'} ({item.fillPercentage || 0}%)
              </Text>
            </View>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
