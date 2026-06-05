import React from 'react';
import { Network, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export function BranchStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Branches */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Branches</h3>
          <Network className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-4xl font-bold text-gray-900">12</div>
      </div>

      {/* Active */}
      <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active</h3>
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-bold text-gray-900">10</div>
          <span className="text-sm font-medium text-green-600">↑ 2 this month</span>
        </div>
      </div>

      {/* Opening Soon */}
      <div className="bg-white rounded-xl border border-yellow-200 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500" />
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Soon</h3>
          <Clock className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="text-4xl font-bold text-gray-900">2</div>
      </div>

      {/* Overloaded */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider">Overloaded</h3>
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-bold text-red-600">1</div>
          <span className="text-sm font-medium text-red-600">Requires action</span>
        </div>
      </div>
    </div>
  );
}
