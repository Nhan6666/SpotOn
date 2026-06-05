import { Suspense } from 'react';
import { LoginFeature } from '@/features/auth/LoginFeature';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8a5a19] border-t-transparent" />
      </div>
    }>
      <LoginFeature />
    </Suspense>
  );
}