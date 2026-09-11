import React, { useState, useEffect, useMemo } from 'react';
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

  // Byproduct-first approach: Lab enters Split% and Husk%, Main is auto-derived
  const [splitYield, setSplitYield] = useState('10');
  const [splitDestLoc, setSplitDestLoc] = useState('');
  const [splitMaterialId, setSplitMaterialId] = useState('');

  const [huskYield, setHuskYield] = useState('3');
  const [huskDestLoc, setHuskDestLoc] = useState('');
  const [huskMaterialId, setHuskMaterialId] = useState('');

  // Main destination (auto-derived %)
  const [mainDestLoc, setMainDestLoc] = useState('');
  const [mainMaterialId, setMainMaterialId] = useState('');

  // Output moisture (optional)
  const [outputMoisture, setOutputMoisture] = useState('');

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
          // If transfer has a pre-set destination, use it
          if (transfers[0].destinationLocation) {
            setMainDestLoc(transfers[0].destinationLocation._id || transfers[0].destinationLocation);
          }
        }

        const locs = masterRes.data.data.locations || [];
        const mats = masterRes.data.data.materials || [];
        setLocations(locs);
        setMaterials(mats);

        if (locs.length > 0) {
          if (!mainDestLoc) setMainDestLoc(locs[0]._id);
          setSplitDestLoc(locs[1]?._id || locs[0]._id);
          setHuskDestLoc(locs[2]?._id || locs[0]._id);
        }

        // Auto-select material types
        const mainMat = mats.find((m: any) => m.code === 'MAIN_DAL');
        const splitMat = mats.find((m: any) => m.code === 'SPLIT_DAL');
        const huskMat = mats.find((m: any) => m.code === 'HUSK');
        if (mainMat) setMainMaterialId(mainMat._id);
        if (splitMat) setSplitMaterialId(splitMat._id);
        if (huskMat) setHuskMaterialId(huskMat._id);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, []);

  // Auto-derive main yield percentage
  const splitPct = parseFloat(splitYield) || 0;
  const huskPct = parseFloat(huskYield) || 0;
  const mainYieldPct = Math.round((100 - splitPct - huskPct) * 100) / 100;
  const totalYield = splitPct + huskPct + mainYieldPct;

  // Live calculation of output weights
  const processingQty = selectedTransfer?.processingQty || 0;
  const calculations = useMemo(() => {
    const mainQty = Math.round((processingQty * mainYieldPct / 100) * 100) / 100;
    const splitQty = Math.round((processingQty * splitPct / 100) * 100) / 100;
    const huskQty = Math.round((processingQty * huskPct / 100) * 100) / 100;
    return { mainQty, splitQty, huskQty };
  }, [processingQty, mainYieldPct, splitPct, huskPct]);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedTransfer) {
      setError('Please select a pending production transfer.');
      return;
    }

    if (mainYieldPct < 0) {
      setError('Byproduct percentages exceed 100%. Please reduce Split or Husk values.');
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
          yieldPercent: mainYieldPct,
        },
        {
          destinationLocationId: splitDestLoc,
          materialId: splitMaterialId,
          yieldPercent: splitPct,
        },
        {
          destinationLocationId: huskDestLoc,
          materialId: huskMaterialId,
          yieldPercent: huskPct,
        }
      ];

      const body: any = {
        transferId: selectedTransfer._id,
        totalYieldPercent: 100,
        outputs
      };

      // Include output moisture if provided
      const outMoist = parseFloat(outputMoisture);
      if (!isNaN(outMoist) && outMoist >= 0) {
        body.outputMoisture = outMoist;
      }

      await api.post('/production/yield', body);

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
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className="text-stone-500 mt-2 font-sansMedium">Loading pending lab entries...</Text>
      </View>
    );
  }

  const getLocName = (id: string) => locations.find((l) => l._id === id)?.name || 'Select';

  return (
    <ScrollView className="flex-1 bg-stone-50 p-6">
      <View className="bg-white p-6 rounded-[24px] shadow-sm border border-stone-200 mb-6">
        <Text className="text-2xl font-displayExtraBold mb-1 text-stone-900">Submit Laboratory Yield</Text>
        <Text className="text-stone-500 mb-6 font-sans text-sm">Enter byproduct percentages — main output is auto-derived</Text>
        
        <ErrorBanner message={error} />

        {/* Transfer Selection */}
        <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2">Pending Production Transfer</Text>
        {pendingTransfers.length === 0 ? (
          <View className="bg-stone-100 p-4 rounded-2xl border border-stone-200 mb-4">
            <Text className="text-stone-500 text-sm font-sans">No pending transfers awaiting lab yield.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row space-x-2">
            {pendingTransfers.map((t) => (
              <TouchableOpacity
                key={t._id}
                onPress={() => {
                  setSelectedTransfer(t);
                  if (t.destinationLocation) {
                    setMainDestLoc(t.destinationLocation._id || t.destinationLocation);
                  }
                }}
                className={`p-3.5 rounded-2xl border mr-2 ${selectedTransfer?._id === t._id ? 'bg-amber-500 border-amber-500' : 'bg-stone-100 border-stone-200'}`}
              >
                <Text className={`font-sansBold text-xs ${selectedTransfer?._id === t._id ? 'text-white' : 'text-stone-900'}`}>
                  {t.processingQty >= 1000 ? `${(t.processingQty / 1000).toFixed(1)} T` : `${t.processingQty} kg`}
                </Text>
                <Text className={`text-[11px] mt-1 font-sans ${selectedTransfer?._id === t._id ? 'text-amber-100' : 'text-stone-500'}`}>
                  {t.process?.name} • {t.sourceLocation?.name || 'N/A'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Transfer Summary Card */}
        {selectedTransfer && (
          <View className="bg-amber-500/10 p-4 rounded-2xl mb-5 border border-amber-500/20">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-stone-600 font-sans">Physical Weight (Gross)</Text>
              <Text className="font-sansBold text-stone-900 text-xs">
                {processingQty >= 1000 ? `${(processingQty / 1000).toFixed(1)} tons` : `${processingQty.toLocaleString()} kg`}
              </Text>
            </View>
            {selectedTransfer.inputMoisture != null && (
              <>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-stone-600 font-sans">I/P Moisture</Text>
                  <Text className="font-sansBold text-amber-700 text-xs">{selectedTransfer.inputMoisture}%</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-stone-600 font-sans">Adjusted Weight (Net)</Text>
                  <Text className="font-sansBold text-amber-700 text-xs">
                    {selectedTransfer.adjustedInputQty >= 1000
                      ? `${(selectedTransfer.adjustedInputQty / 1000).toFixed(1)} tons`
                      : `${selectedTransfer.adjustedInputQty?.toLocaleString()} kg`}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Byproduct Input: Split */}
        <View className="p-4 bg-stone-50 rounded-2xl mb-3 border border-stone-200">
          <Text className="font-sansBold text-sm text-stone-900 mb-2">🔹 Split / Broken Dal</Text>
          <NumericInput
            label="Split Yield (%)"
            suffix="%"
            value={splitYield}
            onChangeText={setSplitYield}
            placeholder="10"
          />
          <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2 mt-3">Destination Silo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc._id}
                onPress={() => setSplitDestLoc(loc._id)}
                className={`px-3 py-2 rounded-xl border mr-1 ${splitDestLoc === loc._id ? 'bg-blue-500 border-blue-500' : 'bg-stone-100 border-stone-200'}`}
              >
                <Text className={`font-sansBold text-[11px] ${splitDestLoc === loc._id ? 'text-white' : 'text-stone-700'}`}>
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {splitPct > 0 && processingQty > 0 && (
            <View className="bg-blue-50 mt-3 p-3 rounded-xl border border-blue-100">
              <Text className="font-sansBold text-blue-700 text-sm">
                → {calculations.splitQty >= 1000 ? `${(calculations.splitQty / 1000).toFixed(2)} tons` : `${calculations.splitQty} kg`} to {getLocName(splitDestLoc)}
              </Text>
            </View>
          )}
        </View>

        {/* Byproduct Input: Husk */}
        <View className="p-4 bg-stone-50 rounded-2xl mb-3 border border-stone-200">
          <Text className="font-sansBold text-sm text-stone-900 mb-2">🔸 Husk / Chunni</Text>
          <NumericInput
            label="Husk Yield (%)"
            suffix="%"
            value={huskYield}
            onChangeText={setHuskYield}
            placeholder="3"
          />
          <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2 mt-3">Destination Silo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc._id}
                onPress={() => setHuskDestLoc(loc._id)}
                className={`px-3 py-2 rounded-xl border mr-1 ${huskDestLoc === loc._id ? 'bg-orange-500 border-orange-500' : 'bg-stone-100 border-stone-200'}`}
              >
                <Text className={`font-sansBold text-[11px] ${huskDestLoc === loc._id ? 'text-white' : 'text-stone-700'}`}>
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {huskPct > 0 && processingQty > 0 && (
            <View className="bg-orange-50 mt-3 p-3 rounded-xl border border-orange-100">
              <Text className="font-sansBold text-orange-700 text-sm">
                → {calculations.huskQty >= 1000 ? `${(calculations.huskQty / 1000).toFixed(2)} tons` : `${calculations.huskQty} kg`} to {getLocName(huskDestLoc)}
              </Text>
            </View>
          )}
        </View>

        {/* Auto-derived Main Output */}
        <View className="p-4 bg-emerald-50 rounded-2xl mb-3 border border-emerald-200">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-sansBold text-sm text-emerald-900">🟢 Main Dal (Auto-Derived)</Text>
            <View className="bg-emerald-100 px-2.5 py-1 rounded-full">
              <Text className="font-sansBold text-emerald-700 text-xs">{mainYieldPct}%</Text>
            </View>
          </View>
          <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2">Destination Silo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc._id}
                onPress={() => setMainDestLoc(loc._id)}
                className={`px-3 py-2 rounded-xl border mr-1 ${mainDestLoc === loc._id ? 'bg-emerald-500 border-emerald-500' : 'bg-stone-100 border-stone-200'}`}
              >
                <Text className={`font-sansBold text-[11px] ${mainDestLoc === loc._id ? 'text-white' : 'text-stone-700'}`}>
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {mainYieldPct > 0 && processingQty > 0 && (
            <View className="bg-emerald-100 mt-3 p-3 rounded-xl border border-emerald-200">
              <Text className="font-displayBold text-emerald-800 text-base">
                → {calculations.mainQty >= 1000 ? `${(calculations.mainQty / 1000).toFixed(2)} tons` : `${calculations.mainQty} kg`} to {getLocName(mainDestLoc)}
              </Text>
            </View>
          )}
        </View>

        {/* Optional Output Moisture */}
        <View className="p-4 bg-stone-50 rounded-2xl mb-3 border border-stone-200">
          <Text className="font-sansBold text-sm text-stone-900 mb-2">💧 O/P Moisture (Optional)</Text>
          <NumericInput
            label="Output Moisture %"
            suffix="%"
            value={outputMoisture}
            onChangeText={setOutputMoisture}
            placeholder="e.g. 12"
          />
          {(() => {
            const outM = parseFloat(outputMoisture);
            if (!isNaN(outM) && outM > 10 && processingQty > 0) {
              const deduction = processingQty * ((outM - 10) / 100);
              const adjusted = processingQty - deduction;
              return (
                <View className="bg-amber-50 mt-2 p-3 rounded-xl border border-amber-100">
                  <Text className="text-amber-700 font-sans text-xs">
                    Moisture deduction: {(deduction / 1000).toFixed(2)} tons → Adjusted: {(adjusted / 1000).toFixed(2)} tons
                  </Text>
                </View>
              );
            }
            if (!isNaN(outM) && outM <= 10 && processingQty > 0) {
              return (
                <View className="bg-emerald-50 mt-2 p-3 rounded-xl border border-emerald-100">
                  <Text className="text-emerald-700 font-sans text-xs">✓ Standard moisture (≤10%) — No deduction applied</Text>
                </View>
              );
            }
            return null;
          })()}
        </View>

        {/* Total Yield Indicator */}
        <View className={`p-4 rounded-2xl mb-4 flex-row justify-between items-center ${mainYieldPct >= 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-red-50 border border-red-200'}`}>
          <View>
            <Text className={`font-sansBold text-sm ${mainYieldPct >= 0 ? 'text-amber-800' : 'text-red-800'}`}>
              Total: {totalYield.toFixed(1)}%
            </Text>
            <Text className="text-stone-500 font-sans text-[11px] mt-0.5">
              Main {mainYieldPct}% + Split {splitPct}% + Husk {huskPct}%
            </Text>
          </View>
          <Text className={`text-xs font-sansBold ${mainYieldPct >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {mainYieldPct >= 0 ? '✓ Valid' : '✗ Overflow'}
          </Text>
        </View>

        <PrimaryButton 
          label="Submit Yield & Post Stock" 
          onPress={handleSubmit} 
          loading={loading}
          disabled={pendingTransfers.length === 0 || mainYieldPct < 0}
          iconName="check"
        />
      </View>
    </ScrollView>
  );
}
