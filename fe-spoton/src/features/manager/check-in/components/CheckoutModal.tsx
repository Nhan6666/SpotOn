import React, { useState } from 'react';
import { X, Receipt, CreditCard, Banknote, Coffee, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';

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
}

interface CheckoutModalProps {
  booking: BookingDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ booking, onClose, onSuccess }: CheckoutModalProps) {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking) return null;

  const customerName = booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai';
  const tableNames = booking.assigned_tables?.map(t => t.table_number).join(', ') || 'N/A';

  // Tính toán hóa đơn
  const items = booking.order_items || [];
  
  // Tính tổng tiền dựa trên order_items nếu có, nếu không thì dùng field có sẵn
  const calculatedTotal = items.reduce((acc, item) => acc + (item.price_at_time * item.quantity), 0);
  
  // Tổng bill thực tế (có thể fallback về pre_order_total_amount nếu không có items)
  const totalBill = calculatedTotal > 0 ? calculatedTotal : (booking.pre_order_total_amount || 0);
  const depositPaid = booking.total_deposit_paid || 0;
  const amountToPay = Math.max(0, totalBill - depositPaid);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const res = await http.patch<{ success: boolean }>(`/reception/bookings/${booking._id}/checkout`, {
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
        <div className="p-6">
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

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-gray-600 font-medium">Tổng tiền hóa đơn:</span>
              <span className="font-bold text-gray-900">{totalBill.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center mb-3 text-sm text-green-700 border-b border-gray-200 pb-3">
              <span className="font-medium">Tiền cọc đã thu:</span>
              <span className="font-bold">- {depositPaid.toLocaleString()}đ</span>
            </div>
            
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
