"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, MapPin, Calendar, Clock, Users } from 'lucide-react';
import { branchDetailService } from '../branch-detail/branch-detail.service';
import Link from 'next/link';

export function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const bookingId = searchParams.get('bookingId');
  const status = searchParams.get('status'); // 'success' | 'failed'
  
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Xóa nháp booking khi về đến trang này
    localStorage.removeItem('spoton_draft_booking');

    const fetchBooking = async () => {
      if (!bookingId) {
        setIsLoading(false);
        return;
      }

      const data = await branchDetailService.getBookingById(bookingId);
      if (data) {
        setBookingInfo(data);
      }
      setIsLoading(false);
    };

    fetchBooking();
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ea580c] mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Đang kiểm tra kết quả giao dịch...</p>
      </div>
    );
  }

  const isSuccess = status === 'success';

  if (!bookingId || !bookingInfo) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-12 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin đơn đặt bàn</h2>
        <p className="text-gray-500 mb-8">Vui lòng kiểm tra lại đường dẫn hoặc liên hệ tổng đài.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#ea580c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#c2410c] transition-colors">
          Về Trang Chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 mt-8 mb-8">
      {/* Header */}
      <div className="pt-8 pb-4 text-center flex flex-col items-center">
        {isSuccess ? (
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        )}
        <h1 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-gray-900' : 'text-red-600'}`}>
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed px-6">
          {isSuccess 
            ? 'Cảm ơn bạn đã đặt bàn. Vui lòng đưa mã này cho nhân viên khi đến nhà hàng.'
            : 'Giao dịch đã bị hủy hoặc có lỗi xảy ra. Bạn có thể thử lại.'}
        </p>
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        <div className="border border-gray-100 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
            <div>
              <p className="text-gray-400 text-[10px] mb-0.5 flex items-center gap-1 uppercase tracking-wider font-semibold"><MapPin className="w-3 h-3" /> Chi nhánh</p>
              <p className="font-semibold text-gray-900">{bookingInfo.branch_id?.name || 'SpotOn Restaurant'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] mb-0.5 flex items-center gap-1 uppercase tracking-wider font-semibold"><Users className="w-3 h-3" /> Số khách</p>
              <p className="font-semibold text-gray-900">{bookingInfo.guest_count} người</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] mb-0.5 flex items-center gap-1 uppercase tracking-wider font-semibold"><Calendar className="w-3 h-3" /> Nhận bàn</p>
              <p className="font-semibold text-gray-900">{new Date(bookingInfo.reservation_date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] mb-0.5 flex items-center gap-1 uppercase tracking-wider font-semibold"><Clock className="w-3 h-3" /> Giờ đến</p>
              <p className="font-semibold text-gray-900">{bookingInfo.arrival_time}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 border-dashed">
            <p className="text-gray-400 text-[10px] mb-2 text-center font-semibold uppercase tracking-wider">Mã đặt bàn</p>
            <div className="bg-[#1B4E30]/5 border border-dashed border-[#1B4E30]/40 rounded-xl py-2 px-6 mx-auto w-fit">
              <p className="text-2xl font-mono font-bold tracking-[0.2em] text-[#1B4E30]">
                {bookingInfo._id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row gap-3">
          {isSuccess ? (
            <>
              <button 
                onClick={() => alert("Tính năng xem lịch sử giao dịch sẽ được cập nhật sau.")}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                Lịch sử giao dịch
              </button>
              <Link 
                href="/"
                className="flex-1 px-4 py-2.5 bg-[#1B4E30] text-white font-semibold text-sm rounded-xl hover:bg-[#113320] transition-colors flex items-center justify-center gap-2"
              >
                Trang Chủ <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <Link 
              href="/"
              className="w-full px-4 py-2.5 bg-[#1B4E30] text-white font-semibold text-sm rounded-xl hover:bg-[#113320] transition-colors flex items-center justify-center gap-2"
            >
              Về Trang Chủ <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
