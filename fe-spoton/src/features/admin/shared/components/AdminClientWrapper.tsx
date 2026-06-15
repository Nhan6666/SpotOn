"use client";

import { ReactNode } from 'react';
import { AdminAuthGuard } from '@/features/admin/shared/components/AdminAuthGuard';

/**
 * AdminClientWrapper
 * Client-side wrapper cho Admin layout.
 * Chứa AdminAuthGuard (cần "use client" vì dùng useEffect + localStorage).
 */
export function AdminClientWrapper({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      {children}
    </AdminAuthGuard>
  );
}
