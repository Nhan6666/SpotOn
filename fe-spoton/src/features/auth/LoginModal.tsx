import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { X } from 'lucide-react';
import { loginSchema } from './auth.schema';
import { authService } from './auth.service';
import { AppError } from '@/lib/errors';
import type { LoginFormValues } from './auth.types';
import { useAuth } from '@/providers/AuthProvider';
import { useGoogleAuth } from './useGoogleAuth';
import { AUTH_TEXTS } from '@/constants/texts/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export function LoginModal({ isOpen, onClose, onSuccess, title, subtitle }: LoginModalProps) {
  const { login: loginUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = AUTH_TEXTS;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { loginWithGoogle, isLoading: isGoogleLoading, error: googleError } = useGoogleAuth({
    onSuccess: (token, user) => {
      loginUser(token, user);
      if (onSuccess) onSuccess();
      onClose();
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem('spoton_saved_email');
      if (savedEmail) {
        setValue('email', savedEmail);
        setValue('rememberMe', true);
      }
    } else {
      reset();
      setServerError(null);
    }
  }, [isOpen, setValue, reset]);

  if (!isOpen || !mounted) return null;

  const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c] transition-colors bg-[#f4f7fe]';
  const inputErrorClass = 'w-full rounded-xl border border-red-400 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors bg-[#f4f7fe]';

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const result = await authService.login({ email: values.email, password: values.password });
      loginUser(result.data.token, result.data.user);
      
      if (values.rememberMe) {
        localStorage.setItem('spoton_saved_email', values.email);
      } else {
        localStorage.removeItem('spoton_saved_email'); 
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof AppError) {
        setServerError(error.message || login.messages.invalidCreds);
      } else {
        setServerError(login.messages.error);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
          <button 
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full p-1"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4 text-[#ea580c]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 12 7.5 9 10.5C6 13.5 2 12 2 12M12 2C12 2 12 7.5 15 10.5C18 13.5 22 12 22 12M12 2V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 2L7 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 2L17 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-2xl font-bold font-stencil tracking-wider uppercase text-gray-900">SpotOn</span>
          </div>
          <h2 className="text-[22px] font-bold text-[#111827] text-center">{title || 'Đăng nhập để đặt bàn'}</h2>
          <p className="mt-2 text-[15px] text-gray-500 text-center">{subtitle || 'Vui lòng đăng nhập để tạo giữ bàn và đặt trước'}</p>
        </div>

        {(serverError || googleError) && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {serverError || googleError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wide">EMAIL</label>
            <input
              type="email"
              placeholder={login.emailPlaceholder}
              className={errors.email ? inputErrorClass : inputClass}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wide">MẬT KHẨU</label>
              <Link href="/forgot-password" onClick={onClose} className="text-[13px] font-semibold text-[#1877f2] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={login.passwordPlaceholder}
                className={errors.password ? inputErrorClass : inputClass}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
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

          <div className="flex items-center pt-2">
            <input
              id="rememberMeModal"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#ea580c] focus:ring-[#ea580c] cursor-pointer"
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMeModal" className="ml-2 text-[14px] text-gray-600 cursor-pointer select-none">
              Ghi nhớ tôi
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#ffb38f] hover:bg-[#ea580c] text-white py-3.5 text-[15px] font-bold transition-colors disabled:opacity-70 mt-6 shadow-sm"
          >
            {isSubmitting ? login.submittingBtn : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-[13px]"><span className="bg-white px-3 text-gray-500">Hoặc đăng nhập với</span></div>
        </div>

        <button 
          type="button" 
          onClick={loginWithGoogle}
          disabled={isGoogleLoading || isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 shadow-sm"
        >
          <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
            <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
            <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
            <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
          </svg>
          Đăng nhập bằng Google
        </button>

        <p className="mt-8 text-center text-[14.5px] text-gray-600">
          Chưa có tài khoản?{' '}
          <Link href="/register" onClick={onClose} className="font-bold text-[#1877f2] hover:underline">
            Đăng ký ngay
          </Link>
        </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
