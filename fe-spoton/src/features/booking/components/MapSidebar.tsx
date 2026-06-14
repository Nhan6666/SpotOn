import React from 'react';
import { BadgeCheck, Users, MoveHorizontal } from 'lucide-react';
import { CapacityFilter } from '../types';

interface MapSidebarProps {
  branchId: string;
  selectedCapacity: CapacityFilter;
  onCapacitySelect: (capacity: CapacityFilter) => void;
  liveOccupancy: number;
}

export function MapSidebar({ branchId, selectedCapacity, onCapacitySelect, liveOccupancy }: MapSidebarProps) {
  // Hardcoded for demo, normally fetched via branchId
  const branchInfo = {
    name: "SpotOn Quận 1 - Bến Nghé",
    address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"
  };

  const capacityOptions: { value: CapacityFilter; label: string; details: string }[] = [
    { value: 2, label: "2 NGƯỜI", details: "60×60 cm / 70×70 cm" },
    { value: 4, label: "4 NGƯỜI", details: "120×80 cm / 110×110 cm" },
    { value: 8, label: "8 NGƯỜI", details: "200×100 cm / Ø 160 cm" }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Branch Info Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">{branchInfo.name}</h2>
          <BadgeCheck className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-sm text-gray-500 mb-4">{branchInfo.address}</p>
        <div className="flex items-center gap-1.5 text-blue-600 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Now Serving
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-gray-800 text-sm tracking-wide">CHỌN THEO SỐ LƯỢNG KHÁCH</h3>
        
        <div className="flex flex-col gap-3">
          {capacityOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onCapacitySelect(selectedCapacity === option.value ? null : option.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedCapacity === option.value 
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                selectedCapacity === option.value ? 'border-blue-600' : 'border-gray-300'
              }`}>
                {selectedCapacity === option.value && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm mb-0.5">
                  <Users className="w-4 h-4" />
                  {option.label}
                </div>
                <div className="text-xs text-gray-500">{option.details}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm tracking-wide mb-3">QUY TẮC KHOẢNG CÁCH</h3>
          <ul className="text-xs text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <MoveHorizontal className="w-3 h-3 text-gray-400" />
              Lối đi chính: 120 - 150 cm
            </li>
            <li className="flex items-center gap-2">
              <MoveHorizontal className="w-3 h-3 text-gray-400" />
              Lối đi phụ: 90 - 110 cm
            </li>
            <li className="flex items-center gap-2">
              <MoveHorizontal className="w-3 h-3 text-gray-400" />
              Tường / Vật cản: ≥ 60 cm
            </li>
          </ul>
        </div>
      </div>

      {/* Live Occupancy */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-800 text-sm tracking-wide">LIVE OCCUPANCY</h3>
          <span className="font-bold text-gray-900">{liveOccupancy}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-amber-700 rounded-full" 
            style={{ width: `${liveOccupancy}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-400 italic">Refreshed just now</div>
      </div>
    </div>
  );
}
