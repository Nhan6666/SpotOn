import React, { useState, useEffect } from 'react';
import { X, Receipt, CreditCard, Banknote, Coffee, Plus, Tag, ChevronDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';
import { voucherService } from '@/features/public/promotions/voucher.service';

interface OrderItem {
  name: string;
  quantity: number;
  price_at_time: number;
  type: 'PRE_ORDER' | 'ADDITIONAL';
}

interface BookingDetails {
  _id: string;
  branch_id?: string;
  customer_id?: { _id: string; full_name: string; phone: string };
  walk_in_name?: string;
  walk_in_phone?: string;
  assigned_tables: { table_number: string }[];
  order_items?: OrderItem[];
  pre_order_total_amount?: number;
  total_deposit_paid?: number;
  applied_voucher_code?: string;
  voucher_discount_amount?: number;
  guest_count?: number;
}

interface CheckoutModalProps {
  booking: BookingDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ booking, onClose, onSuccess }: CheckoutModalProps) {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicVouchers, setPublicVouchers] = useState<any[]>([]);
  const [showVouchers, setShowVouchers] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(booking);

  const [customerVouchers, setCustomerVouchers] = useState<any[]>([]);

  useEffect(() => {
    setCurrentBooking(booking);
    setVoucherCodeInput(booking?.applied_voucher_code || '');
  }, [booking]);

  useEffect(() => {
    if (booking?.branch_id) {
      http.get<{ success: boolean; data: any[] }>(`/vouchers/public/branch/${booking.branch_id}`)
        .then(res => setPublicVouchers(res?.data || []))
        .catch(() => {});
    }
    
    const customerId = booking?.customer_id?._id || booking?.customer_id;
    if (customerId) {
      http.get<{ success: boolean; data: any[] }>(`/vouchers/wallet/${customerId}`)
        .then(res => setCustomerVouchers(res?.data?.filter((v: any) => v.status === 'UNUSED') || []))
        .catch(() => {});
    }
  }, [booking?.branch_id, booking?.customer_id]);

  if (!currentBooking) return null;

  const customerName = currentBooking.customer_id?.full_name || currentBooking.walk_in_name || 'Khách vãng lai';
  const tableNames = currentBooking.assigned_tables?.map(t => t.table_number).join(', ') || 'N/A';

  // Tính toán hóa đơn
  const items = currentBooking.order_items || [];
  const calculatedTotal = items.reduce((acc, item) => acc + (item.price_at_time * item.quantity), 0);
  const totalBill = calculatedTotal > 0 ? calculatedTotal : (currentBooking.pre_order_total_amount || 0);
  const depositPaid = currentBooking.total_deposit_paid || 0;
  
  // Fake calculation if we want to show it before checkout, but ideally backend returns this in currentBooking.voucher_discount_amount
  const voucherDiscount = currentBooking.voucher_discount_amount || 0;
  const amountToPay = Math.max(0, totalBill - depositPaid - voucherDiscount);

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setIsSubmitting(true);
    try {
      // Gọi API apply-voucher
      const res = await voucherService.applyVoucherToBooking(currentBooking._id, voucherCodeInput);
      if (res.success) {
        success('Áp dụng mã giảm giá thành công!');
        // Cập nhật local state với data trả về
        if (res.data) {
           setCurrentBooking(res.data);
           setShowVouchers(false);
        } else {
           // Nếu backend không trả về data, reload lại từ backend
           const reloadRes = await http.get<{ success: boolean; data: any }>(`/bookings/${currentBooking._id}`);
           if (reloadRes.success) setCurrentBooking(reloadRes.data);
        }
      } else {
        showError(res.message || 'Mã giảm giá không hợp lệ');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Có lỗi khi áp dụng mã giảm giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVoucher = async () => {
    setIsSubmitting(true);
    try {
      const res = await voucherService.applyVoucherToBooking(currentBooking._id, '');
      if (res.success) {
        success('Đã gỡ mã giảm giá');
        setVoucherCodeInput('');
        if (res.data) {
           setCurrentBooking(res.data);
        } else {
           const reloadRes = await http.get<{ success: boolean; data: any }>(`/bookings/${currentBooking._id}`);
           if (reloadRes.success) setCurrentBooking(reloadRes.data);
        }
      }
    } catch (err) {
      showError('Có lỗi khi gỡ mã giảm giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const res = await http.patch<{ success: boolean }>(`/reception/bookings/${currentBooking._id}/checkout`, {
        final_bill_amount: amountToPay
      });

      if (res.success) {
        success("Thanh toán thành công. Đã in hóa đơn và giải phóng bàn!");
        onSuccess();
      } else {
        throw new Error("Server error");
      }
    } catch (err) {
      showError("Lỗi khi thanh toán. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Chốt Hóa Đơn (Checkout)</h2>
              <p className="text-blue-100 text-sm">{customerName} - Bàn {tableNames}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Chi tiết gọi món</h3>
            
            {items.length === 0 ? (
              <p className="text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">Không có món ăn nào được lưu.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto pr-2 space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-700">{item.quantity}x</span>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.type === 'PRE_ORDER' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.type === 'PRE_ORDER' ? 'PRE-ORDER' : 'GỌI THÊM'}
                        </span>
                      </div>
                    </div>
                    <span className="font-medium text-gray-900">{(item.price_at_time * item.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Tag className="w-4 h-4" /> Mã giảm giá</span>
            </h3>
            
            {currentBooking.applied_voucher_code ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">{currentBooking.applied_voucher_code}</span>
                  {voucherDiscount > 0 && <span className="text-xs text-green-600">- Đã áp dụng (-{voucherDiscount.toLocaleString()}đ)</span>}
                </div>
                <button 
                  onClick={handleRemoveVoucher} 
                  disabled={isSubmitting}
                  className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã voucher (VD: VIP10)..."
                      className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 uppercase pr-8"
                    />
                    {publicVouchers.length > 0 && (
                      <button 
                        onClick={() => setShowVouchers(!showVouchers)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Chọn từ danh sách"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <Button 
                    onClick={handleApplyVoucher}
                    disabled={isSubmitting || !voucherCodeInput.trim()}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 whitespace-nowrap"
                  >
                    Áp dụng
                  </Button>
                </div>
                
                {/* Dropdown Vouchers public & customer */}
                {showVouchers && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
                    {customerVouchers.length > 0 && (
                      <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 text-xs font-bold text-blue-800">
                        Ví Voucher Của Khách Hàng
                      </div>
                    )}
                    {customerVouchers.map(v => (
                      <div 
                        key={v._id} 
                        className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          setVoucherCodeInput(v.voucher_id?.code);
                          setShowVouchers(false);
                        }}
                      >
                        <div>
                          <p className="font-bold text-sm text-gray-900">{v.voucher_id?.code}</p>
                          <p className="text-xs text-gray-500">{v.voucher_id?.name}</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {v.voucher_id?.discount_type === 'PERCENTAGE' ? `${v.voucher_id?.discount_value}%` : `${v.voucher_id?.discount_value?.toLocaleString()}đ`}
                        </span>
                      </div>
                    ))}

                    {publicVouchers.length > 0 && (
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600">
                        Voucher Chung Toàn Hệ Thống
                      </div>
                    )}
                    {publicVouchers.map(v => (
                      <div 
                        key={v._id} 
                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          setVoucherCodeInput(v.code);
                          setShowVouchers(false);
                        }}
                      >
                        <div>
                          <p className="font-bold text-sm text-gray-900">{v.code}</p>
                          <p className="text-xs text-gray-500">{v.name}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">
                          {v.discount_type === 'PERCENTAGE' ? `${v.discount_value}%` : `${v.discount_value.toLocaleString()}đ`}
                        </span>
                      </div>
                    ))}
                    
                    {customerVouchers.length === 0 && publicVouchers.length === 0 && (
                      <div className="p-3 text-center text-sm text-gray-500">
                        Không có voucher nào.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-gray-600 font-medium">Tổng tiền món:</span>
              <span className="font-bold text-gray-900">{totalBill.toLocaleString()}đ</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between items-center mb-3 text-sm text-green-700">
                <span className="font-medium">Khuyến mãi (Voucher):</span>
                <span className="font-bold">- {voucherDiscount.toLocaleString()}đ</span>
              </div>
            )}
            {depositPaid > 0 && (
              <div className="flex justify-between items-center mb-3 text-sm text-blue-700 border-b border-gray-200 pb-3">
                <span className="font-medium">Tiền cọc đã thu:</span>
                <span className="font-bold">- {depositPaid.toLocaleString()}đ</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-900 font-bold text-lg">Cần thanh toán:</span>
              <span className="font-bold text-2xl text-blue-700">{amountToPay.toLocaleString()}đ</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            onClick={handleCheckout}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đã Thanh Toán'}
          </Button>
        </div>
      </div>
    </div>
  );
}
