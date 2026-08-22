import React, { useState } from 'react';
import { View, Text } from 'react-native';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { useAuthStore } from '../../store/useAuthStore';
import { api, apiErrorMessage } from '../../services/api';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleChangePassword() {
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setSuccess(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text className="text-2xl font-displayExtraBold text-stone-900 font-sansBold mb-1">Settings</Text>
      <Text className="text-stone-500 font-sansMedium mb-6">
        {user?.name} · {user?.role}
      </Text>

      <ErrorBanner message={error} />
      {success && <Text className="text-green-600 mb-4">Password updated.</Text>}

      <TextField label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <TextField label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

      <View className="mb-6">
        <PrimaryButton label="Change Password" onPress={handleChangePassword} loading={submitting} variant="outline" />
      </View>

      <PrimaryButton label="Log Out" onPress={() => logout()} variant="danger" />
    </ScreenContainer>
  );
}
