import { z } from 'zod';

export const ProfileFormSchema = z.object({
  full_name: z.string().min(2, { message: 'Tên phải có ít nhất 2 ký tự' }),
  phone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
  confirmPassword: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
});

export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;
