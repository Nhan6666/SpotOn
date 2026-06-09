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

  loginWithGoogle: (idToken: string): Promise<AuthResponse> =>
    http.post<AuthResponse>('/auth/google', { idToken }),

  logout: (): Promise<void> =>
    http.post<void>('/auth/logout', {}),

  getMe: (token: string): Promise<AuthResponse['data']['user']> =>
    http.get<AuthResponse['data']['user']>('/auth/me', { token }),
};