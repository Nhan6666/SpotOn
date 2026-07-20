import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANTS = {
  default: { bg: 'bg-gray-100', text: 'text-gray-700' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
  primary: { bg: 'bg-amber-100', text: 'text-amber-700' }, // using amber as primary
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const styles = VARIANTS[variant] || VARIANTS.default;
  
  return (
    <View className={`px-2.5 py-1 rounded-full self-start flex-row items-center justify-center ${styles.bg}`}>
      <Text className={`font-lexend font-bold text-xs ${styles.text}`}>{label}</Text>
    </View>
  );
}
