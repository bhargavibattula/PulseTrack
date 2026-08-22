import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import NumericInput from '../../components/inputs/NumericInput';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';

// Live preview UX per design doc §41 mock: raw weight / moisture / target /
// deduction / adjusted net weight, all computed server-side.
export default function NewIntakeScreen({ navigation }: any) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [grossWeightKg, setGrossWeightKg] = useState('');
  const [moisturePct, setMoisturePct] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = parseFloat(grossWeightKg);
    const moisture = parseFloat(moisturePct);
    if (!raw || moisture == null || isNaN(moisture)) {
      setPreview(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await api.post('/intake/preview', { rawWeightKg: raw, moisturePct: moisture });
        setPreview(data.data);
      } catch (err) {
        setPreview(null);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [grossWeightKg, moisturePct]);

  async function handleSubmit() {
    setError(null);
    if (!vehicleNumber || !grossWeightKg || !moisturePct) {
      setError('Please fill in vehicle number, weight, and moisture.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/intake', {
        vehicleNumber,
        grossWeightKg: parseFloat(grossWeightKg),
        moisturePct: parseFloat(moisturePct),
      });
      navigation.goBack();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-1">New Intake</Text>
      <Text className="text-stone-500 font-sansMedium mb-6">Gate intake weight + moisture reading</Text>

      <ErrorBanner message={error} />

      <TextField label="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" placeholder="APXX1234" />
      <NumericInput label="Gross Weight" value={grossWeightKg} onChangeText={setGrossWeightKg} suffix="kg" />
      <NumericInput label="Moisture" value={moisturePct} onChangeText={setMoisturePct} suffix="%" />

      {preview && (
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <Text className="text-amber-800 text-xs font-sansBold mb-2">
            PREVIEW — uses a placeholder moisture-deduction formula until confirmed with the client
          </Text>
          <Row label="Target Moisture" value={`${preview.targetMoisturePctUsed}%`} />
          <Row label="Deduction" value={`${preview.moistureDeductionKg} kg`} />
          <Row label="Adjusted Net Weight" value={`${preview.adjustedNetWeightKg} kg`} bold />
        </View>
      )}

      <PrimaryButton label="Confirm & Submit" onPress={handleSubmit} loading={submitting} />
    </ScreenContainer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-slate-600">{label}</Text>
      <Text className={`text-stone-900 font-sansBold ${bold ? 'font-bold text-lg' : ''}`}>{value}</Text>
    </View>
  );
}
