import React, { useEffect, useState } from 'react';
import { MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import dynamic from 'next/dynamic';

const MapLocationPicker = dynamic(() => import('./MapLocationPicker'), { 
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Đang tải bản đồ...</div>
});

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

        {/* Structured Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tỉnh/Thành phố</label>
            <Input value="Cần Thơ" disabled className="bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quận/Huyện <span className="text-red-500">*</span></label>
            <Select
              value={formData.address?.district || ''}
              onChange={(e) => updateFormData({ address: { ...formData.address, district: e.target.value } })}
              options={[
                { label: 'Ninh Kiều', value: 'Ninh Kiều' },
                { label: 'Bình Thủy', value: 'Bình Thủy' },
                { label: 'Cái Răng', value: 'Cái Răng' },
                { label: 'Ô Môn', value: 'Ô Môn' },
                { label: 'Thốt Nốt', value: 'Thốt Nốt' },
              ]}
              placeholder="Chọn Quận/Huyện"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phường/Xã</label>
            <Input
              value={formData.address?.ward || ''}
              onChange={(e) => updateFormData({ address: { ...formData.address, ward: e.target.value } })}
              placeholder="VD: Phường Xuân Khánh"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên đường, Số nhà</label>
            <Input
              value={formData.address?.street || ''}
              onChange={(e) => updateFormData({ address: { ...formData.address, street: e.target.value } })}
              placeholder="VD: 3/2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Địa chỉ đầy đủ <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              value={formData.address?.full || ''}
              onChange={(e) => updateFormData({ address: { ...formData.address, full: e.target.value } })}
              placeholder="VD: Khu II, Đ. 3/2, Phường Xuân Khánh, Ninh Kiều, Cần Thơ"
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Map Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Vị trí trên bản đồ <span className="text-red-500">*</span>
          </label>
          <MapLocationPicker 
            location={formData.location}
            onChange={(coords) => updateFormData({ location: { type: 'Point', coordinates: coords } })}
          />
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
