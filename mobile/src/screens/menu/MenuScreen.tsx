import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/feedback/ScreenContainer';
import { useAuthStore } from '../../store/useAuthStore';

interface MenuItem {
  title: string;
  subtitle: string;
  screen: string;
  iconProvider: 'feather' | 'material';
  iconName: string;
  color: string;
  bgColor: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Raw Intake Register',
    subtitle: 'Weighbridge receiving & moisture tests',
    screen: 'Intake',
    iconProvider: 'feather',
    iconName: 'truck',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    title: 'By-products Management',
    subtitle: 'Husk (Bhusa), Powder (Chunni), Tukda',
    screen: 'ByProducts',
    iconProvider: 'material',
    iconName: 'recycle-variant',
    color: '#059669',
    bgColor: '#D1FAE5',
  },
  {
    title: 'Inter-Unit Transfers',
    subtitle: 'Movement between Unit 1, 2 & 3',
    screen: 'Transfers',
    iconProvider: 'material',
    iconName: 'swap-horizontal',
    color: '#2563EB',
    bgColor: '#DBEAFE',
  },
  {
    title: 'Finished Dispatch',
    subtitle: 'Truck loading & customer shipments',
    screen: 'Dispatch',
    iconProvider: 'material',
    iconName: 'truck-fast-outline',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  {
    title: 'Shift Summary Logs',
    subtitle: 'Operator handover & processing logs',
    screen: 'Shifts',
    iconProvider: 'feather',
    iconName: 'clock',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    title: 'Settings & Security',
    subtitle: 'Password change & account profile',
    screen: 'Settings',
    iconProvider: 'feather',
    iconName: 'settings',
    color: '#475569',
    bgColor: '#F1F5F9',
  },
];

export default function MenuScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);

  return (
    <ScreenContainer>
      <View className="mb-6">
        <Text className="text-3xl font-displayExtraBold text-stone-900">Operations Hub</Text>
        <Text className="text-stone-500 font-sans text-sm mt-1">
          Quick access to all mill logging & dispatch modules
        </Text>
      </View>

      <View className="space-y-3">
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
            className="bg-white border border-stone-200 p-4 rounded-2xl flex-row items-center justify-between shadow-sm mb-3"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View 
                style={{ backgroundColor: item.bgColor }} 
                className="w-12 h-12 rounded-xl items-center justify-center mr-3.5"
              >
                {item.iconProvider === 'feather' ? (
                  <Feather name={item.iconName as any} size={22} color={item.color} />
                ) : (
                  <MaterialCommunityIcons name={item.iconName as any} size={24} color={item.color} />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-sansBold text-stone-900 text-base">{item.title}</Text>
                <Text className="text-stone-500 font-sans text-xs mt-0.5" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>

      <View className="mt-4 p-4 bg-stone-100 rounded-2xl border border-stone-200">
        <Text className="text-stone-500 font-sans text-xs text-center">
          Logged in as <Text className="font-sansBold text-stone-700">{user?.name}</Text> ({user?.role})
        </Text>
      </View>
    </ScreenContainer>
  );
}
