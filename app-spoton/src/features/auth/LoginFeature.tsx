import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from './auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

export function LoginFeature() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  // Google OAuth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'dummy-android-client-id.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'dummy-ios-client-id.apps.googleusercontent.com',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'dummy-web-client-id.apps.googleusercontent.com',
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.login(email, password);
      if (data.success) {
        await AsyncStorage.setItem('token', data.data.token);
        await checkAuth();
        setTimeout(() => {
          const r = data.data.user.role;
          if (r === 'ADMIN') router.replace('/admin-dashboard');
          else if (r === 'MANAGER') router.replace('/branch-manage');
          else if (r === 'WAITER') router.replace('/pos');
          else if (r === 'KITCHEN') router.replace('/kds');
          else router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Login Failed', data.message);
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.data?.needsVerification) {
        router.push({
          pathname: '/(auth)/otp',
          params: { email: error.response.data.data.email }
        });
      } else {
        Alert.alert('Đăng nhập thất bại', error.response?.data?.message || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Nếu đang chạy trên Expo Go mà thiếu cấu hình Android Client ID chuẩn của Google,
    // Google sẽ chặn redirect với lỗi 400 invalid_request. 
    // Do đó, ta fallback về Mock Login để dev test UI.
    if (!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID === process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Lưu ý môi trường Test',
        'Đăng nhập Google thật yêu cầu phải cấu hình Android Client ID riêng với package name host.exp.exponent trong Google Cloud Console. Bạn có muốn dùng tài khoản giả lập để test giao diện không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Dùng acc giả lập', 
            onPress: async () => {
              setGoogleLoading(true);
              try {
                const data = await AuthService.loginWithGoogle('MOCK_GOOGLE_TOKEN_DEV_ONLY');
                if (data.success) {
                  await AsyncStorage.setItem('token', data.data.token);
                  await checkAuth();
                  setTimeout(() => {
                    const r = data.data.user.role;
                    if (r === 'ADMIN') router.replace('/admin-dashboard');
                    else if (r === 'MANAGER') router.replace('/branch-manage');
                    else if (r === 'WAITER') router.replace('/pos');
                    else if (r === 'KITCHEN') router.replace('/kds');
                    else router.replace('/(tabs)');
                  }, 100);
                }
              } catch (error: any) {
                Alert.alert('Lỗi', error.message);
              } finally {
                setGoogleLoading(false);
              }
            } 
          }
        ]
      );
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { id_token } = result.params;
        
        // Sign in to Firebase with Google credential
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseIdToken = await userCredential.user.getIdToken();
        
        // Send Firebase ID token to backend
        const data = await AuthService.loginWithGoogle(firebaseIdToken);
        if (data.success) {
          await AsyncStorage.setItem('token', data.data.token);
          await checkAuth();
          setTimeout(() => {
            const r = data.data.user.role;
            if (r === 'ADMIN') router.replace('/admin-dashboard');
            else if (r === 'MANAGER') router.replace('/branch-manage');
            else if (r === 'WAITER') router.replace('/pos');
            else if (r === 'KITCHEN') router.replace('/kds');
            else router.replace('/(tabs)');
          }, 100);
        } else {
          Alert.alert('Đăng nhập thất bại', data.message);
        }
      }
    } catch (error: any) {
      console.log('Google login error:', error);
      Alert.alert('Đăng nhập Google thất bại', error.message || 'Có lỗi xảy ra');
    } finally {
      setGoogleLoading(false);
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
        <Text className="text-primary text-4xl font-lexend font-bold mb-2">SpotOn</Text>
        <Text className="text-muted text-base font-lexend">Chào mừng trở lại</Text>
      </View>

      <View className="gap-2">
        <Input
          label="Email"
          placeholder="Nhập email của bạn"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button 
          title="Đăng nhập"
          onPress={handleLogin}
          loading={loading}
        />
      </View>

      {/* Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="font-lexend text-muted mx-4 text-sm">OR</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Google Login Button */}
      <TouchableOpacity
        onPress={handleGoogleLogin}
        disabled={googleLoading}
        className="flex-row items-center justify-center bg-white border border-gray-300 rounded-md py-2.5 px-4 shadow-sm transition-colors"
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#b45309" />
        ) : (
          <>
            <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 12 }}>
              <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </Svg>
            <Text className="font-lexend font-medium text-gray-700 text-sm">Tiếp tục với Google</Text>
          </>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center mt-6">
        <Text className="text-muted font-lexend">Chưa có tài khoản? </Text>
        <Link href="/register" asChild>
          <Text className="text-primary font-lexend font-bold ml-1">Đăng ký</Text>
        </Link>
      </View>
    </View>
  );
}
