"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BranchStatsCards } from './components/BranchStatsCards';
import { BranchList } from './components/BranchList';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export function BranchManagementFeature() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect manager to their specific branch page
  useEffect(() => {
    if (user?.role === 'MANAGER' && user.branch_id) {
      router.replace(`/manager/branch/edit`);
    }
  }, [user, router]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Quản lý Chi nhánh</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Quản lý tất cả thông tin và trạng thái hoạt động của chi nhánh.</p>
        </div>
        <Link href="/admin/branches/new">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Thêm chi nhánh mới
          </Button>
        </Link>
      </div>

      <BranchStatsCards />
      <BranchList />
    </div>
  );
}
