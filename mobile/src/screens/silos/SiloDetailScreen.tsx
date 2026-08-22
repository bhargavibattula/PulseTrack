import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusBadge from '../../components/status/StatusBadge';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';
import type { Silo, SiloStatus } from '../../types';

// Valid transitions mirror the backend state machine exactly (design doc Section G.1).
const NEXT_STATUS: Record<SiloStatus, SiloStatus | null> = {
  EMPTY: 'FILLING',
  FILLING: 'FULL_SITTING',
  FULL_SITTING: 'EMPTYING',
  EMPTYING: 'EMPTY',
};

export default function SiloDetailScreen({ route }: any) {
  const { siloId } = route.params;
  const [silo, setSilo] = useState<Silo | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(() => {
    api.get(`/silos/${siloId}`).then((res) => {
      setSilo(res.data.data.silo);
      setMovements(res.data.data.movements);
    });
  }, [siloId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function advanceStatus() {
    if (!silo) return;
    const next = NEXT_STATUS[silo.status];
    if (!next) return;
    setUpdating(true);
    setError(null);
    try {
      await api.patch(`/silos/${silo._id}/status`, { newStatus: next });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  if (!silo) return null;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold">{silo.name}</Text>
          <StatusBadge status={silo.status} />
        </View>
        <Text className="text-stone-500 font-sansMedium mb-6">{silo.currentQuantityKg.toFixed(0)} kg current</Text>

        <ErrorBanner message={error} />

        <PrimaryButton
          label={NEXT_STATUS[silo.status] ? `Move to ${NEXT_STATUS[silo.status]?.replace('_', ' ')}` : 'No further transition'}
          onPress={advanceStatus}
          loading={updating}
          disabled={!NEXT_STATUS[silo.status]}
        />

        <Text className="text-stone-500 font-sansMedium text-sm font-sansMedium mt-8 mb-2">Recent Movements</Text>
        {movements.length === 0 && <Text className="text-stone-400 font-sans">No movement recorded yet.</Text>}
        {movements.map((m) => (
          <View key={m._id} className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
            <Text className="text-stone-900 font-sansBold font-sansMedium">{m.quantityKg} kg · {m.materialType}</Text>
            <Text className="text-stone-400 font-sans text-xs">{new Date(m.createdAt).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
