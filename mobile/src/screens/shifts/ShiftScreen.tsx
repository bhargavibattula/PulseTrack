import React, { useCallback, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';

// DUMMY shift structure — SRS §48.5 leaves the number/timing of shifts open,
// so this is a free-text label rather than a fixed picker for now.
export default function ShiftScreen() {
  const [shiftLabel, setShiftLabel] = useState('SHIFT_1');
  const [movementQuantityKg, setMovementQuantityKg] = useState('');
  const [processingQuantityKg, setProcessingQuantityKg] = useState('');
  const [notes, setNotes] = useState('');
  const [shifts, setShifts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.get('/shifts').then((res) => setShifts(res.data.data));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/shifts', {
        shiftLabel,
        movementQuantityKg: movementQuantityKg ? parseFloat(movementQuantityKg) : undefined,
        processingQuantityKg: processingQuantityKg ? parseFloat(processingQuantityKg) : undefined,
        notes: notes || undefined,
      });
      setMovementQuantityKg('');
      setProcessingQuantityKg('');
      setNotes('');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-1">Shift Summary</Text>
      <Text className="text-stone-500 font-sansMedium mb-6">Submit at the start of your shift</Text>

      <ErrorBanner message={error} />

      <TextField label="Shift" value={shiftLabel} onChangeText={setShiftLabel} />
      <NumericInput label="Material Movement" value={movementQuantityKg} onChangeText={setMovementQuantityKg} suffix="kg" />
      <NumericInput label="Processing Quantity" value={processingQuantityKg} onChangeText={setProcessingQuantityKg} suffix="kg" />
      <TextField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Optional" />

      <PrimaryButton label="Submit Shift Summary" onPress={handleSubmit} loading={submitting} />

      <Text className="text-stone-500 font-sansMedium text-sm font-sansMedium mt-8 mb-2">Recent Shifts</Text>
      {shifts.map((s) => (
        <View key={s._id} className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
          <Text className="font-sansMedium text-stone-900 font-sansBold">{s.shiftLabel} · {new Date(s.date).toLocaleDateString()}</Text>
          <Text className="text-stone-400 font-sans text-xs">{s.status}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}
