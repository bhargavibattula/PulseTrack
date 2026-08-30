import React, { useState, useEffect } from 'react';
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
        if (data.locations?.length > 0) setSelectedLocation(data.locations[0]._id);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setFetchingMasters(false);
      }
    }
    loadMasterData();
  }, []);

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
      if (moistureNum < 10) {
        setError('Moisture below 10% is not currently supported by business rules.');
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
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className="text-stone-500 mt-2 font-sansMedium">Loading master data...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <View className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 mb-6">
        <Text className="text-2xl font-bold mb-4 text-stone-900">New Production Transfer</Text>
        
        <ErrorBanner message={error} />

        {/* Process Selection */}
        <Text className="text-stone-600 font-sansMedium text-sm mb-2">Select Process / Pass</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row space-x-2">
          {processes.map((p) => (
            <TouchableOpacity
              key={p._id}
              onPress={() => setSelectedProcess(p._id)}
              className={`px-4 py-2.5 rounded-xl border ${selectedProcess === p._id ? 'bg-teal-700 border-teal-700' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-bold text-xs ${selectedProcess === p._id ? 'text-white' : 'text-stone-700'}`}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Source Location Selection */}
        <Text className="text-stone-600 font-sansMedium text-sm mb-2">Source Location / Silo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row space-x-2">
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc._id}
              onPress={() => setSelectedLocation(loc._id)}
              className={`px-4 py-2.5 rounded-xl border ${selectedLocation === loc._id ? 'bg-amber-600 border-amber-600' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-bold text-xs ${selectedLocation === loc._id ? 'text-white' : 'text-stone-700'}`}>
                {loc.name} ({loc.code})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Shift Selection */}
        <Text className="text-stone-600 font-sansMedium text-sm mb-2">Shift</Text>
        <View className="flex-row space-x-2 mb-4">
          {shifts.map((s) => (
            <TouchableOpacity
              key={s._id}
              onPress={() => setSelectedShift(s._id)}
              className={`flex-1 py-2.5 rounded-xl border items-center ${selectedShift === s._id ? 'bg-stone-800 border-stone-800' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-bold text-xs ${selectedShift === s._id ? 'text-white' : 'text-stone-700'}`}>
                {s.name}
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
          label="Input Moisture (Optional, Std 10%)"
          suffix="%"
          value={inputMoisture}
          onChangeText={setInputMoisture}
          placeholder="e.g. 13"
        />

        <View className="mt-4">
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
