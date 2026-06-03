'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo } from 'react';

import { createRegisterSchema } from './auth.schema';
import { authService } from './auth.service';
import { AppError } from '@/lib/errors';
import type { RegisterFormValues, RegisterPayload } from './auth.types';

// ─── Sub-component: Form Field ────────────────────────────────────────────────
interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide text-gray-700 uppercase"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function RegisterFeature() {
  // i18n — KHÔNG hard-code chuỗi, dùng t() cho mọi text hiển thị
  const t = useTranslations();

  // Tạo schema từ t() để validation messages đồng bộ với i18n
  const schema = useMemo(() => createRegisterSchema(t), [t]);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const inputClass =
    'w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors';

  const inputErrorClass =
    'w-full rounded-md border border-red-400 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors';

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    const payload: RegisterPayload = {
      full_name: values.fullName,
      email: values.email,
      phone: values.phone,
      password: values.password,
    };

    try {
      await authService.register(payload);
      setSuccessMessage(t('auth.register.success'));
    } catch (error) {
      if (error instanceof AppError) {
        // Field-level errors từ server (VD: email đã tồn tại)
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            setError(field as keyof RegisterFormValues, { message });
          });
          return;
        }

        // Map error code → i18n message
        switch (error.statusCode) {
          case 409:
            setServerError(t('auth.register.errors.emailAlreadyExists'));
            break;
          case 0:
          case undefined:
            setServerError(t('common.error.network'));
            break;
          default:
            setServerError(t('auth.register.errors.registrationFailed'));
        }
      } else {
        setServerError(t('common.error.generic'));
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Column - Form */}
      <div className="flex w-full flex-col justify-center px-8 md:w-1/2 md:px-16 lg:px-24 xl:px-32 relative">
        <div className="mx-auto w-full max-w-md">

          {/* Logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="flex items-center justify-center text-amber-700">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C12 2 12 7.5 9 10.5C6 13.5 2 12 2 12M12 2C12 2 12 7.5 15 10.5C18 13.5 22 12 22 12M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 2L7 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 2L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              {t('common.appName')}
            </span>
          </div>

          {/* Heading */}
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {t('auth.register.title')}
          </h1>
          <p className="mb-8 text-sm text-slate-500 leading-relaxed">
            {t('auth.register.subtitle')}
          </p>

          {/* Success Message */}
          {successMessage && (
            <div role="status" className="mb-5 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* Server Error Banner */}
          {serverError && (
            <div role="alert" className="mb-5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Full Name */}
            <FormField id="fullname" label={t('auth.register.fields.fullName')} error={errors.fullName?.message}>
              <input
                id="fullname"
                type="text"
                autoComplete="name"
                placeholder={t('auth.register.fields.fullNamePlaceholder')}
                className={errors.fullName ? inputErrorClass : inputClass}
                aria-describedby={errors.fullName ? 'fullname-error' : undefined}
                {...register('fullName')}
              />
            </FormField>

            {/* Email & Phone */}
            <div className="flex flex-col sm:flex-row gap-5">
              <FormField id="email" label={t('auth.register.fields.email')} error={errors.email?.message}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.register.fields.emailPlaceholder')}
                  className={errors.email ? inputErrorClass : inputClass}
                  {...register('email')}
                />
              </FormField>

              <FormField id="phone" label={t('auth.register.fields.phone')} error={errors.phone?.message}>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t('auth.register.fields.phonePlaceholder')}
                  className={errors.phone ? inputErrorClass : inputClass}
                  {...register('phone')}
                />
              </FormField>
            </div>

            {/* Password */}
            <FormField id="password" label={t('auth.register.fields.password')} error={errors.password?.message}>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.register.fields.passwordPlaceholder')}
                className={errors.password ? inputErrorClass : inputClass}
                {...register('password')}
              />
            </FormField>

            {/* Confirm Password */}
            <FormField id="confirm-password" label={t('auth.register.fields.confirmPassword')} error={errors.confirmPassword?.message}>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.register.fields.confirmPasswordPlaceholder')}
                className={errors.confirmPassword ? inputErrorClass : inputClass}
                {...register('confirmPassword')}
              />
            </FormField>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 py-2">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-700 focus:ring-amber-700"
                {...register('terms')}
              />
              <div>
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  {t('auth.register.terms.prefix')}{' '}
                  <Link href="/terms" className="font-medium text-amber-800 hover:underline">
                    {t('auth.register.terms.termsLink')}
                  </Link>{' '}
                  {t('auth.register.terms.conjunction')}{' '}
                  <Link href="/privacy" className="font-medium text-amber-800 hover:underline">
                    {t('auth.register.terms.privacyLink')}
                  </Link>
                  .
                </label>
                {errors.terms && (
                  <p role="alert" className="text-xs text-red-500 mt-1">
                    {errors.terms.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#8a5a19] px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#724a15] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8a5a19] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('auth.register.submitting') : t('auth.register.submitButton')}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-sm text-slate-500">
            {t('auth.register.loginLink.text')}{' '}
            <Link href="/login" className="font-semibold text-[#8a5a19] hover:underline">
              {t('auth.register.loginLink.link')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Image & Overlay */}
      <div className="relative hidden w-1/2 md:block">
        <Image
          src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1740&auto=format&fit=crop"
          alt={t('auth.register.imageAlt')}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#262626] via-[#262626]/40 to-transparent" />

        <div className="absolute bottom-0 left-0 p-12 lg:p-16 w-full max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md mb-6">
            <span className="text-amber-500 text-xs" aria-hidden="true">⭐</span>
            <span className="text-[10px] font-bold tracking-wider text-white uppercase">
              {t('auth.register.badge')}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-snug">
            {t('auth.register.heroTitle')}
          </h2>
          <p className="text-gray-300 text-sm lg:text-base leading-relaxed">
            {t('auth.register.heroSubtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}
