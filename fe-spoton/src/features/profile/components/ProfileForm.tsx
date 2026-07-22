'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/providers/AuthProvider';

import { ProfileFormSchema, ProfileFormValues } from '../profile.schema';
import { profileService } from '../profile.service';
import { UserProfile } from '../profile.types';
import { PROFILE_TEXTS } from '@/constants/texts/profile';

interface ProfileFormProps {
  user: UserProfile;
  onUpdateSuccess: (user: UserProfile) => void;
}

export function ProfileForm({ user, onUpdateSuccess }: ProfileFormProps) {
  const { toast } = useToast();
  const { updateUser } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      full_name: user.full_name,
      phone: user.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await profileService.updateProfile(data);
      onUpdateSuccess(updatedUser);
      updateUser({ full_name: updatedUser.full_name, avatar: updatedUser.avatar });
      toast(PROFILE_TEXTS.form.success, 'success');
    } catch (error: any) {
      toast(error.message || PROFILE_TEXTS.form.errorUpdate, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await profileService.uploadAvatar(file);
      const updatedUser = await profileService.updateProfile({ avatar: url });
      onUpdateSuccess(updatedUser);
      updateUser({ avatar: updatedUser.avatar });
      toast(PROFILE_TEXTS.form.avatarUploadSuccess, 'success');
    } catch (error: any) {
      toast(error.message || PROFILE_TEXTS.form.avatarUploadError, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{PROFILE_TEXTS.form.cardTitle}</CardTitle>
        <CardDescription>{PROFILE_TEXTS.form.cardDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-gray-100 flex items-center justify-center">
              {user.avatar ? (
                <Image src={user.avatar} alt="Avatar" fill sizes="(max-width: 128px) 100vw, 128px" className="object-cover" />
              ) : (
                <span className="text-4xl text-gray-400">{user.full_name.charAt(0).toUpperCase()}</span>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-medium">
                  {PROFILE_TEXTS.form.uploading}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {PROFILE_TEXTS.form.avatarBtn}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Form Section */}
          <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{PROFILE_TEXTS.form.emailLabel}</label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{PROFILE_TEXTS.form.nameLabel}</label>
              <Input
                {...register('full_name')}
              />
              {errors.full_name?.message && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{PROFILE_TEXTS.form.phoneLabel}</label>
              <Input
                {...register('phone')}
              />
              {errors.phone?.message && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
          </form>
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-6">
        <Button
          type="submit"
          form="profile-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? PROFILE_TEXTS.form.submittingBtn : PROFILE_TEXTS.form.submitBtn}
        </Button>
      </CardFooter>
    </Card>
  );
}
