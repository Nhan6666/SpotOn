import React, { useState, useMemo } from 'react';
import { X, Info, Users, Clock, Coffee, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OrderItem {
  name: string;
  quantity: number;
  price_at_time: number;
  type: 'PRE_ORDER' | 'ADDITIONAL';
}

interface BookingDetails {
  _id: string;
  customer_id?: { _id: string; full_name: string; phone: string };
  walk_in_name?: string;
  walk_in_phone?: string;
  assigned_tables: { table_number: string }[];
  order_items?: OrderItem[];
  pre_order_total_amount?: number;
  total_deposit_paid?: number;
  guest_count: number;
  arrival_time: string;
  reservation_date: string;
  status: string;
  note?: string;
}

interface BookingDetailsModalProps {
  booking: BookingDetails | null;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 5;

export function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  if (!booking) return null;

  const customerName = booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai';
  const phone = booking.customer_id?.phone || booking.walk_in_phone || 'Không có';
  const tableNames = booking.assigned_tables?.map(t => t.table_number).join(', ') || 'Chưa xếp';

  const items = booking.order_items || [];
  
  // Tính tổng tiền dựa trên order_items nếu có
  const calculatedTotal = items.reduce((acc, item) => acc + (item.price_at_time * item.quantity), 0);
  const totalBill = calculatedTotal > 0 ? calculatedTotal : (booking.pre_order_total_amount || 0);
  const depositPaid = booking.total_deposit_paid || 0;

  // Lọc và Phân trang món ăn
  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Chi tiết Đơn đặt bàn</h2>
              <p className="text-indigo-100 text-sm">Mã đơn: {booking._id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Thông tin chung */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2 border-b pb-2">Khách hàng</h3>
              <p className="font-bold text-gray-900">{customerName}</p>
              <p className="text-sm text-gray-500">{phone}</p>
              {booking.note && (
                <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-100">
                  <strong>Ghi chú:</strong> {booking.note}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Ngày</span>
                <p className="font-semibold text-sm">{new Date(booking.reservation_date).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Giờ đến</span>
                <p className="font-semibold text-sm">{booking.arrival_time}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3"/> Số khách</span>
                <p className="font-semibold text-sm">{booking.guest_count} người</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Coffee className="w-3 h-3"/> Bàn</span>
                <p className="font-semibold text-sm">{tableNames}</p>
              </div>
            </div>
          </div>

          {/* Chi tiết món ăn có Search & Pagination */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">Danh sách món đã đặt ({items.length})</h3>
              {items.length > 0 && (
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Tìm món..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
            
            {items.length === 0 ? (
              <p className="text-gray-500 italic text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Khách chưa gọi món nào.
              </p>
            ) : filteredItems.length === 0 ? (
              <p className="text-gray-500 italic text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Không tìm thấy món "{searchQuery}".
              </p>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Tên món</th>
                      <th className="px-4 py-3 text-center">SL</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, idx) => (
                      <tr key={idx} className="bg-white border-b hover:bg-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.name}
                          {item.type === 'PRE_ORDER' && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-100 text-indigo-700">PRE</span>}
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{item.price_at_time.toLocaleString()}đ</td>
                        <td className="px-4 py-3 text-right font-semibold">{(item.price_at_time * item.quantity).toLocaleString()}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        Trước
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tài chính */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 text-sm">Tóm tắt tài chính</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tổng tiền tạm tính:</span>
                <span className="font-semibold text-gray-900">{totalBill.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center text-green-700">
                <span>Tiền cọc đã thu:</span>
                <span className="font-semibold">- {depositPaid.toLocaleString()}đ</span>
              </div>
              <div className="h-px bg-blue-200 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Khách cần trả thêm:</span>
                <span className="font-bold text-lg text-blue-700">{Math.max(0, totalBill - depositPaid).toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
          <Button 
            variant="outline" 
            className="border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold px-8"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
