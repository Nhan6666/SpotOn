'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from './auth.service';
import { AppError } from '@/lib/errors';

import { useAuth } from '@/providers/AuthProvider';

// ─── Main Component ────────────────────────────────────────────────────────────
export function VerifyOtpFeature() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Tự focus vào ô đầu tiên khi load trang
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Chỉ nhận 1 ký tự số
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Tự động focus sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Xoá và focus về ô trước đó
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    // Focus vào ô cuối cùng được điền
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setServerError('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.verifyOtp({ email, otp: otpCode });
      setSuccessMessage('Xác thực thành công! Đang chuyển hướng...');
      // Lưu token vào Cookie và cập nhật Context state thông qua useAuth()
      login(result.token, result.user);
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error) {
      if (error instanceof AppError) {
        switch (error.statusCode) {
          case 400:
            setServerError('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
            break;
          case 0:
          case undefined:
            setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
            break;
          default:
            setServerError('Xác thực thất bại. Vui lòng thử lại sau.');
        }
      } else {
        setServerError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
      // Reset OTP input khi lỗi
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-lg">

          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex items-center justify-center text-amber-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C12 2 12 7.5 9 10.5C6 13.5 2 12 2 12M12 2C12 2 12 7.5 15 10.5C18 13.5 22 12 22 12M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 2L7 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 2L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">SpotOn</span>
          </div>

          {/* Icon email */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Xác Thực Email</h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            Chúng tôi đã gửi mã OTP gồm 6 chữ số đến{' '}
            <span className="font-semibold text-amber-700">{email}</span>
          </p>

          {/* Success */}
          {successMessage && (
            <div role="status" className="mb-5 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 text-center">
              {successMessage}
            </div>
          )}

          {/* Error */}
          {serverError && (
            <div role="alert" className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
              {serverError}
            </div>
          )}

          {/* OTP Input */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6 flex items-center justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-14 w-12 rounded-lg border border-gray-300 text-center text-xl font-bold text-gray-800 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 transition-all"
                  aria-label={`Ký tự OTP ${index + 1}`}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join('').length < 6}
              className="w-full rounded-md bg-[#8a5a19] px-4 cursor-pointer py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#724a15] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8a5a19] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Xác Nhận'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Không nhận được mã?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="font-semibold cursor-pointer text-amber-700 hover:underline"
            >
              Quay lại đăng ký
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
