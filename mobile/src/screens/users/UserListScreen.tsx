import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function UserListScreen({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  return (
    <ScreenContainer scroll={false}>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-3xl font-displayExtraBold text-stone-900">Team Profiles</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateUser')}
          className="bg-amber-500 p-2.5 rounded-2xl flex-row items-center space-x-1.5"
        >
          <Feather name="user-plus" size={18} color="#fff" />
          <Text className="text-white font-sansBold text-xs ml-1">Add User</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-stone-500 font-sans text-sm mb-5">Manage operator and supervisor access accounts</Text>

      {error ? (
        <View className="bg-red-50 p-4 rounded-2xl border border-red-200 mb-4">
          <Text className="text-red-700 text-xs font-sans">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} />}
        ListEmptyComponent={
          <View className="bg-white p-8 rounded-2xl items-center justify-center border border-dashed border-stone-200 mt-6">
            <Feather name="users" size={36} color="#a8a29e" />
            <Text className="text-stone-400 font-sans mt-2">No team profiles found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white border border-stone-200 rounded-[22px] p-4 mb-3 shadow-sm flex-row justify-between items-center">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center space-x-2">
                <Text className="font-sansBold text-stone-900 text-base">{item.name}</Text>
                <View className={`px-2 py-0.5 rounded-md ${item.role === 'SUPERVISOR' ? 'bg-amber-500/10' : 'bg-stone-100'}`}>
                  <Text className={`text-[10px] font-sansBold ${item.role === 'SUPERVISOR' ? 'text-amber-700' : 'text-stone-600'}`}>
                    {item.role}
                  </Text>
                </View>
              </View>

              <Text className="text-stone-500 font-sans text-xs mt-1">{item.email}</Text>
              <Text className="text-stone-400 font-sans text-[11px] mt-0.5">
                Unit: {item.unit?.name || 'All Units'}
              </Text>
            </View>

            <View className={`px-2.5 py-1 rounded-full ${item.isActive ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <Text className={`text-[11px] font-sansBold ${item.isActive ? 'text-emerald-700' : 'text-red-700'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
