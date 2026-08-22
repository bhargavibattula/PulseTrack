import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import type { YieldResult } from '../../types';

// Manager dashboard: consolidated view + unit comparison (design doc Section D.3 / SRS §29, §46).
export default function ManagerDashboard({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [yield7d, setYield7d] = useState<YieldResult | null>(null);
  const [yield30d, setYield30d] = useState<YieldResult | null>(null);
  const [variance, setVariance] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [y7, y30, varRes, unitsRes] = await Promise.all([
        api.get('/yield?window=7d'),
        api.get('/yield?window=30d'),
        api.get('/yield/variance?window=30d'),
        api.get('/units'),
      ]);
      setYield7d(y7.data.data);
      setYield30d(y30.data.data);
      setVariance(varRes.data.data);
      setUnits(unitsRes.data.data);
    } catch (err) {
      // non-blocking
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
        <Text className="text-3xl font-displayExtraBold text-stone-900">Overview</Text>
        <Text className="text-stone-500 mb-6 font-sansMedium">{user?.name} · Manager</Text>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-amber-500 rounded-[20px] p-5 shadow-sm">
            <Text className="text-amber-50 text-[13px] font-sansMedium mb-1">7-Day Yield</Text>
            <Text className="text-white text-3xl font-displayBold">{yield7d?.yieldPct != null ? `${yield7d.yieldPct}%` : '—'}</Text>
          </View>
          <View className="flex-1 bg-stone-900 rounded-[20px] p-5 shadow-sm">
            <Text className="text-stone-400 text-[13px] font-sansMedium mb-1">30-Day Yield</Text>
            <Text className="text-white text-3xl font-displayBold">{yield30d?.yieldPct != null ? `${yield30d.yieldPct}%` : '—'}</Text>
          </View>
        </View>

        <View className="bg-amber-50 rounded-[20px] p-5 mb-6 border border-amber-100">
          <Text className="text-stone-500 text-[13px] font-sansMedium mb-3 uppercase tracking-wide">Expected vs Actual (30d)</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-stone-400 text-[11px] font-sans uppercase">Expected</Text>
              <Text className="text-stone-900 font-sansBold text-base">{variance?.expectedPct != null ? `${variance.expectedPct}%` : '—'}</Text>
            </View>
            <View>
              <Text className="text-stone-400 text-[11px] font-sans uppercase">Variance</Text>
              <Text className="text-stone-900 font-sansBold text-base">{variance?.variance != null ? `${variance.variance}%` : '—'}</Text>
            </View>
          </View>
        </View>

        <Text className="text-stone-500 text-[13px] font-sansBold mb-2 uppercase tracking-wide">Units</Text>
        <View className="mb-6">
          {units.map((u) => (
            <View key={u._id} className="bg-white border border-stone-200 rounded-[20px] px-5 py-4 mb-3 shadow-sm flex-row items-center justify-between">
              <Text className="font-sansBold text-stone-900 text-base">{u.name}</Text>
              <Text className="text-stone-400 text-[13px] font-sansMedium">{u.code}</Text>
            </View>
          ))}
        </View>

        <View className="gap-3 mb-8">
          <PrimaryButton label="Configuration" onPress={() => navigation.navigate('Configuration')} iconName="sliders" />
          <PrimaryButton label="Audit Logs" onPress={() => navigation.navigate('AuditLogs')} variant="outline" iconName="file-text" />
          <PrimaryButton label="Laboratory" onPress={() => navigation.navigate('Laboratory')} variant="outline" iconName="thermometer" />
          <PrimaryButton label="Log Out" onPress={() => logout()} variant="danger" iconName="log-out" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
