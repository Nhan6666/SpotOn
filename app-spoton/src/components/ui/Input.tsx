import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-lexend text-muted mb-1">{label}</Text>}
      <View className="relative w-full justify-center">
        {icon && (
          <View className="absolute left-3 z-10 items-center justify-center">
            {icon}
          </View>
        )}
        <TextInput
          className={`w-full bg-white border border-gray-300 rounded-md font-lexend text-text text-sm h-10 ${icon ? 'pl-10 pr-3' : 'px-3'}`}
          placeholderTextColor="#9ca3af"
          {...props}
        />
      </View>
    </View>
  );
}
