import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';

export interface AddBranchOperationsProps {
  formData: any;
  updateFormData: (fields: any) => void;
}

export function AddBranchOperations({ formData, updateFormData }: AddBranchOperationsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Operational Rules</h2>
      
      <div className="space-y-10">

        {/* Operating Hours */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Standard Operating Hours</h3>
          <p className="text-sm text-gray-500 mb-4">Define the typical baseline schedule for this location.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Opening Time
              </label>
              <Input 
                type="time" 
                value={formData.open_time}
                onChange={(e) => updateFormData({ open_time: e.target.value })}
                icon={<Clock className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Closing Time
              </label>
              <Input 
                type="time" 
                value={formData.close_time}
                onChange={(e) => updateFormData({ close_time: e.target.value })}
                icon={<Clock className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Overload Threshold */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-gray-900">Overload Threshold</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">
              {formData.overload_threshold}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Alert branch managers when capacity reaches this critical level.
          </p>
          <input 
            type="range" 
            min="50" 
            max="100" 
            value={formData.overload_threshold} 
            onChange={(e) => updateFormData({ overload_threshold: Number(e.target.value) })}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
            <span>50% (Conservative)</span>
            <span>100% (Maximum)</span>
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
            />
          </div>
        </div>

      </div>
    </div>
  );
}
