/**
 * features/auth/auth.schema.ts
 * Zod validation schemas cho auth forms
 * Tất cả text validation phải đến từ messages/vi.json thông qua t()
 * KHÔNG hard-code chuỗi tiếng Việt trực tiếp ở đây
 */

import { z } from 'zod';

/**
 * Factory function nhận `t` từ useTranslations() để tạo schema động
 * Pattern này đảm bảo messages luôn đồng bộ với i18n
 */
export const createRegisterSchema = (t: (key: string) => string) =>
  z
    .object({
      fullName: z
        .string()
        .min(1, t('validation.required'))
        .min(2, t('validation.fullName.min'))
        .max(100, t('validation.fullName.max')),
      email: z
        .string()
        .min(1, t('validation.required'))
        .email(t('validation.email.invalid')),
      phone: z
        .string()
        .min(1, t('validation.required'))
        .regex(/^(0|\+84)[3-9]\d{8}$/, t('validation.phone.invalid')),
      password: z
        .string()
        .min(1, t('validation.required'))
        .min(8, t('validation.password.min'))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t('validation.password.pattern')),
      confirmPassword: z.string().min(1, t('validation.required')),
      terms: z.boolean().refine((val) => val === true, t('validation.terms.required')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.confirmPassword.mismatch'),
      path: ['confirmPassword'],
    });

export const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.email.invalid')),
    password: z.string().min(1, t('validation.required')),
  });

export type RegisterSchema = ReturnType<typeof createRegisterSchema>;
export type LoginSchema = ReturnType<typeof createLoginSchema>;
