import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Table } from '../pos.types';

interface WalkInModalProps {
  table: Table;
  guestCount: number;
  setGuestCount: (count: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function WalkInModal({ 
  table, 
  guestCount, 
  setGuestCount, 
  onClose, 
  onSubmit, 
  isSubmitting 
}: WalkInModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <UserPlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Mở bàn {table.table_number}</h3>
          <p className="text-gray-500 text-sm text-center mt-1">iPad tại bàn này sẽ tự động được mở khóa để khách order.</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng khách thực tế</label>
          <input 
            type="number"
            min="1"
            value={guestCount}
            onChange={e => setGuestCount(Number(e.target.value))}
            className="w-full text-center text-lg font-bold border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-3"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang mở...' : 'Mở Bàn Ngay'}
          </Button>
        </div>
      </div>
    </div>
  );
}
