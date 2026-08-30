import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import NumericInput from '../../components/inputs/NumericInput';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function StockAdjustmentScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/master-data/all');
        const locs = res.data.data.locations || [];
        const mats = res.data.data.materials || [];
        setLocations(locs);
        setMaterials(mats);

        if (locs.length > 0) setSelectedLocation(locs[0]._id);
        if (mats.length > 0) setSelectedMaterial(mats[0]._id);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    if (!reason || reason.trim() === '') {
      setError('Reason is mandatory for explicit stock adjustments.');
      return;
    }

    if (!selectedLocation || !selectedMaterial) {
      setError('Please select a Location and Material.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/stock/adjustment', {
        locationId: selectedLocation,
        materialId: selectedMaterial,
        direction,
        quantity: qty,
        reason
      });

      Alert.alert('Success', 'Stock adjustment recorded with full audit trail.', [
        {
          text: 'OK',
          onPress: () => {
            setQuantity('');
            setReason('');
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

  if (fetching) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <View className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 mb-6">
        <Text className="text-2xl font-bold mb-4 text-stone-900">Explicit Stock Adjustment</Text>
        
        <ErrorBanner message={error} />

        {/* Direction Switcher */}
        <Text className="text-stone-600 font-sansMedium text-sm mb-2">Adjustment Direction</Text>
        <View className="flex-row space-x-2 mb-4">
          <TouchableOpacity
            onPress={() => setDirection('IN')}
            className={`flex-1 py-3 rounded-xl border items-center flex-row justify-center space-x-2 ${direction === 'IN' ? 'bg-emerald-700 border-emerald-700' : 'bg-stone-100 border-stone-200'}`}
          >
            <Feather name="plus" size={16} color={direction === 'IN' ? '#fff' : '#444'} />
            <Text className={`font-bold text-sm ${direction === 'IN' ? 'text-white' : 'text-stone-700'}`}>
              Positive (+ IN)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDirection('OUT')}
            className={`flex-1 py-3 rounded-xl border items-center flex-row justify-center space-x-2 ${direction === 'OUT' ? 'bg-rose-700 border-rose-700' : 'bg-stone-100 border-stone-200'}`}
          >
            <Feather name="minus" size={16} color={direction === 'OUT' ? '#fff' : '#444'} />
            <Text className={`font-bold text-sm ${direction === 'OUT' ? 'text-white' : 'text-stone-700'}`}>
              Negative (- OUT)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location Selection */}
        <Text className="text-stone-600 font-sansMedium text-sm mb-2">Target Location / Silo</Text>
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

        {/* Material Selection */}
        <Text className="text-stone-600 font-sansMedium text-sm mb-2">Material</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row space-x-2">
          {materials.map((mat) => (
            <TouchableOpacity
              key={mat._id}
              onPress={() => setSelectedMaterial(mat._id)}
              className={`px-4 py-2.5 rounded-xl border ${selectedMaterial === mat._id ? 'bg-teal-700 border-teal-700' : 'bg-stone-100 border-stone-200'}`}
            >
              <Text className={`font-bold text-xs ${selectedMaterial === mat._id ? 'text-white' : 'text-stone-700'}`}>
                {mat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quantity */}
        <NumericInput
          label="Quantity"
          suffix="kg"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g. 500"
        />

        {/* Reason */}
        <TextField
          label="Mandatory Reason for Adjustment"
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. Physical stock count reconciliation"
        />

        <View className="mt-4">
          <PrimaryButton 
            label="Record Adjustment" 
            onPress={handleSubmit} 
            loading={loading}
            iconName="save"
          />
        </View>
      </View>
    </ScrollView>
  );
}
