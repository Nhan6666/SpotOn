/**
 * features/auth/auth.types.ts
 * Types cho toàn bộ auth feature
 */

export interface RegisterFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface AuthUser {
  _id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'WAITER' | 'CUSTOMER';
  is_email_verified: boolean;
  profile_allergies?: string;
  profile_vip_notes?: string;
}

/** Response sau khi đăng nhập thành công (có token + user) */
export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

/** Response sau khi đăng ký thành công (chưa có token, cần xác thực OTP) */
export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
  };
}

/** Response sau khi xác thực OTP thành công */
export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}
