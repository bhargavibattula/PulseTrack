import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';

// CLARIFICATION_REQUIRED (SRS §48.2): allowed value range, global vs per-unit scope.
// DUMMY DEFAULT: free-entry numeric field, global scope only.
export default function ConfigurationScreen() {
  const [current, setCurrent] = useState<any>(null);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.get('/configuration/TARGET_BASE_MOISTURE').then((res) => setCurrent(res.data.data));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    setError(null);
    if (!newValue) {
      setError('Please enter a new target moisture value.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/configuration/TARGET_BASE_MOISTURE', { value: parseFloat(newValue), scope: 'GLOBAL' });
      setNewValue('');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-1">Configuration</Text>
      <Text className="text-stone-500 font-sansMedium mb-6">TARGET_BASE_MOISTURE</Text>

      <ErrorBanner message={error} />

      <View className="bg-stone-100 rounded-2xl p-4 mb-6">
        <Text className="text-stone-500 font-sansMedium text-xs">Current Value</Text>
        <Text className="text-3xl font-bold text-stone-900 font-sansBold">{current?.value != null ? `${current.value}%` : '—'}</Text>
      </View>

      <NumericInput label="New Target Moisture" value={newValue} onChangeText={setNewValue} suffix="%" />
      <PrimaryButton label="Save New Version" onPress={handleSubmit} loading={submitting} />

      <Text className="text-stone-400 font-sans text-xs mt-6">
        Configuration is versioned — saving here never rewrites past intake records (SRS §38–§39).
        It only changes what future intake calculations use.
      </Text>
    </ScreenContainer>
  );
}
