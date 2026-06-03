/**
 * features/auth/auth.service.ts
 * Tất cả API calls cho auth feature
 * KHÔNG gọi fetch trực tiếp — dùng http từ lib/http.ts
 */

import { http } from '@/lib/http';
import type { AuthResponse, RegisterPayload } from './auth.types';

export const authService = {
  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    http.post<AuthResponse>('/auth/register', payload),

  login: (email: string, password: string): Promise<AuthResponse> =>
    http.post<AuthResponse>('/auth/login', { email, password }),

  logout: (): Promise<void> =>
    http.post<void>('/auth/logout', {}),

  getMe: (token: string): Promise<AuthResponse['user']> =>
    http.get<AuthResponse['user']>('/auth/me', { token }),
};
