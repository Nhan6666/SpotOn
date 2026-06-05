/**
 * features/auth/auth.service.ts
 * Tất cả API calls cho auth feature
 * KHÔNG gọi fetch trực tiếp — dùng http từ lib/http.ts
 */

import { http } from '@/lib/http';
import type {
  AuthResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  LoginPayload,
} from './auth.types';

export const authService = {
  register: (payload: RegisterPayload): Promise<RegisterResponse> =>
    http.post<RegisterResponse>('/auth/register', payload),

  verifyOtp: (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> =>
    http.post<VerifyOtpResponse>('/auth/verify-otp', payload),

  login: (payload: LoginPayload): Promise<AuthResponse> =>
    http.post<AuthResponse>('/auth/login', payload),

  googleLogin: (idToken: string): Promise<AuthResponse> =>
    http.post<AuthResponse>('/auth/google', { idToken }),

  logout: (): Promise<void> =>
    http.post<void>('/auth/logout', {}),

 getMe: (token: string): Promise<AuthResponse['user']> =>
    http.get<AuthResponse['user']>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};
