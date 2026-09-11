import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { api, apiErrorMessage } from '../../services/api';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import StatusBadge from '../../components/status/StatusBadge';
import { useAuthStore } from '../../store/useAuthStore';

export default function SupervisorDashboard({ navigation }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/supervisor');
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50 p-4">
        <Feather name="alert-circle" size={48} color="#dc2626" />
        <Text className="text-red-600 mt-4 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-stone-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-6 pt-10 bg-white border-b border-stone-200 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-displayExtraBold text-stone-900">Supervisor</Text>
          <Text className="text-stone-500 font-sansMedium text-sm mt-0.5">{user?.name || 'Unit Command Center'}</Text>
        </View>
        <TouchableOpacity 
          onPress={logout} 
          className="bg-stone-100 p-2.5 rounded-full border border-stone-200"
        >
          <Feather name="log-out" size={18} color="#57534E" />
        </TouchableOpacity>
      </View>

      <View className="p-6 space-y-6">

        {/* Summary Stats Row */}
        {data?.summary && (
          <View className="flex-row space-x-3 mb-2">
            <View className="flex-1 bg-amber-500 p-4 rounded-2xl">
              <Text className="text-amber-100 text-[10px] font-sansBold uppercase tracking-wider">Total Stock</Text>
              <Text className="text-white text-xl font-displayBold mt-1">
                {data.summary.totalStockTons} <Text className="text-sm font-sans text-amber-100">tons</Text>
              </Text>
            </View>
            <View className="flex-1 bg-white border border-stone-200 p-4 rounded-2xl">
              <Text className="text-stone-400 text-[10px] font-sansBold uppercase tracking-wider">Silos</Text>
              <Text className="text-stone-900 text-xl font-displayBold mt-1">
                {data.summary.totalSilos} <Text className="text-sm font-sans text-stone-400">total</Text>
              </Text>
            </View>
            <View className={`flex-1 p-4 rounded-2xl ${data.summary.idleSilosCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
              <Text className={`text-[10px] font-sansBold uppercase tracking-wider ${data.summary.idleSilosCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Idle {'>'}8h</Text>
              <Text className={`text-xl font-displayBold mt-1 ${data.summary.idleSilosCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {data.summary.idleSilosCount}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Navigation Shortcuts Grid */}
        <View className="flex-row flex-wrap justify-between mb-2">
          <TouchableOpacity 
            onPress={() => navigation.navigate('StockLedger')}
            className="w-[48%] bg-amber-500 p-4 rounded-2xl shadow-sm mb-3"
          >
            <Feather name="book-open" size={20} color="#fff" />
            <Text className="text-white font-sansBold text-base mt-2">Stock Ledger</Text>
            <Text className="text-amber-100 text-xs font-sans mt-0.5">Audit History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('StockAdjustment')}
            className="w-[48%] bg-white border border-stone-200 p-4 rounded-2xl shadow-sm mb-3"
          >
            <Feather name="edit-3" size={20} color="#F59E0B" />
            <Text className="text-stone-800 font-sansBold text-base mt-2">Adjustment</Text>
            <Text className="text-stone-400 text-xs font-sans mt-0.5">Manual Fix</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('AuditLogs')}
            className="w-[48%] bg-white border border-stone-200 p-4 rounded-2xl shadow-sm mb-3"
          >
            <Feather name="shield" size={20} color="#F59E0B" />
            <Text className="text-stone-800 font-sansBold text-base mt-2">Audit Logs</Text>
            <Text className="text-stone-400 text-xs font-sans mt-0.5">Activity Stream</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('UserList')}
            className="w-[48%] bg-stone-900 p-4 rounded-2xl shadow-sm mb-3"
          >
            <Feather name="users" size={20} color="#fff" />
            <Text className="text-white font-sansBold text-base mt-2">Team Profiles</Text>
            <Text className="text-stone-400 text-xs font-sans mt-0.5">User Access</Text>
          </TouchableOpacity>
        </View>
        
        {/* Exceptions & Alerts */}
        <View>
          <Text className="text-[13px] font-sansBold text-stone-500 uppercase tracking-wide mb-3 flex-row items-center">
            <Feather name="bell" size={14} color="#dc2626" /> Action Required
          </Text>
          {data?.exceptions?.length > 0 ? (
            data.exceptions.map((ex: any) => (
              <TouchableOpacity 
                key={ex._id} 
                onPress={() => navigation.navigate('Yield')}
                className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-3 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="font-sansBold text-amber-900">Pending Lab Yield</Text>
                  <Text className="text-amber-700 text-xs mt-1 font-sans">
                    {ex.processingQty >= 1000 ? `${(ex.processingQty / 1000).toFixed(1)} tons` : `${ex.processingQty.toLocaleString()} kg`}
                    {ex.inputMoisture != null ? ` @ ${ex.inputMoisture}% moisture` : ''}
                  </Text>
                  <Text className="text-amber-600 text-[10px] mt-0.5 font-sans">
                    {ex.process?.name} • {ex.sourceLocation?.name}{ex.destinationLocation ? ` → ${ex.destinationLocation?.name}` : ''}
                  </Text>
                </View>
                <View className="bg-amber-500 rounded-full p-1.5">
                  <Feather name="chevron-right" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white border border-stone-200 p-4 rounded-2xl items-center">
              <Feather name="check-circle" size={20} color="#16A34A" className="mb-1" />
              <Text className="text-stone-700 font-sansBold text-sm">All caught up!</Text>
            </View>
          )}
        </View>

        {/* Global Stock Overview */}
        <View>
          <Text className="text-[13px] font-sansBold text-stone-500 uppercase tracking-wide mb-3">Unit Stock Overview</Text>
          <View className="flex-row flex-wrap justify-between">
            {data?.stock?.length > 0 ? (
              data.stock.map((s: any, index: number) => (
                <View key={index} className="bg-white w-[48%] p-3.5 rounded-2xl mb-3 shadow-sm border border-stone-200">
                  <Text className="text-stone-400 text-[10px] uppercase font-sansBold tracking-wider mb-1" numberOfLines={1}>
                    {s.materialCode || s.materialName || s.materialId?.substring(0,6)}
                  </Text>
                  <Text className="text-xl font-displayBold text-amber-600" numberOfLines={1} adjustsFontSizeToFit>
                    {s.netQuantityTons != null ? s.netQuantityTons : (s.netQuantity / 1000).toFixed(1)} <Text className="text-xs font-sans text-stone-400">tons</Text>
                  </Text>
                  <Text className="text-stone-400 text-[10px] font-sans mt-0.5">{s.netQuantity.toLocaleString()} kg</Text>
                </View>
              ))
            ) : (
              <Text className="text-stone-400 text-sm font-sans">No stock on hand.</Text>
            )}
          </View>
        </View>

        {/* Silo / Location Status with Idle Time */}
        <View>
          <Text className="text-[13px] font-sansBold text-stone-500 uppercase tracking-wide mb-3">Silo Status & Idle Time</Text>
          {data?.siloStatus?.map((loc: any) => (
            <View key={loc._id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-stone-200">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center flex-1">
                  <View className="bg-amber-500/10 p-2 rounded-xl mr-3">
                    <MaterialCommunityIcons name="silo" size={18} color="#F59E0B" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sansBold text-stone-800" numberOfLines={1}>{loc.name}</Text>
                    <Text className="text-stone-400 text-[10px] font-sans">
                      {loc.currentQuantityTons != null ? `${loc.currentQuantityTons} T` : `${(loc.currentQuantityKg || 0).toLocaleString()} kg`}
                      {loc.capacityKg ? ` / ${(loc.capacityKg / 1000).toFixed(0)} T` : ''}
                      {loc.fillPercentage != null ? ` (${loc.fillPercentage}%)` : ''}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  {loc.status && <StatusBadge status={loc.status} />}
                  <View className={`mt-1 px-2.5 py-0.5 rounded-full ${loc.idleTimeMinutes != null && loc.idleTimeMinutes > 480 ? 'bg-red-50' : 'bg-stone-100'}`}>
                    <Text className={`text-[10px] font-sansBold ${loc.idleTimeMinutes != null && loc.idleTimeMinutes > 480 ? 'text-red-500' : 'text-stone-500'}`}>
                      ⏱ {loc.idleTimeFormatted || 'No activity'}
                    </Text>
                  </View>
                </View>
              </View>
              {/* Mini progress bar */}
              {loc.fillPercentage != null && (
                <View className="bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <View className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, loc.fillPercentage)}%` }} />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Recent Audit Logs Stream */}
        <View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[13px] font-sansBold text-stone-500 uppercase tracking-wide">
              Recent Audit Logs
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AuditLogs')}>
              <Text className="text-amber-600 font-sansBold text-xs">View All Logs →</Text>
            </TouchableOpacity>
          </View>

          {data?.recentAuditLogs?.length > 0 ? (
            data.recentAuditLogs.map((log: any) => (
              <View 
                key={log._id} 
                className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-stone-200"
              >
                <View className="flex-row justify-between items-center mb-1">
                  <View className="bg-amber-500/10 px-2.5 py-0.5 rounded-md">
                    <Text className="font-sansBold text-amber-800 text-[10px]">{log.action}</Text>
                  </View>
                  <Text className="text-stone-400 font-sans text-[11px]">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <Text className="font-sansBold text-stone-900 text-sm mt-1">
                  By: {log.user?.name || 'System'} ({log.user?.role || 'USER'})
                </Text>
                <Text className="text-stone-400 font-sans text-xs mt-0.5">
                  Entity: {log.entityType} • Ref: {String(log.entityId || log._id).substring(0, 8)}
                </Text>
              </View>
            ))
          ) : (
            <View className="bg-white border border-stone-200 p-4 rounded-2xl items-center">
              <Text className="text-stone-400 font-sans text-sm">No recent audit logs.</Text>
            </View>
          )}
        </View>

        {/* Adjustments */}
        <View className="mt-2 mb-8">
          <PrimaryButton 
            label="Make Stock Adjustment" 
            iconName="edit-3" 
            onPress={() => navigation.navigate('StockAdjustment')} 
          />
        </View>

      </View>
    </ScrollView>
  );
}
