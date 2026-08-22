import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import StatusBadge from '../../components/status/StatusBadge';
import EmptyState from '../../components/feedback/EmptyState';
import { api } from '../../services/api';
import type { Silo } from '../../types';

export default function SiloListScreen({ navigation }: any) {
  const [silos, setSilos] = useState<Silo[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get('/silos').then((res) => setSilos(res.data.data));
    }, [])
  );

  return (
    <ScreenContainer scroll={false}>
      <Text className="text-3xl font-displayExtraBold text-stone-900 mb-4">Silos</Text>
      <FlatList
        data={silos}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <EmptyState 
            iconName="silo" 
            title="No silos configured" 
            subtitle="There are no silos tracked in this unit yet." 
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center justify-between bg-white border border-stone-200 rounded-[20px] px-5 py-4 mb-3 shadow-sm"
            onPress={() => navigation.navigate('SiloDetail', { siloId: item._id })}
          >
            <View>
              <Text className="font-sansBold text-lg text-stone-900">{item.name}</Text>
              <Text className="text-stone-400 font-sansMedium text-[13px]">{item.currentQuantityKg.toFixed(0)} kg · {item.materialType || '—'}</Text>
            </View>
            <StatusBadge status={item.status} />
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
