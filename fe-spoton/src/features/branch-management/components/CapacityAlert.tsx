import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function CapacityAlert() {
  return (
    <div className="mb-6 bg-gradient-to-r from-red-50 to-white border-l-4 border-red-500 p-4 rounded-r-md shadow-sm flex items-start justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Capacity Alert: Midtown Express</h4>
          <p className="text-sm text-gray-600 mt-1">
            Midtown Express (BR-1045) is currently operating at 92% capacity. Consider rerouting catering orders to Downtown Metro.
          </p>
        </div>
      </div>
      <button className="text-sm font-semibold text-red-600 hover:text-red-700 whitespace-nowrap">
        View Details
      </button>
    </div>
  );
}
