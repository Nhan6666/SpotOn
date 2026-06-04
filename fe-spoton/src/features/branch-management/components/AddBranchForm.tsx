import React from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export interface AddBranchFormProps {
  initialData?: {
    name?: string;
    id?: string;
    type?: string;
    manager?: string;
  };
}

export function AddBranchForm({ initialData }: AddBranchFormProps = {}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Branch Name <span className="text-red-500">*</span>
          </label>
          <Input defaultValue={initialData?.name} placeholder="e.g., Downtown Metro Hub" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Branch ID
          </label>
          <div className="relative">
            <Input 
              value={initialData?.id || "BR-1042-NY"} 
              disabled 
              className="bg-gray-50 text-gray-500 pr-10 border-gray-200" 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Auto-generated based on next available sequence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Branch Type <span className="text-red-500">*</span>
            </label>
            <Select 
              defaultValue={initialData?.type || ""}
              options={[
                { label: 'Flagship Store', value: 'flagship' },
                { label: 'Express Kiosk', value: 'express' },
                { label: 'Standard Branch', value: 'standard' }
              ]} 
              placeholder="Select branch type..." 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Assign Manager
            </label>
            <Select 
              defaultValue={initialData?.manager || ""}
              options={[
                { label: 'Sarah Jenkins', value: 'sarah' },
                { label: 'Marcus Reed', value: 'marcus' }
              ]} 
              placeholder="Search managers..." 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
