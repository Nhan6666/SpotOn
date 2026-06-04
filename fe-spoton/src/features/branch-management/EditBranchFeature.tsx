"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddBranchForm } from './components/AddBranchForm';
import { AddBranchOperations } from './components/AddBranchOperations';
import { ProTipsSidebar } from './components/ProTipsSidebar';
import { useBranchContext } from './branch-management.context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function EditBranchFeature({ branchId }: { branchId: string }) {
  const { branches, updateBranch } = useBranchContext();
  const router = useRouter();
  
  const branch = branches.find(b => b._id === branchId);
  const mockBranchName = branch?.name || "Midtown Express";

  const handleUpdate = () => {
    // Simulate updating fields
    updateBranch(branchId, {
      name: mockBranchName + " (Updated)",
    });
    router.push('/admin/branches');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-4">
        <Link href="/admin/branches" className="text-gray-500 hover:text-amber-700 transition-colors">Branch Management</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-gray-900">Edit Branch</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">
        Edit Branch: <span className="font-medium text-gray-600">{mockBranchName}</span>
      </h1>
      
      {/* Simple Tabs Navigation to mimic Stepper from original plan but flattened for Edit */}
      <div className="flex border-b border-gray-200 mb-8">
        <button className="px-6 py-3 border-b-2 border-amber-500 text-amber-700 font-bold text-sm">
          Basic Info
        </button>
        <button className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
          Location
        </button>
        <button className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
          Operations
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AddBranchForm 
            initialData={{
              name: mockBranchName,
              id: "BR-1045",
              type: "express",
              manager: "sarah"
            }} 
          />
          <AddBranchOperations 
            initialData={{
              openTime: "08:00",
              closeTime: "22:00",
              threshold: 45,
              isOpeningSoon: false,
              services: { dineIn: false, takeaway: true, delivery: true, catering: false }
            }}
          />
          
          <div className="flex justify-between items-center mt-8 pb-12 pt-4 border-t border-gray-200">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              Deactivate Branch
            </Button>
            
            <div className="flex gap-4">
              <Link href="/admin/branches">
                <Button variant="outline" className="w-32 bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" className="bg-amber-700 hover:bg-amber-800 text-white border-0" onClick={handleUpdate}>
                Update Changes
              </Button>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <ProTipsSidebar currentStep={1} />
        </div>
      </div>
    </div>
  );
}
