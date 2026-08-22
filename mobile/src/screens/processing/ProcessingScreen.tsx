import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';
import type { Silo } from '../../types';

// Covers both First Pass (De-husking -> Gota) and Second Pass (Splitting &
// Polishing -> Finished Dal) — SRS §15 and §17 — as one screen, stage toggled.
export default function ProcessingScreen() {
  const [stage, setStage] = useState<'FIRST_PASS' | 'SECOND_PASS'>('FIRST_PASS');
  const [silos, setSilos] = useState<Silo[]>([]);
  const [sourceSiloId, setSourceSiloId] = useState<string | null>(null);
  const [destinationSiloId, setDestinationSiloId] = useState<string | null>(null);
  const [inputQuantityKg, setInputQuantityKg] = useState('');
  const [outputQuantityKg, setOutputQuantityKg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);

  const load = useCallback(() => {
    api.get('/silos').then((res) => setSilos(res.data.data));
    api.get('/processing-runs').then((res) => setRuns(res.data.data));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    setError(null);
    if (!sourceSiloId || !inputQuantityKg || !outputQuantityKg) {
      setError('Please select a source silo and enter input/output quantities.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/processing-runs', {
        stage,
        sourceSiloId,
        destinationSiloId,
        inputQuantityKg: parseFloat(inputQuantityKg),
        outputQuantityKg: parseFloat(outputQuantityKg),
      });
      setInputQuantityKg('');
      setOutputQuantityKg('');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-4">Processing</Text>

      <View className="flex-row bg-stone-100 rounded-2xl p-1 mb-6">
        {(['FIRST_PASS', 'SECOND_PASS'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            className={`flex-1 py-3 rounded-xl items-center ${stage === s ? 'bg-white' : ''}`}
            onPress={() => setStage(s)}
          >
            <Text className={`font-sansBold ${stage === s ? 'text-brand' : 'text-stone-500 font-sansMedium'}`}>
              {s === 'FIRST_PASS' ? 'First Pass' : 'Second Pass'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ErrorBanner message={error} />

      <Text className="text-stone-500 font-sansMedium text-sm mb-2 font-sansMedium">Source Silo</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {silos.map((s) => (
          <TouchableOpacity
            key={s._id}
            className={`px-4 py-2 rounded-xl border ${sourceSiloId === s._id ? 'bg-brand border-brand' : 'border-stone-200'}`}
            onPress={() => setSourceSiloId(s._id)}
          >
            <Text className={sourceSiloId === s._id ? 'text-white' : 'text-slate-700'}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-stone-500 font-sansMedium text-sm mb-2 font-sansMedium">Destination Silo (optional)</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {silos.map((s) => (
          <TouchableOpacity
            key={s._id}
            className={`px-4 py-2 rounded-xl border ${destinationSiloId === s._id ? 'bg-brand border-brand' : 'border-stone-200'}`}
            onPress={() => setDestinationSiloId(s._id === destinationSiloId ? null : s._id)}
          >
            <Text className={destinationSiloId === s._id ? 'text-white' : 'text-slate-700'}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <NumericInput label="Input Quantity" value={inputQuantityKg} onChangeText={setInputQuantityKg} suffix="kg" />
      <NumericInput
        label={stage === 'FIRST_PASS' ? 'Gota Output' : 'Finished Dal Output'}
        value={outputQuantityKg}
        onChangeText={setOutputQuantityKg}
        suffix="kg"
      />

      <PrimaryButton label="Record Processing Run" onPress={handleSubmit} loading={submitting} />

      <Text className="text-stone-500 font-sansMedium text-sm font-sansMedium mt-8 mb-2">Recent Runs</Text>
      {runs.map((r) => (
        <View key={r._id} className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
          <Text className="font-sansMedium text-stone-900 font-sansBold">{r.stage.replace('_', ' ')} · {r.outputQuantityKg} kg out</Text>
          <Text className="text-stone-400 font-sans text-xs">{new Date(r.date).toLocaleString()}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}
