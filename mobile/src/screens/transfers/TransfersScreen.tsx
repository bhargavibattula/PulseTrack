import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';

// CLARIFICATION_REQUIRED (SRS §48.3): exact transfer authorization rules.
// DUMMY DEFAULT: any authenticated operator/supervisor/manager can initiate a
// transfer between any two units, no approval step.
export default function TransfersScreen() {
  const [units, setUnits] = useState<any[]>([]);
  const [sourceUnitId, setSourceUnitId] = useState<string | null>(null);
  const [destinationUnitId, setDestinationUnitId] = useState<string | null>(null);
  const [quantityKg, setQuantityKg] = useState('');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.get('/units').then((res) => setUnits(res.data.data));
    api.get('/transfers').then((res) => setTransfers(res.data.data));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    setError(null);
    if (!sourceUnitId || !destinationUnitId || !quantityKg) {
      setError('Please select source, destination, and quantity.');
      return;
    }
    if (sourceUnitId === destinationUnitId) {
      setError('Source and destination units must differ.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transfers', {
        sourceUnitId,
        destinationUnitId,
        materialType: 'RAW_TOOR',
        quantityKg: parseFloat(quantityKg),
      });
      setQuantityKg('');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-4">Inter-Unit Transfer</Text>

      <ErrorBanner message={error} />

      <Text className="text-stone-500 font-sansMedium text-sm mb-2 font-sansMedium">From</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {units.map((u) => (
          <TouchableOpacity
            key={u._id}
            className={`px-4 py-2 rounded-xl border ${sourceUnitId === u._id ? 'bg-brand border-brand' : 'border-stone-200'}`}
            onPress={() => setSourceUnitId(u._id)}
          >
            <Text className={sourceUnitId === u._id ? 'text-white' : 'text-slate-700'}>{u.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-stone-500 font-sansMedium text-sm mb-2 font-sansMedium">To</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {units.map((u) => (
          <TouchableOpacity
            key={u._id}
            className={`px-4 py-2 rounded-xl border ${destinationUnitId === u._id ? 'bg-brand border-brand' : 'border-stone-200'}`}
            onPress={() => setDestinationUnitId(u._id)}
          >
            <Text className={destinationUnitId === u._id ? 'text-white' : 'text-slate-700'}>{u.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <NumericInput label="Quantity" value={quantityKg} onChangeText={setQuantityKg} suffix="kg" />

      <PrimaryButton label="Initiate Transfer" onPress={handleSubmit} loading={submitting} />

      <Text className="text-stone-500 font-sansMedium text-sm font-sansMedium mt-8 mb-2">Recent Transfers</Text>
      {transfers.map((t) => (
        <View key={t._id} className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
          <Text className="font-sansMedium text-stone-900 font-sansBold">
            {t.sourceUnit?.name} → {t.destinationUnit?.name} · {t.quantityKg} kg
          </Text>
          <Text className="text-stone-400 font-sans text-xs">{t.status} · {new Date(t.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}
