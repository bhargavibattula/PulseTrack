import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import NumericInput from '../../components/inputs/NumericInput';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function ProductionTransferScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [fetchingMasters, setFetchingMasters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Master data
  const [units, setUnits] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Form State
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [destinationLocation, setDestinationLocation] = useState<string>('');
  const [processingQty, setProcessingQty] = useState('');
  const [inputMoisture, setInputMoisture] = useState('');

  useEffect(() => {
    async function loadMasterData() {
      try {
        const res = await api.get('/master-data/all');
        const data = res.data.data;
        setUnits(data.units || []);
        setShifts(data.shifts || []);
        setProcesses(data.processes || []);
        setLocations(data.locations || []);

        if (data.units?.length > 0) setSelectedUnit(data.units[0]._id);
        if (data.shifts?.length > 0) setSelectedShift(data.shifts[0]._id);
        if (data.processes?.length > 0) setSelectedProcess(data.processes[0]._id);
        if (data.locations?.length > 0) {
          setSelectedLocation(data.locations[0]._id);
          if (data.locations.length > 1) setDestinationLocation(data.locations[1]._id);
        }
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setFetchingMasters(false);
      }
    }
    loadMasterData();
  }, []);

  // Live moisture preview calculation
  const moisturePreview = useMemo(() => {
    const qty = parseFloat(processingQty);
    const moisture = parseFloat(inputMoisture);
    if (isNaN(qty) || qty <= 0) return null;

    if (isNaN(moisture) || inputMoisture.trim() === '') {
      return { grossKg: qty, deductionKg: 0, adjustedKg: qty, moisturePct: null, message: 'No moisture entered — full weight retained' };
    }

    if (moisture <= 10) {
      return { grossKg: qty, deductionKg: 0, adjustedKg: qty, moisturePct: moisture, message: `Standard moisture (${moisture}% ≤ 10%) — No deduction` };
    }

    const deduction = qty * ((moisture - 10) / 100);
    const adjusted = qty - deduction;
    return {
      grossKg: qty,
      deductionKg: Math.round(deduction * 100) / 100,
      adjustedKg: Math.round(adjusted * 100) / 100,
      moisturePct: moisture,
      message: null
    };
  }, [processingQty, inputMoisture]);

  const handleSubmit = async () => {
    setError(null);
    const qty = parseFloat(processingQty);
    if (isNaN(qty) || qty <= 0) {
      setError('Processing quantity must be a positive number.');
      return;
    }

    if (!selectedUnit || !selectedShift || !selectedProcess || !selectedLocation) {
      setError('Please select Unit, Shift, Process and Source Location.');
      return;
    }

    let moistureNum: number | null = null;
    if (inputMoisture.trim() !== '') {
      moistureNum = parseFloat(inputMoisture);
      if (isNaN(moistureNum) || moistureNum < 0 || moistureNum > 100) {
        setError('Moisture must be between 0% and 100%.');
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/production/transfer', {
        unitId: selectedUnit,
        shiftId: selectedShift,
        processId: selectedProcess,
        sourceLocationId: selectedLocation,
        destinationLocationId: destinationLocation || undefined,
        processingQty: qty,
        inputMoisture: moistureNum
      });

      Alert.alert('Success', 'Production Transfer created successfully (Status: PENDING_LAB)', [
        {
          text: 'OK',
          onPress: () => {
            setProcessingQty('');
            setInputMoisture('');
            if (navigation && navigation.goBack) navigation.goBack();
          }
        }
      ]);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetchingMasters) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className="text-stone-500 mt-2 font-sansMedium">Loading master data...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-stone-50 p-6">
      <View className="bg-white p-6 rounded-[24px] shadow-sm border border-stone-200 mb-6">
        <Text className="text-2xl font-displayExtraBold mb-1 text-stone-900">New Production Transfer</Text>
        <Text className="text-stone-500 mb-6 font-sans text-sm">Enter processing quantity, source and destination locations</Text>
        
        <ErrorBanner message={error} />

        {/* Process Selection */}
        <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2">Process / Pass</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 flex-row space-x-2">
          {processes.map((p) => (
            <TouchableOpacity
              key={p._id}
              onPress={() => setSelectedProcess(p._id)}
              className={`px-4 py-2.5 rounded-2xl border mr-2 ${selectedProcess === p._id ? 'bg-amber-500 border-amber-500' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-sansBold text-xs ${selectedProcess === p._id ? 'text-white' : 'text-stone-700'}`}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Source Location Selection */}
        <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2">Source Silo (From)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 flex-row space-x-2">
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc._id}
              onPress={() => setSelectedLocation(loc._id)}
              className={`px-4 py-2.5 rounded-2xl border mr-2 ${selectedLocation === loc._id ? 'bg-stone-900 border-stone-900' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-sansBold text-xs ${selectedLocation === loc._id ? 'text-white' : 'text-stone-700'}`}>
                {loc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Destination Location Selection */}
        <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2">Destination Silo (To) — Optional</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 flex-row space-x-2">
          {locations.filter(loc => loc._id !== selectedLocation).map((loc) => (
            <TouchableOpacity
              key={loc._id}
              onPress={() => setDestinationLocation(loc._id)}
              className={`px-4 py-2.5 rounded-2xl border mr-2 ${destinationLocation === loc._id ? 'bg-emerald-500 border-emerald-500' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-sansBold text-xs ${destinationLocation === loc._id ? 'text-white' : 'text-stone-700'}`}>
                {loc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Shift Selection */}
        <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2">Shift</Text>
        <View className="flex-row space-x-2 mb-5">
          {shifts.map((s) => (
            <TouchableOpacity
              key={s._id}
              onPress={() => setSelectedShift(s._id)}
              className={`flex-1 py-2.5 rounded-2xl border items-center ${selectedShift === s._id ? 'bg-amber-500 border-amber-500' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-sansBold text-xs ${selectedShift === s._id ? 'text-white' : 'text-stone-700'}`}>
                {s.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantities */}
        <NumericInput
          label="Processing Quantity"
          suffix="kg"
          value={processingQty}
          onChangeText={setProcessingQty}
          placeholder="e.g. 30000"
        />

        <NumericInput
          label="Input Moisture (I/P, Std 10%)"
          suffix="%"
          value={inputMoisture}
          onChangeText={setInputMoisture}
          placeholder="e.g. 13"
        />

        {/* Live Moisture Preview Banner */}
        {moisturePreview && (
          <View className={`p-4 rounded-2xl mb-4 border ${moisturePreview.deductionKg > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            {moisturePreview.message ? (
              <Text className={`font-sansBold text-xs ${moisturePreview.deductionKg > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                ✓ {moisturePreview.message}
              </Text>
            ) : (
              <>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-stone-600 font-sans">Gross Weight</Text>
                  <Text className="font-sansBold text-stone-900 text-xs">
                    {moisturePreview.grossKg >= 1000 ? `${(moisturePreview.grossKg / 1000).toFixed(1)} tons` : `${moisturePreview.grossKg.toLocaleString()} kg`}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-stone-600 font-sans">Moisture Deduction ({moisturePreview.moisturePct}% − 10% = {(moisturePreview.moisturePct! - 10)}%)</Text>
                  <Text className="font-sansBold text-red-600 text-xs">
                    −{moisturePreview.deductionKg >= 1000 ? `${(moisturePreview.deductionKg / 1000).toFixed(2)} tons` : `${moisturePreview.deductionKg} kg`}
                  </Text>
                </View>
                <View className="flex-row justify-between pt-1 border-t border-amber-200/50">
                  <Text className="text-xs text-stone-600 font-sansBold">Adjusted Net Weight</Text>
                  <Text className="font-displayBold text-amber-700 text-sm">
                    {moisturePreview.adjustedKg >= 1000 ? `${(moisturePreview.adjustedKg / 1000).toFixed(2)} tons` : `${moisturePreview.adjustedKg.toLocaleString()} kg`}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        <View className="mt-2">
          <PrimaryButton 
            label="Record Production Transfer" 
            onPress={handleSubmit} 
            loading={loading}
            iconName="arrow-right"
          />
        </View>
      </View>
    </ScrollView>
  );
}
