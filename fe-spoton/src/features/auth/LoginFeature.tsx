'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

// Dùng tạm hình nền của trang đăng ký, bạn có thể thay ảnh khác sau
import bgLogin from '@/assets/images/bg-login.png'; 
import { loginSchema } from './auth.schema';
import { authService } from './auth.service';
import { AppError } from '@/lib/errors';
import type { LoginFormValues, LoginPayload } from './auth.types';

export function LoginFeature() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleGoogleLogin = async () => {
    setServerError(null);
    setIsGoogleLoading(true);
    try {
      // Bật cửa sổ Popup của Google
      const result = await signInWithPopup(auth, googleProvider);
      
      // Lấy idToken bảo mật từ Google
      const idToken = await result.user.getIdToken();

      // Bắn idToken xuống Backend SpotOn của chúng ta
      const backendResult = await authService.googleLogin(idToken);

      // Nếu BE báo OK, lưu Token + User và cho vào trang chủ
      // Google login luôn dùng localStorage (persistent session)
      localStorage.setItem('spoton_token', backendResult.token);
      localStorage.setItem('spoton_user', JSON.stringify(backendResult.user));
      router.push('/');
      
    } catch (error: any) {
      console.error('Lỗi Google Login:', error);
      // Nếu user tự bấm dấu X tắt popup thì không cần hiện lỗi
      if (error.code !== 'auth/popup-closed-by-user') {
        setServerError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-[#8a5a19] focus:outline-none focus:ring-1 focus:ring-[#8a5a19] transition-colors';
  const inputErrorClass =
    'w-full rounded-md border border-red-400 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors';

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    const payload: LoginPayload = {
      email: values.email,
      password: values.password,
    };

    try {
      const result = await authService.login(payload);
      
      // Lưu token + user (persistent nếu rememberMe, session nếu không)
      if (values.rememberMe) {
        localStorage.setItem('spoton_token', result.token);
        localStorage.setItem('spoton_user', JSON.stringify(result.user));
      } else {
        sessionStorage.setItem('spoton_token', result.token);
        sessionStorage.setItem('spoton_user', JSON.stringify(result.user));
      }

      // Chuyển hướng về trang chủ
      router.push('/');
    } catch (error) {
      if (error instanceof AppError) {
        setServerError(error.message || 'Email hoặc mật khẩu không chính xác.');
      } else {
        setServerError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Cột trái - Hình ảnh */}
      <div className="relative hidden w-1/2 md:block">
        <Image
          src={bgLogin}
          alt="SpotOn Restaurant Concept"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute bottom-0 left-0 flex h-full flex-col justify-end p-12 lg:p-16 w-full max-w-2xl">
          <div className="mb-6 flex items-center gap-2 text-[#F2Dbb8]">
            <span className="text-5xl font-bold tracking-tight">SpotOn</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4 leading-snug">
            "Empowering vibrant restaurant energy with administrative precision."
          </h2>
          <p className="text-gray-300 text-sm lg:text-base leading-relaxed">
            Streamline your reservations and manage your branches with unmatched clarity and efficiency.
          </p>
        </div>
      </div>

      {/* Cột phải - Form Đăng nhập */}
      <div className="flex w-full flex-col justify-center px-8 md:w-1/2 md:px-16 lg:px-24 xl:px-32 relative">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="mb-8 text-gray-500">
            Please enter your details to sign in.
          </p>

          {serverError && (
            <div role="alert" className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold tracking-wide text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="manager@spoton.com"
                className={errors.email ? inputErrorClass : inputClass}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5 relative">
              <label htmlFor="password" className="text-xs font-semibold tracking-wide text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={errors.password ? inputErrorClass : inputClass}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.5-2.754M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Remember & Forgot Pass */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#8a5a19] focus:ring-[#8a5a19]"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm font-semibold text-[#8a5a19] hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-md bg-[#8a5a19] px-4 cursor-pointer py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#724a15] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8a5a19] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>

          {/* Nút Đăng nhập Social */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="flex w-full items-center justify-center cursor-pointer gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <svg className="h-5 w-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
              )}
              {isGoogleLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
            </button>
          </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-[#8a5a19] hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}