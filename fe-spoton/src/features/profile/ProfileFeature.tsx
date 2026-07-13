'use client';

import React, { useEffect, useState } from 'react';

import { ProfileForm } from './components/ProfileForm';
import { MyVouchers } from './components/MyVouchers';
import { profileService } from './profile.service';
import { UserProfile } from './profile.types';
import { PROFILE_TEXTS } from '@/constants/texts/profile';

import { User, Calendar, Heart, Settings, Camera } from 'lucide-react';
import Image from 'next/image';

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
        setError(err.message || PROFILE_TEXTS.feature.errorFetch);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const [activeTab, setActiveTab] = useState<'info' | 'vouchers'>('info');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-500 font-medium">{PROFILE_TEXTS.feature.loading}</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100 shadow-sm">
          {error || PROFILE_TEXTS.feature.errorNotFound}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Profile Tabs */}
        <div className="w-full mb-8 border-b border-gray-200 flex gap-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 text-base font-bold transition-colors relative ${activeTab === 'info' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Thông tin cá nhân
            {activeTab === 'info' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-md"></span>}
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-4 text-base font-bold transition-colors relative ${activeTab === 'vouchers' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Ví Voucher
            {activeTab === 'vouchers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-md"></span>}
          </button>
        </div>

        <div className="w-full">
           {activeTab === 'info' ? (
             <ProfileForm user={user} onUpdateSuccess={setUser} />
           ) : (
             <MyVouchers />
           )}
        </div>
      </div>
    </div>
  );
}
