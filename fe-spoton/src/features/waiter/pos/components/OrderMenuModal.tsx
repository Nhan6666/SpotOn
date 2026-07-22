import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { posService } from '../pos.service';
import { useToast } from '@/components/ui/Toast';

import { Booking } from '../pos.types';

interface OrderMenuModalProps {
  booking?: Booking;
  tableNumber: string;
  branchId: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  status: string;
  quantity: number; // Available inventory
}

interface CartItem extends MenuItem {
  quantity: number;
}

export function OrderMenuModal({ booking, tableNumber, branchId, onClose, onSubmitSuccess }: OrderMenuModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  const bookingId = booking?._id || '';
  const existingOrders = booking?.order_items || [];
  const depositPaid = booking?.total_deposit_paid || 0;
  const existingFoodTotal = existingOrders.reduce((sum: number, item: any) => sum + ((item.price_at_time || item.price || 0) * item.quantity), 0);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await posService.getMenuItems(branchId);
        const fetchedData = Array.isArray(res) ? res : (res.data || []); // Array of { name: string, items: MenuItem[] }
        
        let allItems: MenuItem[] = [];
        let cats: string[] = [];

        fetchedData.forEach((catObj: any) => {
          cats.push(catObj.name);
          catObj.items.forEach((item: any) => {
            if (item.is_available !== false) {
              allItems.push({
                _id: item._id,
                name: item.name,
                price: item.price || 0,
                image: item.image || '',
                category: catObj.name,
                status: 'AVAILABLE',
                quantity: item.quantity !== undefined ? item.quantity : -1
              });
            }
          });
        });

        setMenuItems(allItems);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);
      } catch (err: any) {
        showError(`Lỗi tải Menu: ${err.message || 'Unknown'}`);
        console.error('Menu Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, [branchId, showError]);

  const addToCart = (item: MenuItem) => {
    if (item.quantity === 0) {
      return;
    }

    const existing = cart.find(i => i._id === item._id);
    if (existing && item.quantity !== -1 && existing.quantity >= item.quantity) {
      return;
    }

    setCart(prev => {
      const existingInPrev = prev.find(i => i._id === item._id);
      if (existingInPrev) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const menuItem = menuItems.find(i => i._id === itemId);
    const cartItem = cart.find(i => i._id === itemId);
    
    if (cartItem) {
      const newQ = cartItem.quantity + delta;
      if (delta > 0 && menuItem && menuItem.quantity !== -1 && newQ > menuItem.quantity) {
        return;
      }
    }

    setCart(prev => prev.map(i => {
      if (i._id === itemId) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const remainingBill = Math.max(0, existingFoodTotal + totalAmount - depositPaid);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const orderPayload = cart.map(item => ({
        menu_item_id: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      await posService.addAdditionalOrder(bookingId, orderPayload);
      success("Đã gửi order xuống bếp!");
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || "Lỗi khi gọi món.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm animate-in fade-in">
      {/* Left side: Menu */}
      <div className="flex-1 bg-gray-50 flex flex-col mt-4 ml-4 mb-4 rounded-l-2xl overflow-hidden relative shadow-2xl slide-in-from-left-8">
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="text-blue-600" />
            Gọi Món (Bàn {tableNumber})
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex overflow-x-auto p-3 gap-2 bg-white border-b border-gray-100 flex-shrink-0 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-20 text-gray-500">Đang tải Menu...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {menuItems.filter(i => i.category === activeCategory).map(item => {
                const inCart = cart.find(c => c._id === item._id)?.quantity || 0;
                return (
                <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-32 bg-gray-200 w-full relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="font-bold text-sm text-gray-900 line-clamp-2 flex-1">{item.name}</p>
                    {item.quantity !== -1 && (
                      <span className={`text-xs font-medium mt-1 ${item.quantity === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                        {item.quantity === 0 ? 'Hết hàng' : `Kho: ${Math.max(0, item.quantity - inCart)}`}
                      </span>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-blue-600 font-bold text-sm">{item.price.toLocaleString()}đ</span>
                      
                      {item.quantity === 0 ? (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Đã hết</span>
                      ) : (
                        <button 
                          onClick={() => addToCart(item)}
                          disabled={item.quantity !== -1 && inCart >= item.quantity}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-blue-50 disabled:hover:text-blue-600 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cart */}
      <div className="w-[400px] bg-white flex flex-col mt-4 mr-4 mb-4 rounded-r-2xl overflow-hidden shadow-2xl border-l border-gray-200 z-20">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Giỏ Hàng Bàn {tableNumber}
          </h2>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
            {cart.reduce((s, i) => s + i.quantity, 0)} Món
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* Section: MÓN ĐANG CHỌN */}
          <div>
            <h3 className="text-xs font-bold text-blue-600 mb-3 tracking-wider">MÓN ĐANG CHỌN</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4">Chưa chọn món nào</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item._id} className="flex gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100 relative">
                    <button 
                      onClick={() => updateQuantity(item._id, -item.quantity)}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex-1 flex flex-col justify-between">
                      <p className="font-bold text-gray-900 text-sm leading-tight pr-4">{item.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-blue-600 font-bold">{item.price.toLocaleString()}đ</span>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                          <button onClick={() => updateQuantity(item._id, -1)} className="text-gray-500 hover:text-blue-600">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, 1)} 
                            disabled={menuItems.find(i => i._id === item._id)?.quantity !== -1 && item.quantity >= (menuItems.find(i => i._id === item._id)?.quantity || 0)}
                            className="text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Section: MÓN ĐÃ GỌI */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-3 tracking-wider">MÓN ĐÃ GỌI</h3>
            {(!existingOrders || existingOrders.length === 0) ? (
              <p className="text-sm text-gray-400 italic text-center py-4">Chưa có món nào đã gọi</p>
            ) : (
              <div className="space-y-2">
                {existingOrders.map((eo, idx) => {
                  const PREP_STATUS_MAP: any = {
                    PENDING: 'Chờ chế biến',
                    PREPARING: 'Đang nấu',
                    READY: 'Đã xong',
                    SERVED: 'Đã lên món',
                    CANCELLED: 'Đã hủy'
                  };
                  return (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${eo.prep_status === 'SERVED' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{eo.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            eo.prep_status === 'READY' ? 'text-emerald-600 bg-emerald-50' :
                            eo.prep_status === 'PREPARING' ? 'text-blue-600 bg-blue-50' :
                            eo.prep_status === 'SERVED' ? 'text-gray-500 bg-gray-200' :
                            'text-amber-600 bg-amber-50'
                          }`}>
                            {PREP_STATUS_MAP[eo.prep_status] || eo.prep_status}
                          </span>
                          {eo.type === 'PRE_ORDER' && (
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase">ĐẶT TRƯỚC</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-bold text-sm text-gray-600 mb-1">x{eo.quantity}</span>
                        <span className="font-bold text-sm text-gray-900">{((eo.price_at_time || eo.price || 0) * eo.quantity).toLocaleString()}đ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] text-sm space-y-2">
          {existingFoodTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Món đã gọi trước đó:</span>
              <span className="font-medium text-gray-900">{existingFoodTotal.toLocaleString()}đ</span>
            </div>
          )}
          
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-900 uppercase">Tổng tiền món:</span>
            <span className="text-gray-900 text-lg">{(existingFoodTotal + totalAmount).toLocaleString()}đ</span>
          </div>

          {depositPaid > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>Đã cọc:</span>
              <span className="font-medium">-{depositPaid.toLocaleString()}đ</span>
            </div>
          )}

          <div className="flex justify-between items-end pt-3 border-t border-gray-200 mt-2 mb-6">
            <span className="text-gray-900 font-bold text-lg uppercase">Còn lại:</span>
            <span className="text-3xl font-black text-red-600">{remainingBill.toLocaleString()}đ</span>
          </div>
          <Button 
            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20"
            disabled={cart.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi Order Xuống Bếp'}
          </Button>
        </div>
      </div>
    </div>
  );
}
