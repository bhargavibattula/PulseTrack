import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SearchablePickerProps {
  label: string;
  items: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  displayField?: string;   // property name to display (default: 'name')
  subtitleField?: string;   // optional subtitle field (e.g. 'code')
  placeholder?: string;
  accentColor?: string;     // for selected highlight
}

/**
 * A searchable modal picker for long lists of silos/locations/materials.
 * Shows a compact selected-item chip, and opens a full-screen modal with
 * a search bar when tapped.
 */
export default function SearchablePicker({
  label,
  items,
  selectedId,
  onSelect,
  displayField = 'name',
  subtitleField = 'code',
  placeholder = 'Search...',
  accentColor = '#F59E0B',
}: SearchablePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedItem = items.find(i => i._id === selectedId);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (i) =>
        (i[displayField] || '').toLowerCase().includes(lower) ||
        (i[subtitleField] || '').toLowerCase().includes(lower)
    );
  }, [items, search, displayField, subtitleField]);

  return (
    <View className="mb-4">
      <Text className="text-stone-500 text-[13px] font-sansBold uppercase tracking-wide mb-2">
        {label}
      </Text>

      {/* Compact chip showing selected item */}
      <TouchableOpacity
        onPress={() => { setSearch(''); setOpen(true); }}
        className="flex-row items-center justify-between bg-white border border-stone-200 rounded-2xl px-4 py-3.5"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-2.5 h-2.5 rounded-full mr-3"
            style={{ backgroundColor: selectedItem ? accentColor : '#d6d3d1' }}
          />
          <View className="flex-1">
            <Text
              className={`font-sansBold text-sm ${selectedItem ? 'text-stone-900' : 'text-stone-400'}`}
              numberOfLines={1}
            >
              {selectedItem ? selectedItem[displayField] : 'Tap to select...'}
            </Text>
            {selectedItem && selectedItem[subtitleField] && (
              <Text className="text-stone-400 font-sans text-[11px]">
                {selectedItem[subtitleField]}
              </Text>
            )}
          </View>
        </View>
        <Feather name="chevron-down" size={18} color="#a8a29e" />
      </TouchableOpacity>

      {/* Full-screen picker modal */}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-stone-50">
          {/* Header */}
          <View className="bg-white border-b border-stone-200 px-5 pt-14 pb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-displayExtraBold text-stone-900">
                {label}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                className="bg-stone-100 p-2 rounded-xl"
              >
                <Feather name="x" size={20} color="#57534e" />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View className="flex-row items-center bg-stone-100 rounded-2xl px-4 py-3">
              <Feather name="search" size={16} color="#a8a29e" />
              <TextInput
                className="flex-1 ml-2.5 font-sans text-stone-900 text-sm"
                placeholder={placeholder}
                placeholderTextColor="#a8a29e"
                value={search}
                onChangeText={setSearch}
                autoFocus
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x-circle" size={16} color="#a8a29e" />
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-stone-400 font-sans text-xs mt-2">
              {filtered.length} of {items.length} items
            </Text>
          </View>

          {/* Results list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="bg-white p-8 rounded-2xl items-center mt-4 border border-dashed border-stone-200">
                <Feather name="search" size={28} color="#d6d3d1" />
                <Text className="text-stone-400 font-sans mt-2 text-sm">
                  No results for "{search}"
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item._id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item._id);
                    setOpen(false);
                  }}
                  className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
                    isSelected
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3.5 items-center justify-center ${
                      isSelected ? 'border-amber-500' : 'border-stone-300'
                    }`}
                  >
                    {isSelected && (
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-sansBold text-sm ${
                        isSelected ? 'text-amber-800' : 'text-stone-900'
                      }`}
                      numberOfLines={1}
                    >
                      {item[displayField]}
                    </Text>
                    {item[subtitleField] && (
                      <Text className="text-stone-400 font-sans text-[11px]">
                        {item[subtitleField]}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <Feather name="check" size={18} color={accentColor} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
