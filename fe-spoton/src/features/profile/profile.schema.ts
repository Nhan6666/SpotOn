import { z } from 'zod';

export const ProfileFormSchema = z.object({
  full_name: z.string().min(2, { message: 'Tên phải có ít nhất 2 ký tự' }),
  phone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

