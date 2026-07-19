import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthService } from './auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function RegisterFeature() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !fullName || !phone) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.register({
        full_name: fullName,
        email,
        phone,
        password,
      });

      if (data.success) {
        Alert.alert('Thành công', 'Tạo tài khoản thành công! Vui lòng xác thực email.');
        router.push({
          pathname: '/(auth)/otp',
          params: { email: data.data?.email || email }
        });
      } else {
        Alert.alert('Đăng ký thất bại', data.message);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background">
      <View className="flex-1 justify-center bg-background px-6">
      {/* Back button */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-14 left-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-200 z-10"
      >
        <Text className="text-text text-xl">←</Text>
      </TouchableOpacity>
      <View className="mb-10 items-center">
        <Text className="text-primary text-4xl font-lexend font-bold mb-2">SpotOn</Text>
        <Text className="text-muted text-base font-lexend">Tạo tài khoản</Text>
      </View>

        <View className="gap-2">
          <Input
            label="Họ và tên"
            placeholder="Nhập họ tên đầy đủ"
            value={fullName}
            onChangeText={setFullName}
          />
          <Input
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Mật khẩu"
            placeholder="Tạo mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button 
            title="Đăng ký"
            onPress={handleRegister}
            loading={loading}
          />
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-muted font-lexend">Đã có tài khoản? </Text>
          <Link href="/login" asChild>
            <Text className="text-primary font-lexend font-bold ml-1">Đăng nhập</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
