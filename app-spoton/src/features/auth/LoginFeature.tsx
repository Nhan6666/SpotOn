import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/hooks/useAuthStore';
import { AuthService } from './auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
          router.replace('/(tabs)');
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
    // If no real Client ID is provided in .env, use Mock login to bypass Google's 400 error
    if (!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      setGoogleLoading(true);
      try {
        const data = await AuthService.loginWithGoogle('MOCK_GOOGLE_TOKEN_DEV_ONLY');
        if (data.success) {
          await AsyncStorage.setItem('token', data.data.token);
          await checkAuth();
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
        } else {
          Alert.alert('Đăng nhập Google thất bại', data.message);
        }
      } catch (error: any) {
        console.log('Google mock login error:', error);
        Alert.alert('Lỗi giả lập', error.message || 'Có lỗi xảy ra');
      } finally {
        setGoogleLoading(false);
      }
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
            router.replace('/(tabs)');
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
        className="flex-row items-center justify-center bg-white border border-gray-200 rounded-md py-3.5 px-4 shadow-sm"
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#b45309" />
        ) : (
          <>
            <Text className="text-lg mr-3">🔵</Text>
            <Text className="font-lexend font-semibold text-text text-base">Đăng nhập với Google</Text>
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
