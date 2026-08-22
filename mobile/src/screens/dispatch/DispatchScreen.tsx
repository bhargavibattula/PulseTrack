import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';

export default function DispatchScreen() {
  const [truckNumber, setTruckNumber] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [destinationReference, setDestinationReference] = useState('');
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.get('/dispatch').then((res) => setDispatches(res.data.data));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    setError(null);
    if (!quantityKg) {
      setError('Please enter the dispatch weight.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/dispatch', {
        truckNumber: truckNumber || undefined,
        quantityKg: parseFloat(quantityKg),
        destinationReference: destinationReference || undefined,
      });
      setTruckNumber('');
      setQuantityKg('');
      setDestinationReference('');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-4">Finished Dispatch</Text>

      <ErrorBanner message={error} />

      <TextField label="Truck Number" value={truckNumber} onChangeText={setTruckNumber} autoCapitalize="characters" placeholder="APXX1234" />
      <NumericInput label="Weight" value={quantityKg} onChangeText={setQuantityKg} suffix="kg" />
      <TextField label="Destination Reference" value={destinationReference} onChangeText={setDestinationReference} placeholder="Optional" />

      <PrimaryButton label="Record Dispatch" onPress={handleSubmit} loading={submitting} />

      <Text className="text-stone-500 font-sansMedium text-sm font-sansMedium mt-8 mb-2">Recent Dispatches</Text>
      {dispatches.map((d) => (
        <View key={d._id} className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
          <Text className="font-sansMedium text-stone-900 font-sansBold">{d.truckNumber || '—'} · {d.quantityKg} kg</Text>
          <Text className="text-stone-400 font-sans text-xs">{new Date(d.date).toLocaleString()}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}
