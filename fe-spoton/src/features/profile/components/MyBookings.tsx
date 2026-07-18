'use client';

import React, { useEffect, useState } from 'react';
import { profileService } from '../profile.service';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, RefreshCw, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CancelBookingModal } from './CancelBookingModal';

export function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<any | null>(null);
  const { success, error: showError } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await profileService.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      showError(err.message || 'Lỗi khi tải lịch sử đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (payload: { bank_name: string; bank_account_number: string; account_holder_name: string; reason: string }) => {
    if (!selectedBookingForCancel) return;
    
    try {
      setCancelingId(selectedBookingForCancel._id);
      const res = await profileService.cancelBooking(selectedBookingForCancel._id, payload);
      success(res.message);
      setSelectedBookingForCancel(null);
      fetchBookings();
    } catch (err: any) {
      showError(err.message || 'Lỗi khi hủy đặt bàn');
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Chờ thanh toán</span>;
      case 'CONFIRMED':
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận</span>;
      case 'IN_USE':
        return <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Đang dùng bữa</span>;
      case 'COMPLETED':
      case 'PENDING_SETTLEMENT':
        return <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành</span>;
      case 'CANCELLED':
      case 'CANCELLED_TIMEOUT':
        return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Đã hủy</span>;
      case 'CANCELLED_REFUND_PENDING':
        return <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Undo2 className="w-3.5 h-3.5" /> Hủy - Chờ hoàn tiền</span>;
      case 'REFUND_COMPLETED':
        return <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Undo2 className="w-3.5 h-3.5" /> Đã hoàn tiền</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có đơn đặt bàn nào</h3>
        <p className="text-gray-500">Bạn chưa thực hiện bất kỳ giao dịch đặt bàn nào tại SpotOn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thông tin chính sách hoàn tiền */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-sm">
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-orange-900 mb-1">Chính sách hủy bàn & hoàn cọc:</p>
          <ul className="list-disc pl-5 text-orange-800 space-y-0.5">
            <li>Hủy trước <strong>12 tiếng</strong>: Hoàn <strong className="text-red-600">100%</strong> cọc</li>
            <li>Hủy từ <strong>6 - 12 tiếng</strong>: Hoàn <strong className="text-red-600">50%</strong> cọc</li>
            <li>Hủy dưới <strong>6 tiếng</strong>: <strong className="text-red-600">Không hoàn cọc</strong></li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => {
          const date = new Date(booking.reservation_date).toLocaleDateString('vi-VN');
          const isCancellable = ['PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status);
          const totalDeposit = booking.total_deposit_paid || 0;
          const refundInfo = booking.refund_info;

          return (
            <div key={booking._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 text-orange-600 p-2.5 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Mã đơn: {booking._id.slice(-6).toUpperCase()}</h3>
                    <p className="text-sm text-gray-500">{booking.branch_id?.name || 'Chi nhánh SpotOn'}</p>
                  </div>
                </div>
                <div>{getStatusBadge(booking.status)}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày đến</p>
                  <p className="font-semibold text-gray-900">{date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Giờ đến</p>
                  <p className="font-semibold text-gray-900">{booking.arrival_time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Số khách</p>
                  <p className="font-semibold text-gray-900">{booking.guest_count} người</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tiền cọc đã thanh toán</p>
                  <p className="font-bold text-orange-600">{totalDeposit.toLocaleString()}đ</p>
                </div>
              </div>

              {booking.cancellation_reason && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4 border border-gray-100">
                  <span className="font-semibold">Lý do hủy:</span> {booking.cancellation_reason}
                </div>
              )}

              {refundInfo && refundInfo.refund_amount > 0 && (
                <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800 mb-4 border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold block">Thông tin hoàn tiền:</span>
                    <span>Số tiền hoàn: <strong className="text-lg">{refundInfo.refund_amount.toLocaleString()}đ</strong> ({refundInfo.refund_percentage}%)</span>
                  </div>
                  {booking.status === 'REFUND_COMPLETED' ? (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">Đã chuyển khoản</span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">Đang chờ xử lý</span>
                  )}
                </div>
              )}

              {isCancellable && (
                <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-semibold"
                    onClick={() => setSelectedBookingForCancel(booking)}
                    disabled={cancelingId === booking._id}
                  >
                    {cancelingId === booking._id ? 'Đang xử lý...' : 'Hủy bàn & Hoàn cọc'}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedBookingForCancel && (
        <CancelBookingModal 
          booking={selectedBookingForCancel}
          onClose={() => setSelectedBookingForCancel(null)}
          onConfirm={handleCancelBooking}
          isSubmitting={cancelingId === selectedBookingForCancel._id}
        />
      )}
    </div>
  );
}
