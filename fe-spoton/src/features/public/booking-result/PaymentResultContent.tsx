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
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className={`p-8 text-center border-b ${isSuccess ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
        {isSuccess ? (
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
        ) : (
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        )}
        <h1 className={`text-3xl font-bold mb-2 ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
          {isSuccess ? 'Đặt bàn & Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h1>
        <p className={isSuccess ? 'text-green-600' : 'text-red-600'}>
          {isSuccess 
            ? 'Cảm ơn bạn đã sử dụng dịch vụ của SpotOn. Vui lòng đưa mã này cho nhân viên khi đến nhà hàng.'
            : 'Giao dịch đã bị hủy hoặc có lỗi xảy ra. Bạn có thể thử lại.'}
        </p>
      </div>

      {/* Body */}
      <div className="p-8">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Thông tin đặt bàn</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> Chi nhánh</p>
              <p className="font-bold text-gray-900">{bookingInfo.branch_id?.name || 'SpotOn Restaurant'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1 flex items-center gap-1"><Users className="w-4 h-4" /> Số khách</p>
              <p className="font-bold text-gray-900">{bookingInfo.guest_count} người</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4" /> Ngày nhận bàn</p>
              <p className="font-bold text-gray-900">{new Date(bookingInfo.reservation_date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-4 h-4" /> Giờ đến (Dự kiến)</p>
              <p className="font-bold text-gray-900">{bookingInfo.arrival_time}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-sm mb-1 text-center">Mã Đặt Bàn (Đưa cho nhân viên)</p>
            <p className="text-3xl font-mono font-bold text-center tracking-widest text-[#ea580c]">
              {bookingInfo._id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isSuccess ? (
            <Link 
              href={`/branches/${bookingInfo.branch_id?._id}`}
              className="px-6 py-3 bg-[#ea580c] text-white font-bold rounded-xl hover:bg-[#c2410c] transition-colors flex items-center justify-center gap-2"
            >
              Về Trang Chi Nhánh <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link 
              href={`/branches/${bookingInfo.branch_id?._id}/booking`}
              className="px-6 py-3 bg-[#ea580c] text-white font-bold rounded-xl hover:bg-[#c2410c] transition-colors flex items-center justify-center gap-2"
            >
              Đặt Lại Bàn <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
