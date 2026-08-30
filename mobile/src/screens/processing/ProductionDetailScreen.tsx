import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { api, apiErrorMessage } from '../../services/api';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import { Feather } from '@expo/vector-icons';

export default function ProductionDetailScreen({ route }: any) {
  const { transferId } = route.params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await api.get(`/production/transfers/${transferId}`);
        setData(res.data.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [transferId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50 p-4">
        <Text className="text-red-600 font-sans text-center">{error || 'Record not found'}</Text>
      </View>
    );
  }

  const { transfer, yieldResult, yieldOutputs } = data;

  return (
    <ScreenContainer>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-3xl font-displayExtraBold text-stone-900">Run Details</Text>
        <View className={`px-2.5 py-1 rounded-full ${transfer.status === 'COMPLETED' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <Text className={`text-xs font-sansBold ${transfer.status === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-700'}`}>
            {transfer.status}
          </Text>
        </View>
      </View>
      <Text className="text-stone-500 font-sans text-xs mb-6">Ref: {transfer._id}</Text>

      {/* Input Summary Card */}
      <View className="bg-white border border-stone-200 rounded-[22px] p-5 mb-4 shadow-sm">
        <Text className="text-stone-400 font-sansBold text-[11px] uppercase tracking-wider mb-2">Input Details</Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-stone-500 font-sans">Process</Text>
          <Text className="text-stone-900 font-sansBold">{transfer.process?.name || 'N/A'}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-stone-500 font-sans">Shift</Text>
          <Text className="text-stone-900 font-sansBold">{transfer.shift?.name || 'N/A'}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-stone-500 font-sans">Source Silo</Text>
          <Text className="text-stone-900 font-sansBold">{transfer.sourceLocation?.name || 'N/A'} ({transfer.sourceLocation?.code})</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-stone-500 font-sans">Physical Processing Qty</Text>
          <Text className="text-stone-900 font-displayBold">{transfer.processingQty?.toLocaleString()} kg</Text>
        </View>
        {transfer.inputMoisture != null && (
          <View className="flex-row justify-between pt-2 border-t border-stone-100">
            <Text className="text-stone-500 font-sans">Moisture Adj. (10% Std)</Text>
            <Text className="text-amber-600 font-sansBold">{transfer.inputMoisture}% → {transfer.adjustedInputQty?.toLocaleString()} kg</Text>
          </View>
        )}
      </View>

      {/* Lab Yield Breakdown */}
      <View className="bg-white border border-stone-200 rounded-[22px] p-5 mb-4 shadow-sm">
        <Text className="text-stone-400 font-sansBold text-[11px] uppercase tracking-wider mb-2">Lab Yield Outputs</Text>
        {yieldResult ? (
          <View>
            <Text className="text-stone-500 text-xs font-sans mb-3">
              Submitted by: <Text className="font-sansBold text-stone-800">{yieldResult.enteredBy?.name || 'Lab'}</Text>
            </Text>
            {yieldOutputs?.map((out: any, index: number) => (
              <View key={index} className="p-3 bg-stone-50 rounded-2xl mb-2 flex-row justify-between items-center">
                <View>
                  <Text className="font-sansBold text-stone-800 text-xs">{out.material?.name || 'Output'}</Text>
                  <Text className="text-stone-400 font-sans text-[11px]">Dest: {out.destinationLocation?.name || 'Silo'}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-displayBold text-amber-600 text-base">{out.adjustedQty || out.calculatedQty} kg</Text>
                  <Text className="text-stone-400 font-sans text-[10px]">Yield: {out.yieldPercent}%</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="p-4 bg-amber-500/10 rounded-2xl items-center">
            <Text className="text-amber-800 font-sansBold text-xs">Awaiting Lab Yield Entry</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
