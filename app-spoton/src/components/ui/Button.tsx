import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', size = 'md' }: ButtonProps) {
  let bgClass = 'bg-primary';
  let textClass = 'text-white';
  
  if (variant === 'outline') {
    bgClass = 'bg-transparent border border-gray-300';
    textClass = 'text-gray-700';
  } else if (variant === 'ghost') {
    bgClass = 'bg-transparent';
    textClass = 'text-gray-700';
  } else if (variant === 'danger') {
    bgClass = 'bg-red-600';
    textClass = 'text-white';
  }

  let sizeClass = 'h-10 px-4 py-2';
  let textSizeClass = 'text-sm';
  if (size === 'sm') {
    sizeClass = 'h-8 px-3';
    textSizeClass = 'text-xs';
  } else if (size === 'lg') {
    sizeClass = 'h-12 px-6';
    textSizeClass = 'text-base';
  }

  return (
    <TouchableOpacity 
      className={`w-full rounded-md items-center justify-center flex-row ${bgClass} ${sizeClass} ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? 'white' : '#1f2937'} style={{ marginRight: 8 }} />
      ) : null}
      <Text className={`${textClass} font-lexend font-medium ${textSizeClass}`}>{title}</Text>
    </TouchableOpacity>
  );
}
