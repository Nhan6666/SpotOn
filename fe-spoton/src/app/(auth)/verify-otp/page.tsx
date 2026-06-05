import { Suspense } from 'react';
import { VerifyOtpFeature } from '@/features/auth/VerifyOtpFeature';

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-700 border-t-transparent" />
      </div>
    }>
      <VerifyOtpFeature />
    </Suspense>
  );
}
