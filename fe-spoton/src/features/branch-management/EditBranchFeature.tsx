  "use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddBranchForm } from './components/AddBranchForm';
import { AddBranchOperations } from './components/AddBranchOperations';
import { useBranchContext } from './branch-management.context';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function EditBranchFeature({ branchId }: { branchId: string }) {
  const { updateBranch } = useBranchContext();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    hotline: '',
    manager_id: '',
    open_time: '09:00',
    close_time: '22:00',
    status: 'OPEN' as 'OPEN' | 'FULL' | 'CLOSED',
    overload_threshold: 85,
  });

  // Fetch branch data trực tiếp từ API theo branchId
  useEffect(() => {
    const fetchBranch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/branches/${branchId}`);
        const result = await response.json();
        if (result.success && result.data) {
          const b = result.data;
          setFormData({
            name: b.name || '',
            address: b.address || '',
            hotline: b.hotline || '',
            // manager_id có thể là object (sau populate) hoặc string (ObjectId)
            manager_id: typeof b.manager_id === 'object' && b.manager_id ? b.manager_id._id : (b.manager_id || ''),
            open_time: b.open_time || '09:00',
            close_time: b.close_time || '22:00',
            status: b.status || 'OPEN',
            overload_threshold: b.overload_threshold || 85,
          });
        }
      } catch (error) {
        console.error('Failed to fetch branch:', error);
        showError('Failed to load branch data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranch();
  }, [branchId]);

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.address) {
      showError('Name and Address are required!');
      return;
    }
    
    if (!formData.manager_id) {
      showError('Please assign a Manager for this branch!');
      return;
    }

    setIsSaving(true);
    try {
      await updateBranch(branchId, formData);
      success(`Branch "${formData.name}" updated successfully.`);
      router.push('/admin/branches');
    } catch (error) {
      showError('Failed to update branch. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
        Edit Branch: <span className="font-medium text-gray-600">{formData.name || 'Loading...'}</span>
      </h1>
      
      <div className="max-w-2xl mx-auto space-y-8">
          <AddBranchForm 
            formData={formData}
            updateFormData={updateFormData}
            currentBranchId={branchId}
          />
          <AddBranchOperations 
            formData={formData}
            updateFormData={updateFormData}
          />
          
          <div className="flex justify-between items-center mt-8 pb-12 pt-4 border-t border-gray-200">
            <Link href="/admin/branches">
              <Button variant="outline" className="w-32 bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" className="bg-amber-700 hover:bg-amber-800 text-white border-0" onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update Changes'}
            </Button>
          </div>
      </div>
    </div>
  );
}
