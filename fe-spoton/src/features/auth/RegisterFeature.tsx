'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import bgRegister from '@/assets/images/bg-register.png';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { registerSchema } from './auth.schema';
import { authService } from './auth.service';
import { AppError } from '@/lib/errors';
import type { RegisterFormValues, RegisterPayload } from './auth.types';

// ─── Sub-component: Form Field ────────────────────────────────────────────────
interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide text-gray-700 uppercase"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function RegisterFeature() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const inputClass =
    'w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors';

  const inputErrorClass =
    'w-full rounded-md border border-red-400 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors';

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    const payload: RegisterPayload = {
      full_name: values.fullName,
      email: values.email,
      phone: values.phone,
      password: values.password,
    };

    try {
      const result = await authService.register(payload);
      setSuccessMessage('Đăng ký thành công! Đang chuyển đến trang xác thực...');
      // Redirect sang trang verify-otp, truyền email qua query string
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(result.data.email)}`);
      }, 1000);
    } catch (error) {
      if (error instanceof AppError) {
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            setError(field as keyof RegisterFormValues, { message: message as string });
          });
          return;
        }

        switch (error.statusCode) {
          case 409:
            setServerError('Email hoặc số điện thoại đã được sử dụng.');
            break;
          case 0:
          case undefined:
            setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
            break;
          default:
            setServerError('Đăng ký thất bại. Vui lòng thử lại sau.');
        }
      } else {
        setServerError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Column - Form */}
      <div className="flex w-full flex-col justify-center px-8 md:w-1/2 md:px-16 lg:px-24 xl:px-32 relative">
        <div className="mx-auto w-full max-w-md">

          {/* Logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="flex items-center justify-center text-amber-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C12 2 12 7.5 9 10.5C6 13.5 2 12 2 12M12 2C12 2 12 7.5 15 10.5C18 13.5 22 12 22 12M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 2L7 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 2L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              SpotOn
            </span>
          </div>

          {/* Heading */}
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Tạo Tài Khoản Mới
          </h1>

          {/* Success Message */}
          {successMessage && (
            <div role="status" className="mb-5 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* Server Error Banner */}
          {serverError && (
            <div role="alert" className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form className="space-y-2" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Full Name */}
            <FormField id="fullname" label="Họ và Tên" error={errors.fullName?.message}>
              <input
                id="fullname"
                type="text"
                autoComplete="name"
                placeholder="Nhập họ và tên của bạn"
                className={errors.fullName ? inputErrorClass : inputClass}
                aria-describedby={errors.fullName ? 'fullname-error' : undefined}
                {...register('fullName')}
              />
            </FormField>

            {/* Email & Phone */}
            <div className="flex flex-col sm:flex-row gap-5">
              <FormField id="email" label="Email" error={errors.email?.message}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ví dụ@domain.com"
                  className={errors.email ? inputErrorClass : inputClass}
                  {...register('email')}
                />
              </FormField>

              <FormField id="phone" label="Số điện thoại" error={errors.phone?.message}>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Nhập số điện thoại"
                  className={errors.phone ? inputErrorClass : inputClass}
                  {...register('phone')}
                />
              </FormField>
            </div>

            {/* Password */}
            <FormField id="password" label="Mật khẩu" error={errors.password?.message}>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Tạo mật khẩu an toàn"
                className={errors.password ? inputErrorClass : inputClass}
                {...register('password')}
              />
            </FormField>

            {/* Confirm Password */}
            <FormField id="confirm-password" label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                className={errors.confirmPassword ? inputErrorClass : inputClass}
                {...register('confirmPassword')}
              />
            </FormField>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#8a5a19] cursor-pointer px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#724a15] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8a5a19] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đăng Ký Tài Khoản'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => console.log('Gọi hàm Firebase Google Login ở đây')}
                className="flex w-full items-center cursor-pointer justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8a5a19] focus:ring-offset-2 transition-colors"
              >
                {/* Icon Google chuẩn */}
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Đăng ký bằng Google
              </button>
            </div>
          </div>

          {/* Login Link */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-semibold text-[#8a5a19] hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Image & Overlay */}
      <div className="relative hidden w-1/2 md:block">
        <Image
src={bgRegister}
          alt="Không gian nhà hàng sang trọng"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#262626] via-[#262626]/40 to-transparent" />

        <div className="absolute bottom-0 left-0 p-12 lg:p-16 w-full max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md mb-6">
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-snug">
            Kiểm soát hoàn toàn chuỗi nhà hàng của bạn
          </h2>
          <p className="text-gray-300 text-sm lg:text-base leading-relaxed">
            Quản lý đặt bàn, tối ưu hóa công suất và phân tích dữ liệu hiệu quả với giao diện được thiết kế riêng cho người quản lý cấp cao.
          </p>
        </div>
      </div>
    </div>
  );
}