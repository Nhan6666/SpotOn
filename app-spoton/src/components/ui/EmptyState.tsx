import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface EmptyStateProps {
  icon?: keyof typeof FontAwesome.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center py-12 px-6">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <FontAwesome name={icon} size={32} color={Colors.muted} />
      </View>
      <Text className="font-lexend font-bold text-lg text-text text-center mb-2">{title}</Text>
      {message && <Text className="font-lexend text-muted text-center mb-6 leading-5">{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity 
          className="bg-amber-50 px-6 py-3 rounded-full border border-amber-200"
          onPress={onAction}
        >
          <Text className="font-lexend font-bold text-amber-700">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
