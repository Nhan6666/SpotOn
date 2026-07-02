"use client";

import React, { useEffect } from 'react';
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
      router.replace(`/manager/branches/${user.branch_id}/edit`);
    }
  }, [user, router]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {user?.role === 'MANAGER' ? 'Chi nhánh của tôi' : 'Branch Management'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            {user?.role === 'MANAGER' 
              ? 'Quản lý thông tin và trạng thái hoạt động chi nhánh của bạn.'
              : 'Monitor capacity, manage operations, and oversee regional branches.'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {user?.role !== 'MANAGER' && (
            <Link href="/admin/branches/new" className="flex-1 md:flex-none">
              <Button variant="primary" size="lg" className="w-full shadow-sm">
                <Plus className="w-5 h-5 mr-2" />
                Add New Branch
              </Button>
            </Link>
          )}
        </div>
      </div>

      <BranchStatsCards />
      <BranchList />
    </div>
  );
}
