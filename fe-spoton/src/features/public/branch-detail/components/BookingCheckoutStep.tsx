"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { AlertCircle, Clock, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { PublicBranchDetail } from '../branch-detail.types';
import { PUBLIC_TEXTS } from '@/constants/texts/public';
import { branchDetailService } from '../branch-detail.service';
import { CheckoutReviewStep } from './CheckoutReviewStep';

const checkoutSchema = z.object({
  walk_in_name: z.string().min(2, PUBLIC_TEXTS.branchDetail.checkout.form.errors.nameMin).max(50, PUBLIC_TEXTS.branchDetail.checkout.form.errors.nameMax),
  walk_in_phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, PUBLIC_TEXTS.branchDetail.checkout.form.errors.phoneInvalid),
  note: z.string().max(200, PUBLIC_TEXTS.branchDetail.checkout.form.errors.noteMax).optional(),
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
  const [activeTab, setActiveTab] = useState<string>('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [tabOffset, setTabOffset] = useState(0);

  const [cart, setCart] = useState<Record<string, { item: any; quantity: number }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState<'menu' | 'review'>('menu');

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
        alert(PUBLIC_TEXTS.branchDetail.checkout.timer.timeoutAlert);
        onCancel();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onCancel]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      const data = await branchDetailService.getCategories(branch._id);
      if (data && data.length > 0) {
        // Đảm bảo tab Combo luôn nằm đầu tiên
        const sortedData = [...data].sort((a: any, b: any) => {
          const isACombo = a.category_name.toLowerCase().includes('combo');
          const isBCombo = b.category_name.toLowerCase().includes('combo');
          if (isACombo && !isBCombo) return -1;
          if (!isACombo && isBCombo) return 1;
          return 0;
        });
        
        setCategories(sortedData);
        const comboTab = sortedData.find((c: any) => c.category_name.toLowerCase().includes('combo'));
        setActiveTab(comboTab ? comboTab.category_name : sortedData[0].category_name);
      }
    };
    fetchCategories();
  }, [branch._id]);

  // Fetch Menu Items when activeTab or page changes
  useEffect(() => {
    if (!activeTab) return;
    const fetchItems = async () => {
      setIsLoadingMenu(true);
      const data = await branchDetailService.getMenuItems(branch._id, activeTab, currentPage, 6);
      if (data) {
        setMenuItems(data.items || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
      setIsLoadingMenu(false);
    };
    fetchItems();
  }, [branch._id, activeTab, currentPage]);

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
      alert(PUBLIC_TEXTS.branchDetail.checkout.timer.timeoutAlert);
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

      if (res.success) {
        setStep('review');
        // localStorage.removeItem('spoton_draft_booking'); // Chỉ xóa sau khi thanh toán xong
      } else {
        setErrorMsg(res.message || 'Có lỗi khi cập nhật thông tin.');
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Không thể cập nhật thông tin lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'review') {
    return (
      <CheckoutReviewStep 
        bookingId={bookingId} 
        onBack={() => setStep('menu')}
        onPaymentSuccess={(method) => {
          // This will be handled by redirect from VNPay/MoMo
          console.log('Redirecting to payment method:', method);
        }}
      />
    );
  }

  // Lấy ra danh sách các tab đang hiển thị (tối đa 3 để có không gian hiển thị tên dài)
  const visibleTabs = categories.slice(tabOffset, tabOffset + 3);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      {/* Sticky Timer Bar */}
      <div className="sticky top-4 z-50 bg-white border-2 border-[#ea580c] shadow-lg rounded-xl p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#ea580c] animate-pulse" />
          <div>
            <p className="text-sm text-gray-600 font-medium">{PUBLIC_TEXTS.branchDetail.checkout.timer.label}</p>
            <p className="text-2xl font-bold text-[#ea580c] font-mono">{formatTime(timeLeft)}</p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {PUBLIC_TEXTS.branchDetail.checkout.timer.cancelBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Menu */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-6">{PUBLIC_TEXTS.branchDetail.checkout.menu.title}</h3>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {categories.length > 0 ? (
              <>
                {/* Tabs Header */}
                <div className="flex items-center border-b border-gray-100 bg-gray-50 p-2">
                  <button 
                    disabled={tabOffset === 0}
                    onClick={() => setTabOffset(prev => Math.max(0, prev - 1))}
                    className="p-2 text-gray-500 hover:text-[#ea580c] disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  <div className="flex-1 flex gap-2 overflow-hidden justify-center">
                    {visibleTabs.map((cat: any, idx: number) => (
                      <button
                        key={cat._id || idx}
                        onClick={() => {
                          setActiveTab(cat.category_name);
                          setCurrentPage(1); // Reset trang khi đổi tab
                        }}
                        className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-colors whitespace-nowrap truncate max-w-[200px] flex-1 text-center ${
                          activeTab === cat.category_name 
                            ? 'bg-[#ea580c] text-white shadow-sm' 
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                        title={cat.category_name}
                      >
                        {cat.category_name}
                      </button>
                    ))}
                  </div>

                  <button 
                    disabled={tabOffset + 3 >= categories.length}
                    onClick={() => setTabOffset(prev => Math.min(categories.length - 3, prev + 1))}
                    className="p-2 text-gray-500 hover:text-[#ea580c] disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {isLoadingMenu ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]"></div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {menuItems.map((item: any, iIdx: number) => {
                          const isOutOfStock = !item.is_available || item.quantity === 0;
                          const inCart = cart[item._id]?.quantity || 0;
                          
                          return (
                            <div key={item._id || iIdx} className={`flex gap-4 p-3 rounded-xl border ${inCart > 0 ? 'border-[#ea580c] bg-orange-50' : 'border-gray-100 bg-white'} relative overflow-hidden transition-all ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : ''}`}>
                              {isOutOfStock && (
                                <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 uppercase">
                                  {PUBLIC_TEXTS.branchDetail.checkout.menu.outOfStock}
                                </div>
                              )}

                              <div className="w-20 h-20 rounded-lg bg-gray-100 relative overflow-hidden flex-shrink-0">
                                {item.image_url ? (
                                  <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ShoppingCart className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <h5 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name || PUBLIC_TEXTS.branchDetail.checkout.menu.noItemName}</h5>
                                  <span className="font-bold text-[#ea580c] text-sm">{item.price ? `${item.price.toLocaleString()}đ` : PUBLIC_TEXTS.branchDetail.checkout.menu.priceContact}</span>
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
                                        {PUBLIC_TEXTS.branchDetail.checkout.menu.addBtn}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {menuItems.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Không có món ăn trong danh mục này.</p>
                      )}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-gray-100">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            Trang trước
                          </button>
                          <span className="text-sm font-bold text-gray-700">Trang {currentPage} / {totalPages}</span>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            Trang sau
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500 italic bg-gray-50">
                Đang tải thực đơn hoặc chi nhánh chưa có thực đơn...
              </div>

            )}
          </div>
        </div>

        {/* Right Column: Form & Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-32">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#ea580c]" /> 
                {PUBLIC_TEXTS.branchDetail.checkout.cart.title}
              </h3>
            </div>
            
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-4">{PUBLIC_TEXTS.branchDetail.checkout.cart.empty}</p>
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
                <span className="font-medium text-orange-900">{PUBLIC_TEXTS.branchDetail.checkout.cart.total}</span>
                <span className="text-xl font-bold text-[#ea580c]">{cartTotal.toLocaleString()}đ</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
              <h4 className="font-bold text-gray-900 mb-2">{PUBLIC_TEXTS.branchDetail.checkout.form.title}</h4>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{PUBLIC_TEXTS.branchDetail.checkout.form.nameLabel} <span className="text-red-500">*</span></label>
                <input 
                  {...register('walk_in_name')}
                  type="text" 
                  className={`w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] ${errors.walk_in_name ? 'border-red-500' : ''}`}
                  placeholder={PUBLIC_TEXTS.branchDetail.checkout.form.namePlaceholder}
                />
                {errors.walk_in_name && <p className="text-red-500 text-xs mt-1">{errors.walk_in_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{PUBLIC_TEXTS.branchDetail.checkout.form.phoneLabel} <span className="text-red-500">*</span></label>
                <input 
                  {...register('walk_in_phone')}
                  type="tel" 
                  className={`w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] ${errors.walk_in_phone ? 'border-red-500' : ''}`}
                  placeholder={PUBLIC_TEXTS.branchDetail.checkout.form.phonePlaceholder}
                />
                {errors.walk_in_phone && <p className="text-red-500 text-xs mt-1">{errors.walk_in_phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{PUBLIC_TEXTS.branchDetail.checkout.form.noteLabel}</label>
                <textarea 
                  {...register('note')}
                  rows={2}
                  className={`w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] ${errors.note ? 'border-red-500' : ''}`}
                  placeholder={PUBLIC_TEXTS.branchDetail.checkout.form.notePlaceholder}
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
<<<<<<< HEAD
                {isSubmitting ? PUBLIC_TEXTS.branchDetail.checkout.form.submittingBtn : PUBLIC_TEXTS.branchDetail.checkout.form.submitBtn}
=======
                {isSubmitting ? 'Đang lưu...' : 'Tiếp tục thanh toán'}
>>>>>>> b60c22aebd993d07131dd1943172b0c08ecc29bb
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
