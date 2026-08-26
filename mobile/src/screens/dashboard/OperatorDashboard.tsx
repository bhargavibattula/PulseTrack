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
// Uses the aggregated /dashboard/operator endpoint for a single fast request.
export default function OperatorDashboard({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [pools, setPools] = useState<InventoryPool[]>([]);
  const [silos, setSilos] = useState<Silo[]>([]);
  const [recentIntakes, setRecentIntakes] = useState<any[]>([]);
  const [recentShifts, setRecentShifts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/dashboard/operator');
      setPools(res.data.pools || []);
      setSilos(res.data.silos || []);
      setRecentIntakes(res.data.recentIntakes || []);
      setRecentShifts(res.data.recentShifts || []);
    } catch (err) {
      // Fallback to separate calls if dashboard endpoint isn't available
      try {
        const [inv, siloRes] = await Promise.all([api.get('/inventory'), api.get('/silos')]);
        setPools(inv.data.data);
        setSilos(siloRes.data.data);
      } catch {
        // dashboard failures are non-blocking — leave last-known state on screen
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

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView
        className="flex-1 px-5 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-3xl font-displayExtraBold text-stone-900">My Unit</Text>
        <Text className="text-stone-500 mb-6 font-sansMedium">{user?.name} · Operator</Text>

        {/* Current Inventory */}
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

        {/* Silo Status */}
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

        {/* Recent Intakes */}
        {recentIntakes.length > 0 && (
          <View className="mb-6">
            <Text className="text-stone-500 text-[13px] font-sansBold mb-2 uppercase tracking-wide">Recent Intakes</Text>
            {recentIntakes.map((intake) => (
              <View key={intake._id} className="bg-white border border-stone-200 rounded-2xl px-4 py-3 mb-2 shadow-sm">
                <View className="flex-row justify-between items-center">
                  <Text className="font-sansBold text-stone-900">{intake.vehicleNumber}</Text>
                  <Text className="text-amber-600 font-sansBold">{intake.adjustedNetWeightKg?.toFixed(0)} kg</Text>
                </View>
                <Text className="text-stone-400 text-xs font-sans mt-1">
                  Gross: {intake.grossWeightKg?.toFixed(0)} kg · Moisture: {intake.moisturePct}% · {new Date(intake.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Shifts */}
        {recentShifts.length > 0 && (
          <View className="mb-6">
            <Text className="text-stone-500 text-[13px] font-sansBold mb-2 uppercase tracking-wide">Recent Shift Summaries</Text>
            {recentShifts.map((shift) => (
              <View key={shift._id} className="bg-stone-100 rounded-2xl px-4 py-3 mb-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-sansBold text-stone-900">{shift.shiftLabel}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${shift.status === 'SUBMITTED' ? 'bg-green-100' : 'bg-orange-100'}`}>
                    <Text className={`text-[10px] font-sansBold ${shift.status === 'SUBMITTED' ? 'text-green-600' : 'text-orange-600'}`}>
                      {shift.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-stone-400 text-xs font-sans mt-1">{new Date(shift.date).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View className="gap-3 mb-8">
          <PrimaryButton label="New Intake" onPress={() => navigation.navigate('NewIntake')} iconName="plus" />
          <PrimaryButton label="Submit Shift Summary" onPress={() => navigation.navigate('Shifts')} variant="outline" iconName="clipboard" />
          <PrimaryButton label="Log Out" onPress={() => logout()} variant="danger" iconName="log-out" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
