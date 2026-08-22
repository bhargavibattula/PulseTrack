import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';

export default function LaboratoryScreen() {
  const [expectedRecoveryPct, setExpectedRecoveryPct] = useState('');
  const [sampleReference, setSampleReference] = useState('');
  const [tests, setTests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.get('/lab-tests').then((res) => setTests(res.data.data));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    setError(null);
    if (!expectedRecoveryPct) {
      setError('Please enter the expected recovery percentage.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/lab-tests', {
        expectedRecoveryPct: parseFloat(expectedRecoveryPct),
        sampleReference: sampleReference || undefined,
      });
      setExpectedRecoveryPct('');
      setSampleReference('');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-4">Laboratory</Text>

      <ErrorBanner message={error} />

      <NumericInput label="Expected Recovery" value={expectedRecoveryPct} onChangeText={setExpectedRecoveryPct} suffix="%" />
      <TextField label="Sample Reference" value={sampleReference} onChangeText={setSampleReference} placeholder="Optional" />

      <PrimaryButton label="Save Lab Test" onPress={handleSubmit} loading={submitting} />

      <Text className="text-stone-500 font-sansMedium text-sm font-sansMedium mt-8 mb-2">Recent Lab Tests</Text>
      {tests.map((t) => (
        <View key={t._id} className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
          <Text className="font-sansMedium text-stone-900 font-sansBold">{t.expectedRecoveryPct}% expected</Text>
          <Text className="text-stone-400 font-sans text-xs">{new Date(t.testDate).toLocaleDateString()}</Text>
        </View>
      ))}

      <Text className="text-stone-400 font-sans text-xs mt-4">
        How multiple lab tests combine into "the" baseline used for variance is pending client
        confirmation (SRS §48.8) — the Yield screen currently uses the most recent test only.
      </Text>
    </ScreenContainer>
  );
}
