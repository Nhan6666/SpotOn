"use client";

import React from 'react';
import { 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2,
  Coffee,
  ArrowRight,
  Eye,
  Globe,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CheckoutModal } from './components/CheckoutModal';
import { BookingDetailsModal } from './components/BookingDetailsModal';
import { useCheckInKanban } from './useCheckInKanban';
import { Booking } from './check-in.types';

export function CheckInKanbanFeature() {
  const {
    isLoading,
    selectedDate,
    setSelectedDate,
    incoming,
    late,
    inUse,
    pendingSettlement,
    handleCheckIn,
    handleForceRelease,
    selectedBookingForCheckout,
    setSelectedBookingForCheckout,
    selectedBookingForDetails,
    setSelectedBookingForDetails,
    fetchBookings,
    zones
  } = useCheckInKanban();

  const renderBookingCard = (booking: Booking, isLate: boolean = false) => {
    const isOnlineMember = !!booking.customer_id;
    // Walk-in từ Waiter luôn có status là IN_USE ngay từ đầu và walk_in_name là 'Khách vãng lai'
    // Đặt online cũ bị mất SĐT nhưng có thể nhận biết qua trạng thái CONFIRMED hoặc đã thanh toán cọc
    const hasDeposit = booking.payment_info?.status === 'PAID' || !!booking.payment_info?.transaction_id;
    const isOnlineGuest = !booking.customer_id && (!!booking.walk_in_phone || hasDeposit || booking.status === 'CONFIRMED' || (booking.walk_in_name && booking.walk_in_name !== 'Khách vãng lai')); 
    const isOnline = isOnlineMember || isOnlineGuest;

    // Waiter tạo (Walk-in) thường không có customer_id và không có walk_in_phone, hoặc walk_in_name = 'Khách vãng lai'
    const name = booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai';
    const phone = booking.customer_id?.phone || booking.walk_in_phone || 'N/A';
    
    // Nếu assigned_tables rỗng (booking cũ), map từ table_ids thông qua zones. Mới thì đã có assigned_tables.
    const tableNames = booking.assigned_tables && booking.assigned_tables.length > 0
      ? booking.assigned_tables.map(t => t.table_number).join(', ')
      : (booking.table_ids && booking.table_ids.length > 0 ? booking.table_ids.map(id => {
          for (const z of zones) {
            const t = z.tables.find((tbl: any) => tbl._id === id || (tbl._id && tbl._id.toString() === id.toString()));
            if (t) return t.table_number;
          }
          return `ID: ${id.toString().slice(-4)}`;
        }).join(', ') : 'Chưa xếp');

    return (
      <div 
        key={booking._id} 
        className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${isLate ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-200'}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
              {isOnline ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  <Globe className="w-3 h-3" /> Đặt Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  <Store className="w-3 h-3" /> Tại quán
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">SĐT: {phone}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="font-bold text-gray-900 text-lg tracking-tight">{booking.arrival_time}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">
            <Users className="w-4 h-4" />
            {booking.guest_count} người
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-sm font-medium">
            <Coffee className="w-4 h-4" />
            Bàn: {tableNames}
          </div>
        </div>

        {booking.note && (
          <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-2.5 rounded-lg text-sm mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2">{booking.note}</p>
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button 
            variant="outline"
            onClick={() => setSelectedBookingForDetails(booking)}
            className="flex-1 bg-white text-gray-700 border-gray-200 hover:bg-gray-50 font-medium"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Chi tiết
          </Button>

          {booking.status === 'CONFIRMED' ? (
            <Button 
              onClick={() => handleCheckIn(booking._id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-2"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Check-in
            </Button>
          ) : booking.status === 'IN_USE' ? (
            <div className="flex flex-1 gap-2">
              <Button 
                variant="outline" 
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 font-semibold px-2"
                onClick={() => handleForceRelease(booking._id)}
              >
                Nhả bàn
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold px-2"
                onClick={() => setSelectedBookingForCheckout(booking)}
              >
                Thanh toán <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          ) : (
            <div className="flex-1 px-2 py-2 text-center text-sm font-semibold text-amber-700 bg-amber-50 rounded-md border border-amber-200">
              Chờ đối soát
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu Kanban...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kanban Check-in</h1>
          <p className="text-gray-500">Quản lý khách đến nhà hàng theo ngày</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <label className="text-sm font-bold text-gray-700 pl-2">Chọn ngày:</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium text-sm"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Column 1: Incoming */}
        <div className="flex flex-col bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              Sắp đến
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{incoming.length}</span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {incoming.map(b => renderBookingCard(b))}
            {incoming.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-4">Không có khách sắp đến</p>
            )}
          </div>
        </div>

        {/* Column 2: Late */}
        <div className="flex flex-col bg-rose-50/50 rounded-2xl border border-rose-100 overflow-hidden">
          <div className="p-4 bg-white border-b border-rose-100 flex justify-between items-center">
            <h2 className="font-bold text-rose-700 flex items-center gap-2">
              Trễ giờ
              <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full">{late.length}</span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {late.map(b => renderBookingCard(b, true))}
            {late.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-4">Không có khách trễ giờ</p>
            )}
          </div>
        </div>

        {/* Column 3: In Use */}
        <div className="flex flex-col bg-blue-50/30 rounded-2xl border border-blue-100 overflow-hidden">
          <div className="p-4 bg-white border-b border-blue-100 flex justify-between items-center">
            <h2 className="font-bold text-blue-700 flex items-center gap-2">
              Đang phục vụ
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{inUse.length}</span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inUse.map(b => renderBookingCard(b))}
            {inUse.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-4">Chưa có bàn nào đang phục vụ</p>
            )}
          </div>
        </div>
      </div>

      {selectedBookingForCheckout && (
        <CheckoutModal 
          booking={selectedBookingForCheckout}
          onClose={() => setSelectedBookingForCheckout(null)}
          onSuccess={() => {
            setSelectedBookingForCheckout(null);
            fetchBookings(); // Reload để thẻ biến mất khỏi Kanban
          }}
        />
      )}

      {selectedBookingForDetails && (
        <BookingDetailsModal 
          booking={selectedBookingForDetails}
          onClose={() => setSelectedBookingForDetails(null)}
        />
      )}
    </div>
  );
}
