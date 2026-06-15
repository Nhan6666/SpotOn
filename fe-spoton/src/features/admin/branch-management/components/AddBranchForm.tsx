import React, { useEffect, useState } from 'react';
import { MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export interface AddBranchFormProps {
  formData: any;
  updateFormData: (fields: any) => void;
  currentBranchId?: string; // Dùng khi Edit: loại trừ chi nhánh hiện tại khỏi filter
}

export function AddBranchForm({ formData, updateFormData, currentBranchId }: AddBranchFormProps) {
  const [managers, setManagers] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const url = currentBranchId
          ? `/api/v1/users/managers?currentBranchId=${currentBranchId}`
          : '/api/v1/users/managers';
        const res = await fetch(url);
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          setManagers(result.data.map((m: any) => ({
            label: m.isAssigned 
              ? `${m.full_name || m.email} (Assigned: ${m.assignedBranchName})` 
              : (m.full_name || m.email),
            value: m._id,
            disabled: m.isAssigned
          })));
        } else {
          setManagers([]);
        }
      } catch {
        // Silently ignore if user API not available yet
      }
    };
    fetchManagers();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Branch Information</h2>

      <div className="space-y-6">
        {/* Branch Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Branch Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., SpotOn Quận 1 - Bến Nghé"
          />
        </div>

        {/* Full Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Full Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              value={formData.address}
              onChange={(e) => updateFormData({ address: e.target.value })}
              placeholder="e.g., 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Hotline */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Branch Hotline
          </label>
          <div className="relative">
            <Input
              value={formData.hotline}
              onChange={(e) => updateFormData({ hotline: e.target.value })}
              placeholder="e.g., 028 1234 5678"
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">This number will be displayed to customers for reservations.</p>
        </div>

        {/* Assign Manager */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Assign Manager
          </label>
          <Select
            value={formData.manager_id || ''}
            onChange={(e) => updateFormData({ manager_id: e.target.value })}
            options={managers}
            placeholder={managers.length > 0 ? 'Select a manager...' : 'No managers found in database'}
          />
          <p className="text-xs text-gray-500 mt-1.5">Only accounts with Manager role will appear here.</p>
        </div>
      </div>
    </div>
  );
}
