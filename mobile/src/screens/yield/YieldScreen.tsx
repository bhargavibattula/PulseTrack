import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import NumericInput from '../../components/inputs/NumericInput';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function YieldScreen({ route, navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  // Yield outputs breakdown
  const [mainYield, setMainYield] = useState('87');
  const [mainDestLoc, setMainDestLoc] = useState('');
  const [mainMaterialId, setMainMaterialId] = useState('');

  const [splitYield, setSplitYield] = useState('10');
  const [splitDestLoc, setSplitDestLoc] = useState('');
  const [splitMaterialId, setSplitMaterialId] = useState('');

  const [huskYield, setHuskYield] = useState('3');
  const [huskDestLoc, setHuskDestLoc] = useState('');
  const [huskMaterialId, setHuskMaterialId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [pendingRes, masterRes] = await Promise.all([
          api.get('/production/pending-lab'),
          api.get('/master-data/all')
        ]);

        const transfers = pendingRes.data.data || [];
        setPendingTransfers(transfers);
        if (transfers.length > 0) {
          setSelectedTransfer(transfers[0]);
        }

        const locs = masterRes.data.data.locations || [];
        const mats = masterRes.data.data.materials || [];
        setLocations(locs);
        setMaterials(mats);

        if (locs.length > 0) {
          setMainDestLoc(locs[0]._id);
          setSplitDestLoc(locs[1]?._id || locs[0]._id);
          setHuskDestLoc(locs[2]?._id || locs[0]._id);
        }

        if (mats.length > 0) {
          setMainMaterialId(mats[0]._id);
          setSplitMaterialId(mats[1]?._id || mats[0]._id);
          setHuskMaterialId(mats[2]?._id || mats[0]._id);
        }
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, []);

  const totalYield = (parseFloat(mainYield) || 0) + (parseFloat(splitYield) || 0) + (parseFloat(huskYield) || 0);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedTransfer) {
      setError('Please select a pending production transfer.');
      return;
    }

    if (Math.abs(totalYield - 100) > 0.01) {
      setError(`Yield total must equal exactly 100%. Current sum: ${totalYield}%`);
      return;
    }

    if (!mainDestLoc || !splitDestLoc || !huskDestLoc) {
      setError('Please select destination locations for all outputs.');
      return;
    }

    setLoading(true);
    try {
      const outputs = [
        {
          destinationLocationId: mainDestLoc,
          materialId: mainMaterialId,
          yieldPercent: parseFloat(mainYield) || 0,
        },
        {
          destinationLocationId: splitDestLoc,
          materialId: splitMaterialId,
          yieldPercent: parseFloat(splitYield) || 0,
        },
        {
          destinationLocationId: huskDestLoc,
          materialId: huskMaterialId,
          yieldPercent: parseFloat(huskYield) || 0,
        }
      ];

      await api.post('/production/yield', {
        transferId: selectedTransfer._id,
        totalYieldPercent: 100,
        outputs
      });

      Alert.alert('Success', 'Lab Yield submitted and stock posted atomically!', [
        {
          text: 'OK',
          onPress: () => {
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
        <Text className="text-stone-500 mt-2 font-sansMedium">Loading pending lab entries...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <View className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 mb-6">
        <Text className="text-2xl font-bold mb-4 text-stone-900">Submit Laboratory Yield</Text>
        
        <ErrorBanner message={error} />

        {/* Transfer Selection */}
        <Text className="text-stone-600 font-sansMedium text-sm mb-2">Select Pending Production Transfer</Text>
        {pendingTransfers.length === 0 ? (
          <View className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
            <Text className="text-amber-800 text-sm font-medium">No pending transfers awaiting lab yield.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row space-x-2">
            {pendingTransfers.map((t) => (
              <TouchableOpacity
                key={t._id}
                onPress={() => setSelectedTransfer(t)}
                className={`p-3 rounded-xl border ${selectedTransfer?._id === t._id ? 'bg-teal-800 border-teal-800' : 'bg-stone-100 border-stone-200'}`}
              >
                <Text className={`font-bold text-xs ${selectedTransfer?._id === t._id ? 'text-white' : 'text-stone-800'}`}>
                  Ref: {t._id.substring(0, 6)} ({t.processingQty} kg)
                </Text>
                <Text className={`text-[10px] mt-1 ${selectedTransfer?._id === t._id ? 'text-teal-200' : 'text-stone-500'}`}>
                  {t.process?.name} • Silo: {t.sourceLocation?.code || 'N/A'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedTransfer && (
          <View className="bg-stone-50 p-3 rounded-xl mb-4 border border-stone-200">
            <Text className="text-xs text-stone-600 font-medium">
              Physical Processing Qty: <Text className="font-bold text-stone-900">{selectedTransfer.processingQty} kg</Text>
            </Text>
            {selectedTransfer.inputMoisture != null && (
              <Text className="text-xs text-stone-600 font-medium mt-1">
                Moisture: {selectedTransfer.inputMoisture}% → Adjusted Input: <Text className="font-bold text-stone-900">{selectedTransfer.adjustedInputQty} kg</Text>
              </Text>
            )}
          </View>
        )}

        {/* Output 1: Main Material */}
        <View className="p-3 bg-stone-50 rounded-xl mb-3 border border-stone-200">
          <Text className="font-bold text-sm text-stone-800 mb-2">1. Main Material (e.g. Silo 8)</Text>
          <NumericInput
            label="Main Yield (%)"
            suffix="%"
            value={mainYield}
            onChangeText={setMainYield}
            placeholder="87"
          />
        </View>

        {/* Output 2: Split */}
        <View className="p-3 bg-stone-50 rounded-xl mb-3 border border-stone-200">
          <Text className="font-bold text-sm text-stone-800 mb-2">2. Split Dal</Text>
          <NumericInput
            label="Split Yield (%)"
            suffix="%"
            value={splitYield}
            onChangeText={setSplitYield}
            placeholder="10"
          />
        </View>

        {/* Output 3: Husk */}
        <View className="p-3 bg-stone-50 rounded-xl mb-3 border border-stone-200">
          <Text className="font-bold text-sm text-stone-800 mb-2">3. Husk / Byproduct</Text>
          <NumericInput
            label="Husk Yield (%)"
            suffix="%"
            value={huskYield}
            onChangeText={setHuskYield}
            placeholder="3"
          />
        </View>

        {/* Total Yield Indicator */}
        <View className={`p-3 rounded-xl mb-4 flex-row justify-between items-center ${Math.abs(totalYield - 100) < 0.01 ? 'bg-emerald-50 border border-emerald-300' : 'bg-red-50 border border-red-300'}`}>
          <Text className={`font-bold text-sm ${Math.abs(totalYield - 100) < 0.01 ? 'text-emerald-800' : 'text-red-800'}`}>
            Total Yield: {totalYield}%
          </Text>
          <Text className={`text-xs ${Math.abs(totalYield - 100) < 0.01 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}`}>
            {Math.abs(totalYield - 100) < 0.01 ? '✓ Valid (100%)' : 'Must equal 100%'}
          </Text>
        </View>

        <PrimaryButton 
          label="Submit Yield & Post Stock" 
          onPress={handleSubmit} 
          loading={loading}
          disabled={pendingTransfers.length === 0}
          iconName="check"
        />
      </View>
    </ScrollView>
  );
}
