import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import { api } from '../../services/api';
import type { YieldResult } from '../../types';

export default function YieldScreen() {
  const [y7, setY7] = useState<YieldResult | null>(null);
  const [y30, setY30] = useState<YieldResult | null>(null);
  const [variance, setVariance] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      api.get('/yield?window=7d').then((res) => setY7(res.data.data));
      api.get('/yield?window=30d').then((res) => setY30(res.data.data));
      api.get('/yield/variance?window=30d').then((res) => setVariance(res.data.data));
    }, [])
  );

  return (
    <ScreenContainer>
      <Text className="text-3xl font-displayExtraBold text-stone-900 mb-6">Yield</Text>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-amber-500 rounded-[20px] p-5 shadow-sm">
          <Text className="text-amber-50 text-[13px] font-sansMedium mb-1">7-Day Yield</Text>
          <Text className="text-white text-3xl font-displayBold">{y7?.yieldPct != null ? `${y7.yieldPct}%` : '—'}</Text>
        </View>
        <View className="flex-1 bg-stone-900 rounded-[20px] p-5 shadow-sm">
          <Text className="text-stone-400 text-[13px] font-sansMedium mb-1">30-Day Yield</Text>
          <Text className="text-white text-3xl font-displayBold">{y30?.yieldPct != null ? `${y30.yieldPct}%` : '—'}</Text>
        </View>
      </View>

      <View className="bg-amber-50 rounded-[20px] p-5 mb-6 border border-amber-100">
        <Text className="text-stone-500 text-[13px] font-sansMedium mb-4 uppercase tracking-wide">Expected vs Actual (30d)</Text>
        <Row label="Expected (Lab)" value={variance?.expectedPct != null ? `${variance.expectedPct}%` : '—'} />
        <Row label="Actual" value={variance?.yieldPct != null ? `${variance.yieldPct}%` : '—'} />
        <Row label="Variance" value={variance?.variance != null ? `${variance.variance}%` : '—'} bold />
      </View>

      <Text className="text-stone-400 font-sans text-[11px] leading-4 text-center mt-4">
        Yield = total dispatched ÷ total adjusted intake × 100, computed as a weighted sum over the
        selected window — never averaged day-by-day (SRS §25). Window boundaries (calendar-day vs.
        rolling 24h vs. business-day, timezone) are a placeholder pending client confirmation (§48.9).
      </Text>
    </ScreenContainer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-amber-200/50">
      <Text className="text-stone-500 font-sans">{label}</Text>
      <Text className={`text-stone-900 font-sansBold text-base ${bold ? 'text-amber-600' : ''}`}>{value}</Text>
    </View>
  );
}
