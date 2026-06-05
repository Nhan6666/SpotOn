import React from 'react';
import { MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export interface AddBranchLocationProps {
  formData: any;
  updateFormData: (fields: any) => void;
}

export function AddBranchLocation({ formData, updateFormData }: AddBranchLocationProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Location & Contact</h2>
      
      <div className="space-y-6">
        {/* Address */}
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
      </div>
    </div>
  );
}
