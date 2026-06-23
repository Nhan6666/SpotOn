'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

import { ChangePasswordSchema, ChangePasswordValues } from '../profile.schema';
import { profileService } from '../profile.service';
import { UserProfile } from '../profile.types';

interface ChangePasswordFormProps {
  user: UserProfile;
}

export function ChangePasswordForm({ user }: ChangePasswordFormProps) {
  const { addToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Nếu password_hash là null, nghĩa là user chưa có password (tạo qua Google)
  const isSettingUpPassword = user.password_hash === null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    setIsSubmitting(true);
    try {
      await profileService.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      addToast('Cập nhật mật khẩu thành công', 'success');
      reset();
      
      // Có thể force refresh lại user data chỗ này nếu muốn giấu ô password đi sau khi đã setup
      // Tùy theo thiết kế, hiện tại cứ để user biết là đã đổi thành công.
      window.location.reload(); 
    } catch (error: any) {
      addToast(error.message || 'Lỗi khi cập nhật mật khẩu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bảo mật tài khoản</CardTitle>
        <CardDescription>Thay đổi mật khẩu hoặc thiết lập mật khẩu mới</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isSettingUpPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
              <Input
                type="password"
                {...register('oldPassword')}
                error={errors.oldPassword?.message}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <Input
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <Input
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-end border-t pt-6">
        <Button
          type="submit"
          form="password-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : (isSettingUpPassword ? 'Thiết lập mật khẩu' : 'Cập nhật mật khẩu')}
        </Button>
      </CardFooter>
    </Card>
  );
}
