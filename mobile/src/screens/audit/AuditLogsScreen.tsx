import React, { useCallback, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import { api } from '../../services/api';

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get('/audit-logs').then((res) => setLogs(res.data.data));
    }, [])
  );

  return (
    <ScreenContainer scroll={false}>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-4">Audit Logs</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<Text className="text-stone-400 font-sans">No audit entries yet.</Text>}
        renderItem={({ item }) => (
          <View className="bg-stone-100 rounded-xl px-4 py-3 mb-2">
            <Text className="font-sansBold text-stone-900 font-sansBold">{item.action}</Text>
            <Text className="text-stone-500 font-sansMedium text-xs">{item.user?.name} · {item.unit?.name}</Text>
            <Text className="text-stone-400 font-sans text-xs">{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
