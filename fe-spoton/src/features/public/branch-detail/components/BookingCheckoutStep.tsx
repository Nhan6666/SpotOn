"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { AlertCircle, Clock, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { PublicBranchDetail } from '../branch-detail.types';
import { branchDetailService } from '../branch-detail.service';

const checkoutSchema = z.object({
  walk_in_name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên không được quá 50 ký tự'),
  walk_in_phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  note: z.string().max(200, 'Ghi chú không được quá 200 ký tự').optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface Props {
  branch: PublicBranchDetail;
  bookingId: string;
  expiresAt: string;
  onCancel: () => void;
}

export function BookingCheckoutStep({ branch, bookingId, expiresAt, onCancel }: Props) {
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, { item: any; quantity: number }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  // Countdown Timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - new Date().getTime();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        alert('Đã hết thời gian giữ bàn. Vui lòng chọn lại bàn từ đầu.');
        onCancel();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onCancel]);

  // Fetch Menu
  useEffect(() => {
    const fetchMenu = async () => {
      const data = await branchDetailService.getMenu(branch._id);
      if (data) setCategories(data);
    };
    fetchMenu();
  }, [branch._id]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev[item._id];
      return {
        ...prev,
        [item._id]: {
          item,
          quantity: (existing?.quantity || 0) + 1
        }
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId].quantity > 1) {
        next[itemId].quantity -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const removeLineItem = (itemId: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, { item, quantity }) => sum + (item.price * quantity), 0);

  const onSubmit = async (data: CheckoutFormData) => {
    if (timeLeft <= 0) {
      alert('Đã hết thời gian giữ bàn. Vui lòng thực hiện lại.');
      onCancel();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const order_items = cartItems.map(({ item, quantity }) => ({
      menu_item_id: item._id,
      name: item.name,
      quantity,
      price_at_time: item.price
    }));

    try {
      const res = await branchDetailService.updateBookingInfo(bookingId, {
        walk_in_name: data.walk_in_name,
        walk_in_phone: data.walk_in_phone,
        note: data.note,
        order_items: order_items.length > 0 ? order_items : undefined,
      });

      if (res.data?.success) {
        setSuccess(true);
        localStorage.removeItem('spoton_draft_booking');
      } else {
        setErrorMsg(res.data?.message || 'Có lỗi khi cập nhật thông tin.');
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Không thể cập nhật thông tin lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-12 text-center animate-in fade-in slide-in-from-bottom-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Đặt bàn thành công!</h3>
        <p className="text-gray-600 mb-6">Cảm ơn bạn. Thông tin đặt bàn và món ăn đã được ghi nhận.</p>
        <button 
          onClick={onCancel}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          Trở về Trang chủ chi nhánh
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      {/* Sticky Timer Bar */}
      <div className="sticky top-4 z-50 bg-white border-2 border-[#ea580c] shadow-lg rounded-xl p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#ea580c] animate-pulse" />
          <div>
            <p className="text-sm text-gray-600 font-medium">Thời gian giữ bàn còn lại</p>
            <p className="text-2xl font-bold text-[#ea580c] font-mono">{formatTime(timeLeft)}</p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Hủy đặt bàn
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Menu */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Chọn món trước (Không bắt buộc)</h3>
          
          <div className="space-y-8">
            {categories.map((cat: any, idx: number) => (
              <div key={cat._id || idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-amber-500 inline-block">
                  {cat.name || 'Danh mục món'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(cat.items || []).map((item: any, iIdx: number) => {
                    const isOutOfStock = !item.is_available || item.quantity === 0;
                    const inCart = cart[item._id]?.quantity || 0;
                    
                    return (
                      <div key={item._id || iIdx} className={`flex gap-4 p-3 rounded-xl border ${inCart > 0 ? 'border-[#ea580c] bg-orange-50' : 'border-gray-100 bg-white'} relative overflow-hidden transition-all ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : ''}`}>
                        
                        {isOutOfStock && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 uppercase">
                            Đã Hết
                          </div>
                        )}

                        <div className="w-20 h-20 rounded-lg bg-gray-100 relative overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name || 'Tên món'}</h5>
                            <span className="font-bold text-[#ea580c] text-sm">{item.price ? `${item.price.toLocaleString()}đ` : 'Liên hệ'}</span>
                          </div>
                          
                          {!isOutOfStock && (
                            <div className="flex items-center gap-2 mt-2">
                              {inCart > 0 ? (
                                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1 w-full justify-between">
                                  <button onClick={() => removeFromCart(item._id)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700">-</button>
                                  <span className="font-bold text-sm">{inCart}</span>
                                  <button onClick={() => addToCart(item)} className="w-6 h-6 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white flex items-center justify-center font-bold">+</button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="w-full py-1.5 bg-gray-100 hover:bg-[#ea580c] hover:text-white text-gray-700 text-xs font-bold rounded-lg transition-colors"
                                >
                                  Thêm món
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {categories.length === 0 && (
              <p className="text-gray-500 italic p-6 bg-gray-50 rounded-xl">Đang tải thực đơn hoặc chi nhánh chưa có thực đơn...</p>
            )}
          </div>
        </div>

        {/* Right Column: Form & Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-32">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#ea580c]" /> 
                Giỏ hàng của bạn
              </h3>
            </div>
            
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-4">Bạn chưa chọn món nào.</p>
              ) : (
                <div className="space-y-3">
                  {cartItems.map(({ item, quantity }) => (
                    <div key={item._id} className="flex justify-between items-start gap-2 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                        <p className="text-gray-500">{item.price.toLocaleString()}đ x {quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#ea580c]">{(item.price * quantity).toLocaleString()}đ</p>
                        <button onClick={() => removeLineItem(item._id)} className="text-red-400 hover:text-red-600 mt-1">
                          <Trash2 className="w-4 h-4 inline-block" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 bg-orange-50 border-t border-orange-100 flex justify-between items-center">
                <span className="font-medium text-orange-900">Tổng tiền món:</span>
                <span className="text-xl font-bold text-[#ea580c]">{cartTotal.toLocaleString()}đ</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
              <h4 className="font-bold text-gray-900 mb-2">Thông tin liên hệ</h4>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Họ tên người đặt <span className="text-red-500">*</span></label>
                <input 
                  {...register('walk_in_name')}
                  type="text" 
                  className={`w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] ${errors.walk_in_name ? 'border-red-500' : ''}`}
                  placeholder="Nhập tên của bạn"
                />
                {errors.walk_in_name && <p className="text-red-500 text-xs mt-1">{errors.walk_in_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                <input 
                  {...register('walk_in_phone')}
                  type="tel" 
                  className={`w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] ${errors.walk_in_phone ? 'border-red-500' : ''}`}
                  placeholder="Ví dụ: 0912345678"
                />
                {errors.walk_in_phone && <p className="text-red-500 text-xs mt-1">{errors.walk_in_phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
                <textarea 
                  {...register('note')}
                  rows={2}
                  className={`w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] ${errors.note ? 'border-red-500' : ''}`}
                  placeholder="Ghi chú thêm..."
                />
                {errors.note && <p className="text-red-500 text-xs mt-1">{errors.note.message}</p>}
              </div>

              {errorMsg && (
                <div className="p-2 bg-red-50 text-red-600 rounded text-xs border border-red-100 flex items-start gap-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Hoàn Tất Đặt Bàn'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
