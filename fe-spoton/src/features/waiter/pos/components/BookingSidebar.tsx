import React from 'react';
import { Clock } from 'lucide-react';
import { Booking } from '../pos.types';

import { Zone } from '@/features/admin/map-editor/map-editor.types';

interface BookingSidebarProps {
  bookings: Booking[];
  zones: Zone[];
  activeShift: 'LUNCH' | 'DINNER';
  setActiveShift: (shift: 'LUNCH' | 'DINNER') => void;
}

export function BookingSidebar({ bookings, zones, activeShift, setActiveShift }: BookingSidebarProps) {
  const filteredBookings = bookings.filter(b => b.shift === activeShift);

  return (
    <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-indigo-600" /> 
          Lịch đặt bàn hôm nay
        </h2>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${activeShift === 'LUNCH' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveShift('LUNCH')}
          >
            Ca Trưa
          </button>
          <button 
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${activeShift === 'DINNER' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveShift('DINNER')}
          >
            Ca Tối
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredBookings.length === 0 ? (
          <p className="text-center text-sm text-gray-400 italic mt-10">Không có lịch {activeShift === 'LUNCH' ? 'Ca Trưa' : 'Ca Tối'}.</p>
        ) : (
          filteredBookings.map(b => (
            <div key={b._id} className={`p-3 rounded-xl border ${b.status === 'IN_USE' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-sm text-gray-900 truncate pr-2" title={b.customer_id?.full_name || b.walk_in_name || 'Khách vãng lai'}>
                  {b.customer_id?.full_name || b.walk_in_name || 'Khách vãng lai'}
                </p>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded flex-shrink-0">{b.arrival_time}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {b.guest_count} khách • Bàn: <span className="font-semibold text-gray-700">
                  {b.table_ids?.map((tId: string) => {
                    for (const z of zones) {
                      const t = z.tables.find((tbl: any) => tbl._id === tId || (tbl._id && tbl._id.toString() === tId.toString()));
                      if (t) return t.table_number;
                    }
                    return null;
                  }).filter(Boolean).join(', ') || 'Chưa xếp'}
                </span>
              </p>
              <div className="text-[10px] font-semibold text-gray-500 uppercase flex items-center justify-between">
                <span>{b.status === 'IN_USE' ? '🟢 Đang ăn' : '🟡 Sắp đến'}</span>
                {b.status === 'IN_USE' && <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">Checked-in</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
