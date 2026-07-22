import { View, Text } from 'react-native';

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="font-lexend text-muted">{label}</Text>
      <Text className="font-lexend font-semibold text-text">{value}</Text>
    </View>
  );
}
