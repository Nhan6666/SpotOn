import React, { useState } from 'react';
import { Booking } from '../pos.types';
import { posService } from '../pos.service';
import { useToast } from '@/components/ui/Toast';
import { ChevronDown, ChevronRight, CheckCircle2, ChefHat, Clock } from 'lucide-react';

interface RunnerListProps {
  bookings: Booking[];
  onRefresh: () => void;
}

export function RunnerList({ bookings, onRefresh }: RunnerListProps) {
  const { success, error: showError } = useToast();
  const [expandedBookingIds, setExpandedBookingIds] = useState<string[]>([]);

  // Lọc ra các booking đang được sử dụng
  const activeBookings = bookings.filter(b => b.status === 'IN_USE' || b.status === 'CONFIRMED');

  const toggleExpand = (id: string) => {
    setExpandedBookingIds(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const handleMarkServed = async (bookingId: string, itemId: string, itemName: string) => {
    if (!window.confirm(`Xác nhận đã mang món "${itemName}" ra bàn?`)) return;
    try {
      await posService.markItemServed(bookingId, itemId);
      success(`Đã bưng món: ${itemName}`);
      onRefresh(); // Refresh lại danh sách từ WebSockets/API
    } catch (err: any) {
      showError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <ChefHat className="text-blue-600" />
          Danh sách Bưng món
        </h2>
        <span className="text-sm text-gray-500 font-medium">
          {activeBookings.length} Bàn đang phục vụ
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeBookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400 italic">
            Chưa có bàn nào đang hoạt động
          </div>
        ) : (
          activeBookings.map(booking => {
            const tableNames = booking.assigned_tables?.map(t => t.table_number).join(', ') || 'N/A';
            const unservedItems = (booking.order_items || []).filter(item => item.prep_status !== 'SERVED');
            const isExpanded = expandedBookingIds.includes(booking._id);
            const isFullyServed = unservedItems.length === 0;

            return (
              <div key={booking._id} className={`border rounded-lg overflow-hidden transition-colors ${isFullyServed ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-white shadow-sm'}`}>
                {/* Accordion Header */}
                <button 
                  onClick={() => toggleExpand(booking._id)}
                  className="w-full p-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isFullyServed ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${isFullyServed ? 'text-gray-600' : 'text-gray-900'}`}>
                        Bàn {tableNames}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        {isFullyServed ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Đã lên đủ món
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {unservedItems.length} món chưa lên
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isFullyServed && (
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
                      Cần bưng: {unservedItems.length}
                    </div>
                  )}
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
                    {booking.order_items && booking.order_items.length > 0 ? (
                      booking.order_items.map((item, idx) => {
                        const isServed = item.prep_status === 'SERVED';
                        const isReady = item.prep_status === 'READY';
                        
                        return (
                          <div 
                            key={item._id || idx} 
                            className={`flex justify-between items-center p-3 rounded-lg border ${
                              isServed ? 'bg-gray-50 border-gray-200 opacity-60' : 
                              isReady ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm truncate ${isServed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  item.prep_status === 'READY' ? 'bg-emerald-100 text-emerald-700' :
                                  item.prep_status === 'PREPARING' ? 'bg-blue-100 text-blue-700' :
                                  item.prep_status === 'SERVED' ? 'bg-gray-200 text-gray-600' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {
                                    item.prep_status === 'READY' ? 'CHỜ BƯNG' :
                                    item.prep_status === 'PREPARING' ? 'ĐANG NẤU' :
                                    item.prep_status === 'SERVED' ? 'ĐÃ LÊN MÓN' :
                                    item.prep_status === 'PENDING' ? 'CHỜ NẤU' :
                                    item.prep_status
                                  }
                                </span>
                                <span className="text-xs text-gray-500 font-medium">SL: {item.quantity}</span>
                              </div>
                            </div>

                            {isReady && (
                              <button
                                onClick={() => handleMarkServed(booking._id, item._id, item.name)}
                                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Bưng món
                              </button>
                            )}
                            {!isReady && !isServed && (
                              <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-400 italic">
                                Đang chờ bếp...
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        Chưa có món nào được gọi.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
