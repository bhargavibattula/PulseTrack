import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-3xl font-displayExtraBold text-stone-900">Audit Logs</Text>
        <View className="bg-amber-500/10 p-2.5 rounded-2xl">
          <Feather name="shield" size={20} color="#F59E0B" />
        </View>
      </View>
      <Text className="text-stone-500 font-sans text-sm mb-5">Immutable action stream for system compliance</Text>

      {error ? (
        <View className="bg-red-50 p-4 rounded-2xl border border-red-200 mb-4">
          <Text className="text-red-700 text-xs font-sans">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLogs(); }} />}
        ListEmptyComponent={
          <View className="bg-white p-8 rounded-2xl items-center justify-center border border-dashed border-stone-200 mt-6">
            <Feather name="file-text" size={36} color="#a8a29e" />
            <Text className="text-stone-400 font-sans mt-2">No audit entries found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white border border-stone-200 rounded-[20px] p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between items-center mb-1.5">
              <View className="bg-stone-100 px-2.5 py-0.5 rounded-md">
                <Text className="font-sansBold text-stone-800 text-[11px]">{item.action}</Text>
              </View>
              <Text className="text-stone-400 font-sans text-[11px]">
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <Text className="font-sansBold text-stone-900 text-sm mt-1">
              By: {item.user?.name || 'System'} ({item.user?.role || 'USER'})
            </Text>
            <Text className="text-stone-500 font-sans text-xs mt-0.5">
              Entity: {item.entityType} • Ref: {String(item.entityId).substring(0, 8)}
            </Text>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
