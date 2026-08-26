import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import PrimaryButton from '../../components/feedback/PrimaryButton';

// Manager dashboard: consolidated view + unit comparison (design doc Section D.3 / SRS §29, §46).
// Uses the aggregated /dashboard/manager endpoint to avoid 8+ waterfall API calls.
export default function ManagerDashboard({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/dashboard/manager');
      setData(res.data);
    } catch (err) {
      // non-blocking — fall back to separate calls
      try {
        const [y7, y30, varRes, unitsRes] = await Promise.all([
          api.get('/yield?window=7d'),
          api.get('/yield?window=30d'),
          api.get('/yield/variance?window=30d'),
          api.get('/units'),
        ]);
        setData({
          yield7d: y7.data.data,
          yield30d: y30.data.data,
          expectedPct: varRes.data.data?.expectedPct,
          variance30d: varRes.data.data?.variance,
          units: unitsRes.data.data.map((u: any) => ({ ...u, intake: {}, dispatch: {}, yieldPct: null })),
          totalAdjustedIntake: 0,
          totalDispatched: 0,
          totalInventory: 0,
          inventoryByPool: {},
        });
      } catch {
        // leave empty
      }
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

  const fmt = (n: number | null | undefined) => (n != null ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—');
  const fmtPct = (n: number | null | undefined) => (n != null ? `${n}%` : '—');

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView
        className="flex-1 px-5 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-3xl font-displayExtraBold text-stone-900">Overview</Text>
        <Text className="text-stone-500 mb-6 font-sansMedium">{user?.name} · Manager</Text>

        {/* Yield Cards */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-amber-500 rounded-[20px] p-5 shadow-sm">
            <Text className="text-amber-50 text-[13px] font-sansMedium mb-1">7-Day Yield</Text>
            <Text className="text-white text-3xl font-displayBold">{fmtPct(data?.yield7d?.yieldPct)}</Text>
          </View>
          <View className="flex-1 bg-stone-900 rounded-[20px] p-5 shadow-sm">
            <Text className="text-stone-400 text-[13px] font-sansMedium mb-1">30-Day Yield</Text>
            <Text className="text-white text-3xl font-displayBold">{fmtPct(data?.yield30d?.yieldPct)}</Text>
          </View>
        </View>

        {/* Expected vs Actual */}
        <View className="bg-amber-50 rounded-[20px] p-5 mb-4 border border-amber-100">
          <Text className="text-stone-500 text-[13px] font-sansMedium mb-3 uppercase tracking-wide">Expected vs Actual (30d)</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-stone-400 text-[11px] font-sans uppercase">Expected</Text>
              <Text className="text-stone-900 font-sansBold text-base">{fmtPct(data?.expectedPct)}</Text>
            </View>
            <View>
              <Text className="text-stone-400 text-[11px] font-sans uppercase">Actual</Text>
              <Text className="text-stone-900 font-sansBold text-base">{fmtPct(data?.yield30d?.yieldPct)}</Text>
            </View>
            <View>
              <Text className="text-stone-400 text-[11px] font-sans uppercase">Variance</Text>
              <Text className={`font-sansBold text-base ${(data?.variance30d ?? 0) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {data?.variance30d != null ? `${data.variance30d > 0 ? '+' : ''}${data.variance30d}%` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Figures */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-[20px] p-4 border border-stone-200 shadow-sm">
            <Text className="text-stone-400 text-[11px] font-sans uppercase mb-1">Total Intake</Text>
            <Text className="text-stone-900 text-xl font-displayBold">{fmt(data?.totalAdjustedIntake)}</Text>
            <Text className="text-stone-400 text-[10px] font-sansBold">KG (ADJ)</Text>
          </View>
          <View className="flex-1 bg-white rounded-[20px] p-4 border border-stone-200 shadow-sm">
            <Text className="text-stone-400 text-[11px] font-sans uppercase mb-1">Dispatched</Text>
            <Text className="text-stone-900 text-xl font-displayBold">{fmt(data?.totalDispatched)}</Text>
            <Text className="text-stone-400 text-[10px] font-sansBold">KG</Text>
          </View>
          <View className="flex-1 bg-white rounded-[20px] p-4 border border-stone-200 shadow-sm">
            <Text className="text-stone-400 text-[11px] font-sans uppercase mb-1">Inventory</Text>
            <Text className="text-stone-900 text-xl font-displayBold">{fmt(data?.totalInventory)}</Text>
            <Text className="text-stone-400 text-[10px] font-sansBold">KG</Text>
          </View>
        </View>

        {/* Inventory by Pool */}
        {data?.inventoryByPool && Object.keys(data.inventoryByPool).length > 0 && (
          <View className="mb-4">
            <Text className="text-stone-500 text-[13px] font-sansBold mb-2 uppercase tracking-wide">Inventory Pools</Text>
            <View className="flex-row flex-wrap gap-2">
              {Object.entries(data.inventoryByPool).map(([pool, qty]: [string, any]) => (
                <View key={pool} className="bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
                  <Text className="text-stone-500 text-xs font-sansMedium mb-1">{pool}</Text>
                  <Text className="text-amber-600 text-lg font-displayBold">{fmt(qty)}</Text>
                  <Text className="text-amber-600/70 text-[10px] font-sansBold">KG</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Unit Performance */}
        <Text className="text-stone-500 text-[13px] font-sansBold mb-2 uppercase tracking-wide">Unit Performance</Text>
        <View className="mb-6">
          {(data?.units || []).map((u: any) => (
            <View key={u._id} className="bg-white border border-stone-200 rounded-[20px] px-5 py-4 mb-3 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-sansBold text-stone-900 text-base">{u.name}</Text>
                <View className="bg-amber-500/10 rounded-full px-3 py-1">
                  <Text className="text-amber-600 text-xs font-sansBold">{fmtPct(u.yieldPct)}</Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-stone-400 text-[10px] font-sans uppercase">Intake</Text>
                  <Text className="text-stone-700 text-sm font-sansMedium">{fmt(u.intake?.totalAdjusted)} kg</Text>
                </View>
                <View>
                  <Text className="text-stone-400 text-[10px] font-sans uppercase">Dispatch</Text>
                  <Text className="text-stone-700 text-sm font-sansMedium">{fmt(u.dispatch?.totalDispatched)} kg</Text>
                </View>
                <View>
                  <Text className="text-stone-400 text-[10px] font-sans uppercase">Code</Text>
                  <Text className="text-stone-400 text-sm font-sansMedium">{u.code}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
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
