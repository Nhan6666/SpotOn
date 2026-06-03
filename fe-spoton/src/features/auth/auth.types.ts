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
  terms: boolean;
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

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}
