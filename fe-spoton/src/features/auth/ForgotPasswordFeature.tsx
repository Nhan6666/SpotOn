'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { authService } from './auth.service';
import { AppError } from '@/lib/errors';
import {
  forgotPasswordSchema,
  forgotPasswordOtpSchema,
  resetPasswordSchema,
  type ForgotPasswordSchema,
  type ForgotPasswordOtpSchema,
  type ResetPasswordSchema,
} from './auth.schema';

// ─── Main Component ────────────────────────────────────────────────────────────
export function ForgotPasswordFeature() {
  const router = useRouter();

  // 1 = Enter Email, 2 = Enter OTP, 3 = Enter New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Step 1: Request OTP ---
  const emailForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onEmailSubmit = async (data: ForgotPasswordSchema) => {
    setServerError(null);
    try {
      await authService.forgotPassword(data.email);
      setEmail(data.email);
      setStep(2);
      setSuccessMessage('Mã OTP đã được gửi đến email của bạn.');
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        setServerError('Không tìm thấy tài khoản với email này.');
      } else {
        setServerError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  // --- Step 2: Verify OTP ---
  const otpForm = useForm<ForgotPasswordOtpSchema>({
    resolver: zodResolver(forgotPasswordOtpSchema),
    defaultValues: { otp: '' },
  });

  const onOtpSubmit = async (data: ForgotPasswordOtpSchema) => {
    setServerError(null);
    try {
      await authService.verifyForgotPasswordOtp({ email, otp: data.otp });
      setOtpCode(data.otp);
      setStep(3);
      setSuccessMessage('Vui lòng nhập mật khẩu mới.');
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 400) {
        setServerError('Mã OTP không đúng hoặc đã hết hạn.');
      } else {
        setServerError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  // --- Step 3: Reset Password ---
  const resetForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onResetSubmit = async (data: ResetPasswordSchema) => {
    setServerError(null);
    try {
      await authService.resetPassword({
        email,
        otp: otpCode,
        newPassword: data.newPassword,
      });
      setSuccessMessage('Đặt lại mật khẩu thành công! Đang chuyển hướng...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 400) {
        setServerError('Mã OTP không đúng hoặc đã hết hạn.');
        setStep(2); // Quay lại bước OTP
      } else {
        setServerError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên Mật Khẩu</h2>
          <p className="text-sm text-gray-500">
            {step === 1 && 'Nhập email của bạn để nhận mã xác nhận OTP.'}
            {step === 2 && 'Nhập mã OTP 6 chữ số đã được gửi đến email của bạn.'}
            {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn.'}
          </p>
        </div>

        {serverError && (
          <div role="alert" className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 font-medium">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div role="alert" className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 font-medium">
            {successMessage}
          </div>
        )}

        {/* --- STEP 1 --- */}
        {step === 1 && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...emailForm.register('email')}
                placeholder="Nhập email của bạn"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c58b39] focus:ring-2 focus:ring-[#c58b39]/20 transition-all duration-200 outline-none"
              />
              {emailForm.formState.errors.email?.message && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className="w-full py-3 px-4 bg-[#c58b39] hover:bg-[#b07a2f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {emailForm.formState.isSubmitting ? 'Đang gửi...' : 'Gửi mã xác nhận'}
            </button>
          </form>
        )}

        {/* --- STEP 2 --- */}
        {step === 2 && (
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mã OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                {...otpForm.register('otp')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  e.target.value = val;
                  otpForm.setValue('otp', val, { shouldValidate: true });
                }}
                placeholder="Nhập mã 6 số"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c58b39] focus:ring-2 focus:ring-[#c58b39]/20 transition-all duration-200 outline-none tracking-widest text-center text-xl font-bold"
              />
              {otpForm.formState.errors.otp?.message && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-500 text-center">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); setSuccessMessage(null); setServerError(null); }}
                className="w-1/3 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 px-4 bg-[#c58b39] hover:bg-[#b07a2f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Tiếp tục
              </button>
            </div>
          </form>
        )}

        {/* --- STEP 3 --- */}
        {step === 3 && (
          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mật khẩu mới
              </label>
              <input
                type="password"
                {...resetForm.register('newPassword')}
                placeholder="Nhập mật khẩu mới"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c58b39] focus:ring-2 focus:ring-[#c58b39]/20 transition-all duration-200 outline-none"
              />
              {resetForm.formState.errors.newPassword?.message && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                {...resetForm.register('confirmPassword')}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#c58b39] focus:ring-2 focus:ring-[#c58b39]/20 transition-all duration-200 outline-none"
              />
              {resetForm.formState.errors.confirmPassword?.message && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(2); setSuccessMessage(null); setServerError(null); }}
                className="w-1/3 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="w-2/3 py-3 px-4 bg-[#c58b39] hover:bg-[#b07a2f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {resetForm.formState.isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        )}

        {/* --- Back to Login Link --- */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Nhớ mật khẩu?{' '}
            <Link href="/login" className="font-semibold text-[#c58b39] hover:underline transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
