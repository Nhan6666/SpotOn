"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Tag, ArrowRight, ShieldCheck, Wallet, SmartphoneNfc, ChevronDown } from 'lucide-react';
import { branchDetailService } from '../branch-detail.service';
import { voucherService } from '../../promotions/voucher.service';
import { useAuth } from '@/providers/AuthProvider';

interface Props {
  bookingId: string;
  onBack: () => void;
  onPaymentSuccess: (method: 'VNPAY' | 'MOMO') => void;
}

export function CheckoutReviewStep({ bookingId, onBack, onPaymentSuccess }: Props) {
  const { isAuthenticated } = useAuth();
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [myWallet, setMyWallet] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      voucherService.getMyWallet().then((res) => {
        if (res.success) {
          // Chỉ lấy các voucher chưa sử dụng
          setMyWallet(res.data.filter((v: any) => v.status === 'UNUSED'));
        }
      }).catch(console.error);
    }
  }, [isAuthenticated]);

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
    <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 fade-in">
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <h3 className="text-2xl font-bold text-gray-900">Xác nhận thanh toán</h3>
        <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-[#ea580c] transition-colors flex items-center gap-1">
          &larr; Quay lại
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Cột trái: Chi tiết cọc & Voucher */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-6 text-lg border-b pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Chi tiết Tiền cọc
            </h4>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-gray-600">
                <span>Cọc giữ bàn (Mặc định)</span>
                <span className="font-semibold text-gray-900">{depositInfo?.table_deposit_amount?.toLocaleString()}đ</span>
              </div>
              
              {depositInfo?.pre_order_total_amount > 0 && (
                <>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Tổng tiền món đặt trước</span>
                    <span className="font-semibold text-gray-900">{depositInfo?.pre_order_total_amount?.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Cọc món (50% tiền món)</span>
                    <span className="font-semibold text-gray-900">{depositInfo?.pre_order_deposit_amount?.toLocaleString()}đ</span>
                  </div>
                </>
              )}

              {depositInfo?.voucher_discount_amount > 0 && (
                <div className="flex justify-between items-center text-green-600 font-medium">
                  <span>Giảm giá (Voucher dự kiến)</span>
                  <span>-{depositInfo?.voucher_discount_amount?.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                Mã giảm giá (Sẽ áp dụng khi thanh toán)
              </p>
              
              {depositInfo?.applied_voucher ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-green-800">{depositInfo.applied_voucher.code}</p>
                    <p className="text-xs text-green-600">Dự kiến giảm {depositInfo.applied_voucher.discount_percentage}% hóa đơn cuối</p>
                  </div>
                  <button onClick={handleRemoveVoucher} className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 bg-white rounded-lg border border-red-100 shadow-sm transition-colors">
                    Hủy
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyVoucher} className="flex flex-col gap-2">
                  {myWallet.length > 0 && (
                    <div className="relative z-10">
                      <div 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <span className={voucherCode ? "text-gray-900 font-bold" : "text-gray-500"}>
                          {voucherCode || "-- Chọn voucher từ ví --"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </div>

                      {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          <div 
                            className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm text-gray-500 border-b border-gray-100"
                            onClick={() => {
                              setVoucherCode('');
                              setShowDropdown(false);
                            }}
                          >
                            -- Không chọn --
                          </div>
                          {myWallet.filter(v => {
                            if (v.voucher_id.branch_id && depositInfo?.branch_id) {
                              const vBranchId = typeof v.voucher_id.branch_id === 'object' ? v.voucher_id.branch_id._id : v.voucher_id.branch_id;
                              return vBranchId === depositInfo.branch_id;
                            }
                            return true;
                          }).map((v) => (
                            <div 
                              key={v._id}
                              className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex justify-between items-center"
                              onClick={() => {
                                setVoucherCode(v.voucher_id.code);
                                setShowDropdown(false);
                              }}
                            >
                              <span className="font-bold text-gray-900">{v.voucher_id.code}</span>
                              <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs font-semibold">
                                -{v.voucher_id.discount_percentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Hoặc nhập mã giảm giá..."
                      className="flex-1 text-sm border-gray-300 rounded-xl focus:ring-[#ea580c] focus:border-[#ea580c] uppercase px-4"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !voucherCode.trim()}
                      className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isApplying ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                </form>
              )}
              {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 bg-orange-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-700 text-sm">Tổng Cọc Cần Thanh Toán</span>
                <span className="text-3xl font-black text-[#ea580c]">
                  {depositInfo?.total_deposit?.toLocaleString()}đ
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                * Số tiền còn lại sẽ thanh toán sau khi dùng bữa
              </p>
            </div>
          </div>
        </div>

        {/* Cột phải: Phương thức thanh toán */}
        <div className="flex flex-col">
          <div className="pb-4 mb-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-[#ea580c]" />
              Chọn phương thức
            </h4>
            <p className="text-gray-500 text-sm mt-1">Chọn 1 trong các phương thức dưới đây để hoàn tất thanh toán cọc an toàn.</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => handlePayment('VNPAY')}
              disabled={isRedirecting}
              className="w-full relative group flex items-center justify-between p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-[#005BAA] hover:bg-[#005BAA]/5 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/vnpay.svg" alt="VNPAY" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-gray-900 group-hover:text-[#005BAA] transition-colors text-[15px]">Thanh toán qua VNPAY</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Thẻ ATM / Thẻ quốc tế / QR Code</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#005BAA] group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => handlePayment('MOMO')}
              disabled={isRedirecting}
              className="w-full relative group flex items-center justify-between p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-[#A50064] hover:bg-[#A50064]/5 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1.5 shadow-sm">
                  <img src="/momo.png" alt="MoMo" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-gray-900 group-hover:text-[#A50064] transition-colors text-[15px]">Thanh toán qua Ví MoMo</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Quét mã QR / Ứng dụng MoMo</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#A50064] group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 text-blue-800 text-sm rounded-2xl flex gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <p className="leading-relaxed">
              Giao dịch được mã hóa bảo mật tuyệt đối. Trạng thái đặt bàn sẽ tự động cập nhật ngay sau khi thanh toán.
            </p>
          </div>
          
          {isRedirecting && (
            <div className="mt-4 text-center text-sm font-medium text-[#ea580c] animate-pulse">
              Đang kết nối an toàn đến cổng thanh toán...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
