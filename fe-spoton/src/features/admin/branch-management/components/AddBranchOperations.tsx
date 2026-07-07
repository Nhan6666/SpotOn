import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

export interface AddBranchOperationsProps {
  formData: any;
  updateFormData: (fields: any) => void;
  disabled?: boolean;
}

export function AddBranchOperations({ formData, updateFormData, disabled }: AddBranchOperationsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{disabled ? ADMIN_TEXTS.addBranchOps.titleRules : ADMIN_TEXTS.addBranchOps.titleOpsRules}</h2>
      
      <div className="space-y-10">

        {/* Service Periods */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{ADMIN_TEXTS.addBranchOps.titleServicePeriods}</h3>
          <p className="text-sm text-gray-500 mb-6">{ADMIN_TEXTS.addBranchOps.descServicePeriods}</p>
          
          {/* LUNCH */}
          <div className="mb-6 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
            <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {ADMIN_TEXTS.addBranchOps.lunch}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeOpen}</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.lunch.start}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, lunch: { ...formData.service_periods.lunch, start: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeClose}</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.lunch.end}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, lunch: { ...formData.service_periods.lunch, end: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeLastBooking}</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.lunch.last_booking}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, lunch: { ...formData.service_periods.lunch, last_booking: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeLastOrder}</label>
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
              {ADMIN_TEXTS.addBranchOps.dinner}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeOpen}</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.start}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, start: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeClose}</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.end}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, end: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeLastBooking}</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.last_booking}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, last_booking: e.target.value } } })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{ADMIN_TEXTS.addBranchOps.timeLastOrder}</label>
                <Input 
                  type="time" 
                  value={formData.service_periods.dinner.last_order}
                  onChange={(e) => updateFormData({ service_periods: { ...formData.service_periods, dinner: { ...formData.service_periods.dinner, last_order: e.target.value } } })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operation Limits */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{ADMIN_TEXTS.addBranchOps.titleLimits}</h3>
          <p className="text-sm text-gray-500 mb-4">{ADMIN_TEXTS.addBranchOps.descLimits}</p>
          <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {ADMIN_TEXTS.addBranchOps.thresholdLabel}
              </label>
              <div className="relative">
                <Input 
                  type="number" 
                  min="50" max="100"
                  value={formData.overload_threshold}
                  onChange={(e) => updateFormData({ overload_threshold: parseInt(e.target.value) || 85 })}
                  disabled={disabled}
                />
                <span className="absolute right-3 top-2.5 text-gray-500 font-medium">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{ADMIN_TEXTS.addBranchOps.thresholdHint}</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{ADMIN_TEXTS.addBranchOps.titleStatus}</h3>
          <p className="text-sm text-gray-500 mb-4">{ADMIN_TEXTS.addBranchOps.descStatus}</p>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center">
            <Switch 
              checked={formData.status !== 'CLOSED'} 
              onChange={(e) => updateFormData({ status: e.target.checked ? 'OPEN' : 'CLOSED' })} 
              label={formData.status === 'CLOSED' ? ADMIN_TEXTS.addBranchOps.statusClosed : ADMIN_TEXTS.addBranchOps.statusOpen}
              disabled={disabled}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
