'use client';

import React, { useEffect, useState } from 'react';

import { ProfileForm } from './components/ProfileForm';
import { ChangePasswordForm } from './components/ChangePasswordForm';
import { profileService } from './profile.service';
import { UserProfile } from './profile.types';

export function ProfileFeature() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setUser(data);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">{error || 'Không tìm thấy dữ liệu yêu cầu.'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-sm text-gray-600">Quản lý thông tin và bảo mật tài khoản của bạn</p>
      </div>
      
      <div className="space-y-8">
        <ProfileForm user={user} onUpdateSuccess={setUser} />
        <ChangePasswordForm user={user} />
      </div>
    </div>
  );
}
