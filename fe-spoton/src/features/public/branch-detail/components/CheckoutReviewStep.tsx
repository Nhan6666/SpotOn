"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Tag, ArrowRight, ShieldCheck } from 'lucide-react';
import { branchDetailService } from '../branch-detail.service';
import { voucherService } from '../../promotions/voucher.service';

interface Props {
  bookingId: string;
  onBack: () => void;
  onPaymentSuccess: (method: 'VNPAY' | 'MOMO') => void;
}

export function CheckoutReviewStep({ bookingId, onBack, onPaymentSuccess }: Props) {
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const fetchDeposit = async (code?: string) => {
    try {
      setIsApplying(true);
      setErrorMsg('');
      const res = await branchDetailService.calculateDeposit(bookingId, code);
      if (res.success) {
        setDepositInfo(res.data);
      } else {
        setErrorMsg(res.message || 'Không thể tính tiền cọc.');
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Có lỗi xảy ra khi tính cọc.');
    } finally {
      setIsLoading(false);
      setIsApplying(false);
    }
  };

  useEffect(() => {
    fetchDeposit();
  }, [bookingId]);

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    
    setIsApplying(true);
    setErrorMsg('');
    try {
      // Gọi API validate
      const validateRes = await voucherService.validateVoucher(
        voucherCode, 
        depositInfo?.branch_id, 
        depositInfo?.guest_count, 
        depositInfo?.pre_order_total_amount
      );
      
      if (validateRes.success) {
        // Nếu hợp lệ thì mới gọi tính cọc
        fetchDeposit(voucherCode);
      } else {
        setErrorMsg(validateRes.message || 'Mã giảm giá không hợp lệ.');
        setIsApplying(false);
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Lỗi kiểm tra mã giảm giá.');
      setIsApplying(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    fetchDeposit();
  };

  const handlePayment = async (method: 'VNPAY' | 'MOMO') => {
    setIsRedirecting(true);
    setErrorMsg('');
    try {
      const res = await branchDetailService.createPayment(
        bookingId,
        method,
        depositInfo?.applied_voucher?.code
      );
      if (res.success && res.data?.payment_url) {
        // Mở URL thanh toán trong tab hiện tại
        window.location.href = res.data.payment_url;
      } else {
        setErrorMsg(res.message || 'Không thể tạo URL thanh toán.');
        setIsRedirecting(false);
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Lỗi kết nối cổng thanh toán.');
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center animate-in fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c] mx-auto mb-4"></div>
        <p className="text-gray-500">Đang tính toán số tiền cọc...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-right-4 fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Xác nhận thanh toán</h3>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Quay lại chọn món
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cột trái: Chi tiết cọc & Voucher */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Chi tiết Tiền cọc
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Cọc giữ bàn (Mặc định)</span>
                <span className="font-medium text-gray-900">{depositInfo?.table_deposit_amount?.toLocaleString()}đ</span>
              </div>
              
              {depositInfo?.pre_order_total_amount > 0 && (
                <>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Tổng tiền chọn món trước</span>
                    <span className="font-medium text-gray-900">{depositInfo?.pre_order_total_amount?.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Cọc món (50% tiền món)</span>
                    <span className="font-medium text-gray-900">{depositInfo?.pre_order_deposit_amount?.toLocaleString()}đ</span>
                  </div>
                </>
              )}

              {depositInfo?.voucher_discount_amount > 0 && (
                <div className="flex justify-between items-center text-green-600 font-medium pt-2 border-t border-gray-100">
                  <span>Giảm giá (Voucher)</span>
                  <span>-{depositInfo?.voucher_discount_amount?.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Tổng Cọc Cần Thanh Toán</span>
                <span className="text-2xl font-bold text-[#ea580c]">
                  {depositInfo?.total_deposit?.toLocaleString()}đ
                </span>
              </div>
              <p className="text-xs text-gray-500 text-right mt-1">Số tiền còn lại sẽ thanh toán sau bữa ăn</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-500" />
              Mã giảm giá
            </h4>
            
            {depositInfo?.applied_voucher ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-green-800">{depositInfo.applied_voucher.code}</p>
                  <p className="text-xs text-green-600">Đã áp dụng giảm {depositInfo.applied_voucher.discount_percentage}%</p>
                </div>
                <button onClick={handleRemoveVoucher} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa</button>
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã giảm giá..."
                  className="flex-1 text-sm border-gray-300 rounded-lg focus:ring-[#ea580c] focus:border-[#ea580c] uppercase"
                />
                <button
                  type="submit"
                  disabled={isApplying || !voucherCode.trim()}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isApplying ? 'Đang áp dụng...' : 'Áp dụng'}
                </button>
              </form>
            )}
            {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
          </div>
        </div>

        {/* Cột phải: Phương thức thanh toán */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#ea580c]" />
            Phương thức thanh toán
          </h4>

          <div className="space-y-3">
            <button
              onClick={() => handlePayment('VNPAY')}
              disabled={isRedirecting}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-[#ea580c] hover:bg-orange-50 transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <img src="/vnpay-logo.png" alt="VNPay" className="h-8 w-auto object-contain bg-white rounded p-1" onError={(e) => { e.currentTarget.src = 'https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr_logo-vnpay.svg'; }} />
                <span className="font-bold text-gray-900 group-hover:text-[#ea580c] transition-colors">Thanh toán qua VNPAY</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#ea580c] transition-colors" />
            </button>

            <button
              onClick={() => handlePayment('MOMO')}
              disabled={isRedirecting}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-[#ea580c] hover:bg-orange-50 transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <img src="/momo-logo.png" alt="MoMo" className="h-8 w-auto object-contain bg-white rounded p-1" onError={(e) => { e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png'; }} />
                <span className="font-bold text-gray-900 group-hover:text-[#ea580c] transition-colors">Thanh toán qua Ví MoMo</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#ea580c] transition-colors" />
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-xs rounded-lg flex gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Giao dịch của bạn được bảo mật tuyệt đối. Sau khi thanh toán, mã giữ bàn sẽ được chuyển sang trạng thái <strong>Đã Xác Nhận</strong>.
            </p>
          </div>
          
          {isRedirecting && (
            <div className="mt-4 text-center text-sm font-medium text-[#ea580c] animate-pulse">
              Đang chuyển hướng đến cổng thanh toán...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
