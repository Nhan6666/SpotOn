import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';

export interface AddBranchOperationsProps {
  formData: any;
  updateFormData: (fields: any) => void;
  disabled?: boolean;
}

export function AddBranchOperations({ formData, updateFormData, disabled }: AddBranchOperationsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{disabled ? 'Quy định hoạt động' : 'Operational Rules'}</h2>
      
      <div className="space-y-10">

        {/* Service Periods */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Service Periods (Ca phục vụ)</h3>
          <p className="text-sm text-gray-500 mb-6">Thời gian mở cửa và nhận khách cho từng ca. Các mốc thời gian này được tải mặc định từ hệ thống.</p>
          
          {/* LUNCH */}
          <div className="mb-6 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
            <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Ca Trưa (Lunch)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Giờ mở cửa</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.lunch.start}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, lunch: { ...formData.service_periods.lunch, start: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Đóng cửa</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.lunch.end}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, lunch: { ...formData.service_periods.lunch, end: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nhận khách cuối</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.lunch.last_booking}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, lunch: { ...formData.service_periods.lunch, last_booking: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Order cuối</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.lunch.last_order}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, lunch: { ...formData.service_periods.lunch, last_order: e.target.value } } })}
                />
              </div>
            </div>
          </div>

          {/* DINNER */}
          <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
            <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Ca Tối (Dinner)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Giờ mở cửa</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.start}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, start: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Đóng cửa</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.end}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, end: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nhận khách cuối</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.last_booking}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, last_booking: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Order cuối</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.last_order}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, last_order: e.target.value } } })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Initial Service Status</h3>
          <p className="text-sm text-gray-500 mb-4">Set the public-facing status for this branch upon creation.</p>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center">
            <Switch 
              checked={formData.status !== 'CLOSED'} 
              onChange={(e) => updateFormData({ status: e.target.checked ? 'OPEN' : 'CLOSED' })} 
              label={formData.status === 'CLOSED' ? 'Closed / Opening Soon' : 'Open / Accepting Orders'}
              disabled={!disabled}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
