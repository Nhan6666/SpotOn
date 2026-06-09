import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from './auth.service';
import { AppError } from '@/lib/errors';
import { useRouter } from 'next/navigation';

export const useGoogleAuth = (options?: { onSuccess?: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Mở popup Google của Firebase
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 2. Lấy idToken
      const idToken = await result.user.getIdToken();

      // 3. Gửi xuống Backend
      const response = await authService.loginWithGoogle(idToken);
      
      // Thành công: Xử lý lưu Auth Context và redirect
      console.log('Đăng nhập Google thành công:', response.data);
      document.cookie = `spoton_token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`; // 7 ngày
      sessionStorage.setItem('spoton_token', response.data.token);
      
      if (options?.onSuccess) {
        options.onSuccess();
      } else {
        router.push('/');
      }

    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message || 'Lỗi máy chủ. Vui lòng thử lại sau.');
      } else {
        // Lỗi do người dùng tắt popup giữa chừng hoặc lỗi mạng Firebase
        setError('Đăng nhập Google bị hủy hoặc thất bại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { loginWithGoogle, isLoading, error };
};