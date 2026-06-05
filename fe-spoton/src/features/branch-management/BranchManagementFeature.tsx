import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BranchStatsCards } from './components/BranchStatsCards';
import { CapacityAlert } from './components/CapacityAlert';
import { BranchList } from './components/BranchList';

export function BranchManagementFeature() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Branch Management</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Monitor capacity, manage operations, and oversee regional branches.</p>
        </div>
        <Link href="/admin/branches/new" className="w-full md:w-auto shrink-0">
          <Button variant="primary" size="lg" className="w-full shadow-sm">
            <Plus className="w-5 h-5 mr-2" />
            Add New Branch
          </Button>
        </Link>
      </div>

      <BranchStatsCards />
      <CapacityAlert />
      <BranchList />
    </div>
  );
}
