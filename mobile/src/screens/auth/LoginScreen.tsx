import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import TextField from '../../components/inputs/TextField';
import PrimaryButton from '../../components/feedback/PrimaryButton';
import ErrorBanner from '../../components/feedback/ErrorBanner';
import { apiErrorMessage } from '../../services/api';

// DUMMY VALUES pre-filled for local dev convenience — remove before real deployment.
export default function LoginScreen() {
  const [email, setEmail] = useState('manager@toordal.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  async function handleLogin() {
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-stone-50">
      <View className="h-1/3 w-full absolute top-0">
        <Image
          source={require('../../../assets/toor_dal_macro.jpg')}
          style={{ width: '100%', height: '100%', opacity: 0.9 }}
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-stone-50/20" />
      </View>

      <View className="flex-1 justify-center px-6 mt-32">
        <View className="bg-white/90 p-6 rounded-[24px] shadow-sm border border-stone-100">
          <Text className="text-3xl font-displayExtraBold text-stone-900 mb-1">Toor Dal System</Text>
          <Text className="text-stone-500 mb-8 font-sansMedium">Sign in to continue</Text>

          <ErrorBanner message={error} />

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

          <View className="mt-4">
            <PrimaryButton label="Log In" onPress={handleLogin} loading={isLoading} iconName="arrow-right" />
          </View>
        </View>

        <Text className="text-stone-400 text-xs mt-6 text-center font-sans">
          Demo accounts (seeded): manager@toordal.test · supervisor.unit_1@toordal.test ·{'\n'}
          operator.unit_1@toordal.test — password: password123
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
