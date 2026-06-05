import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Vui lòng nhập họ và tên')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(100, 'Họ tên không được vượt quá 100 ký tự'),
    email: z
      .string()
      .min(1, 'Vui lòng nhập email')
      .email('Email không đúng định dạng'),
    phone: z
      .string()
      .min(1, 'Vui lòng nhập số điện thoại')
      .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu')
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa chữ hoa, chữ thường và số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    terms: z.boolean().refine((val) => val === true, 'Bạn phải đồng ý với điều khoản dịch vụ'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;