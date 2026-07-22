import { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from './auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function OtpVerificationFeature() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { checkAuth } = useAuthStore();

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.verifyOtp(email, otp);
      if (data.success) {
        // Backend returns token at root level OR inside data
        const token = data.token || data.data?.token;
        if (token) {
          await AsyncStorage.setItem('token', token);
        }
        await checkAuth();
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Xác thực thất bại', data.message);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Mã OTP không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-background px-6">
      {/* Nút quay lại */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-14 left-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-200 z-10"
      >
        <Text className="text-text text-xl">←</Text>
      </TouchableOpacity>

      <View className="mb-10 items-center">
        <Text className="text-primary text-4xl font-lexend font-bold mb-2">Xác thực</Text>
        <Text className="text-muted text-base font-lexend text-center">
          Chúng tôi đã gửi mã OTP 6 số đến{'\n'}
          <Text className="font-bold text-text">{email}</Text>
        </Text>
      </View>

      <View className="gap-4">
        <Input
          label="Mã OTP"
          placeholder="Nhập mã 6 chữ số"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          style={{ fontSize: 24, letterSpacing: 8 }}
        />
        
        <Button 
          title="Xác nhận"
          onPress={handleVerify}
          loading={loading}
        />
      </View>
    </View>
  );
}
