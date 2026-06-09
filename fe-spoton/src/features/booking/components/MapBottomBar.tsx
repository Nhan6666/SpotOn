import React from 'react';
import { ArrowRight } from 'lucide-react';

interface MapBottomBarProps {
  selectedTableId: string | null;
}

export function MapBottomBar({ selectedTableId }: MapBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-8">
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Bàn đang chọn</div>
            <div className={`text-lg font-bold ${selectedTableId ? 'text-red-600' : 'text-gray-400'}`}>
              {selectedTableId ? `Bàn số ${selectedTableId}` : 'Chưa chọn bàn'}
            </div>
          </div>
          
          <div className="h-10 w-px bg-gray-200 hidden sm:block"></div>

          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Thời gian</div>
            <div className="text-lg font-bold text-gray-900">
              19:30, Hôm nay
            </div>
          </div>
        </div>

        <button 
          disabled={!selectedTableId}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          TIẾP TỤC ĐẶT BÀN
          <ArrowRight className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
}
