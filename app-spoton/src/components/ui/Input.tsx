import { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, secureTextEntry, ...props }: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

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
          className={`w-full bg-white border border-gray-300 rounded-md font-lexend text-text text-sm py-3 ${icon ? 'pl-10' : 'pl-4'} ${secureTextEntry ? 'pr-12' : 'pr-4'}`}
          placeholderTextColor="#9ca3af"
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry !== undefined && (
          <TouchableOpacity 
            onPress={() => setIsSecure(!isSecure)} 
            className="absolute right-3 z-10 p-1"
          >
            <FontAwesome name={isSecure ? "eye-slash" : "eye"} size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
