import React, { useCallback, useState } from 'react';
import { View, Text, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { InventoryPool, Silo } from '../../types';
import StatusBadge from '../../components/status/StatusBadge';
import PrimaryButton from '../../components/feedback/PrimaryButton';

// Operator dashboard: intentionally simple, unit-scoped only, no cross-unit
// analytics (design doc Section D.2 / SRS §30).
export default function OperatorDashboard({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [pools, setPools] = useState<InventoryPool[]>([]);
  const [silos, setSilos] = useState<Silo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, siloRes] = await Promise.all([api.get('/inventory'), api.get('/silos')]);
      setPools(inv.data.data);
      setSilos(siloRes.data.data);
    } catch (err) {
      // dashboard failures are non-blocking — leave last-known state on screen
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView
        className="flex-1 px-5 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-3xl font-displayExtraBold text-stone-900">My Unit</Text>
        <Text className="text-stone-500 mb-6 font-sansMedium">{user?.name} · Operator</Text>

        <Text className="text-stone-500 text-[13px] font-sansBold mb-2 uppercase tracking-wide">Current Inventory</Text>
        <View className="flex-row flex-wrap justify-between mb-6">
          {pools.length === 0 && <Text className="text-stone-400 font-sans">No inventory recorded yet.</Text>}
          {pools.map((p) => (
            <View key={p._id} className="bg-amber-50 rounded-[20px] px-5 py-4 w-[48%] mb-4 border border-amber-100">
              <Text className="text-stone-500 text-xs font-sansMedium mb-1">{p.poolType}</Text>
              <Text className="text-2xl font-displayBold text-amber-600">{p.quantityKg.toFixed(0)}</Text>
              <Text className="text-amber-600/70 text-[10px] font-sansBold">KG</Text>
            </View>
          ))}
        </View>

        <Text className="text-stone-500 text-[13px] font-sansBold mb-2 uppercase tracking-wide">Silo Status</Text>
        <View className="mb-6">
          {silos.map((s) => (
            <View key={s._id} className="flex-row items-center justify-between bg-white border border-stone-200 rounded-[20px] px-5 py-4 mb-3 shadow-sm">
              <View>
                <Text className="font-sansBold text-stone-900 text-base">{s.name}</Text>
                <Text className="text-stone-400 text-[13px] font-sansMedium">{s.currentQuantityKg.toFixed(0)} kg</Text>
              </View>
              <StatusBadge status={s.status} />
            </View>
          ))}
        </View>

        <View className="gap-3 mb-8">
          <PrimaryButton label="New Intake" onPress={() => navigation.navigate('NewIntake')} iconName="plus" />
          <PrimaryButton label="Submit Shift Summary" onPress={() => navigation.navigate('Shifts')} variant="outline" iconName="clipboard" />
          <PrimaryButton label="Log Out" onPress={() => logout()} variant="danger" iconName="log-out" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
