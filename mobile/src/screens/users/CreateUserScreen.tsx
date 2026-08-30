import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { api, apiErrorMessage } from '../../services/api';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';

export default function CreateUserScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'OPERATOR' | 'SUPERVISOR'>('OPERATOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAuthStore((s) => s.user);

  const handleCreate = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError('Please fill in all fields (Name, Email, and Password).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users', {
        name,
        email,
        password,
        role,
        unitId: currentUser?.unit?._id || currentUser?.unit
      });

      Alert.alert('Success', `User profile created for ${name} (${role})! They can now log in.`, [
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

  return (
    <ScrollView className="flex-1 bg-stone-50 p-6">
      <View className="bg-white p-6 rounded-[24px] shadow-sm border border-stone-200 mb-6">
        <Text className="text-2xl font-displayExtraBold mb-1 text-stone-900">Create Team Profile</Text>
        <Text className="text-stone-500 mb-6 font-sans text-sm">Add a new user and grant application access</Text>

        <ErrorBanner message={error} />

        <TextField
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rajesh Kumar"
        />

        <TextField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. rajesh.operator@toordal.test"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          label="Temporary Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password (min 6 characters)"
          secureTextEntry
        />

        {/* Role Selector */}
        <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2 mt-2">Assign Role</Text>
        <View className="flex-row space-x-2 mb-6">
          <TouchableOpacity
            onPress={() => setRole('OPERATOR')}
            className={`flex-1 py-3 rounded-2xl border items-center flex-row justify-center space-x-1.5 ${role === 'OPERATOR' ? 'bg-amber-500 border-amber-500' : 'bg-stone-100 border-stone-200'}`}
          >
            <Feather name="tool" size={16} color={role === 'OPERATOR' ? '#fff' : '#57534E'} />
            <Text className={`font-sansBold text-xs ml-1 ${role === 'OPERATOR' ? 'text-white' : 'text-stone-700'}`}>
              Operator
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole('SUPERVISOR')}
            className={`flex-1 py-3 rounded-2xl border items-center flex-row justify-center space-x-1.5 ${role === 'SUPERVISOR' ? 'bg-stone-900 border-stone-900' : 'bg-stone-100 border-stone-200'}`}
          >
            <Feather name="shield" size={16} color={role === 'SUPERVISOR' ? '#fff' : '#57534E'} />
            <Text className={`font-sansBold text-xs ml-1 ${role === 'SUPERVISOR' ? 'text-white' : 'text-stone-700'}`}>
              Supervisor
            </Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          label="Create Profile"
          onPress={handleCreate}
          loading={loading}
          iconName="user-check"
        />
      </View>
    </ScrollView>
  );
}
