import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';

const CATEGORIES = [
  { key: 'HUSK', label: 'Husk (Bhusa)' },
  { key: 'POWDER', label: 'Powder (Chuni)' },
  { key: 'BROKEN', label: 'Broken (Tukda)' },
] as const;

export default function ByproductsScreen() {
  const [category, setCategory] = useState<'HUSK' | 'POWDER' | 'BROKEN'>('HUSK');
  const [weightKg, setWeightKg] = useState('');
  const [bagCount, setBagCount] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.get('/byproducts/summary').then((res) => setSummary(res.data.data));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    setError(null);
    if (!weightKg || !bagCount) {
      setError('Please enter weight and bag count.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/byproducts', { category, weightKg: parseFloat(weightKg), bagCount: parseInt(bagCount, 10) });
      setWeightKg('');
      setBagCount('');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-4">By-products</Text>

      <ErrorBanner message={error} />

      <View className="flex-row flex-wrap gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            className={`px-4 py-2 rounded-xl border ${category === c.key ? 'bg-brand border-brand' : 'border-stone-200'}`}
            onPress={() => setCategory(c.key)}
          >
            <Text className={category === c.key ? 'text-white' : 'text-slate-700'}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <NumericInput label="Weight" value={weightKg} onChangeText={setWeightKg} suffix="kg" />
      <NumericInput label="Bag Count" value={bagCount} onChangeText={setBagCount} suffix="bags" />

      <PrimaryButton label="Record By-product" onPress={handleSubmit} loading={submitting} />

      <Text className="text-stone-500 font-sansMedium text-sm font-sansMedium mt-8 mb-2">Cumulative Totals</Text>
      <View className="flex-row flex-wrap gap-3">
        {summary?.cumulative?.map((c: any) => (
          <View key={c._id} className="bg-stone-100 rounded-2xl px-4 py-3 min-w-[30%]">
            <Text className="text-stone-500 font-sansMedium text-xs">{c._id}</Text>
            <Text className="text-lg font-bold text-stone-900 font-sansBold">{c.total.toFixed(0)} kg</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
