"use client";

import React, { useState, useEffect } from 'react';
import { ipadService } from './ipad.service';
import { useToast } from '@/components/ui/Toast';
import { Lock, UtensilsCrossed, Plus, Minus, Send, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PREP_STATUS_MAP: Record<string, string> = {
  PENDING: 'ĐANG CHUẨN BỊ',
  COMPLETED: 'NẤU XONG',
  SERVED: 'ĐÃ LÊN MÓN',
  CANCELLED: 'ĐÃ HỦY'
};

interface IpadFeatureProps {
  tableId: string;
}

export function IpadFeature({ tableId }: IpadFeatureProps) {
  const { success, error: showError } = useToast();
  
  // State: Authentication
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [token, setToken] = useState('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // State: Menu & Cart
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  
  const [cart, setCart] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Unlock Handler
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      showError("Mã PIN phải gồm 4 chữ số");
      return;
    }

    try {
      setIsUnlocking(true);
      const res = await ipadService.unlockIpad(tableId, pin);
      setToken(res.token);
      setSessionData(res.data);
      setIsUnlocked(true);
      success("Mở khóa thành công! Mời quý khách gọi món.");
      fetchMenu(res.token); 
    } catch (err: any) {
      showError(err.response?.data?.message || "Lỗi mở khóa");
    } finally {
      setIsUnlocking(false);
    }
  };

  // Wait, I need branch_id to fetch menu! Let's modify the service or fetch using branch_id.
  // We can get branch_id from the token (decode it), or the backend could return branch_id in `data`.
  
  // We will assume `res.data` has `branch_name`, but I need to make sure the backend returns `branch_id`.
  // Let me quickly check bookingController.js unlockIpad `res.data`. I returned `booking_id`, `branch_name`, `customer_name`.
  // I should use jwt-decode to get `branch_id`, or just fetch menu via a different way.
  // Wait, I can decode the JWT right here!
  
  const fetchMenu = async (tokenValue: string) => {
    try {
      const payload = JSON.parse(atob(tokenValue.split('.')[1]));
      const branchId = payload.branch_id;
      
      const catsData = await ipadService.getCategories(branchId) || [];
      const catNames = catsData.map((c: any) => c.category_name);
      
      setCategories(catNames);
      if (catNames.length > 0) {
        setActiveCategory(catNames[0]);
      }
    } catch (err) {
      showError("Không thể tải thực đơn");
    }
  };

  const loadItems = async (cat: string, p: number) => {
    try {
      setIsLoadingMenu(true);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const branchId = payload.branch_id;
      
      const res = await ipadService.getItems(branchId, cat, p);
      if (p === 1) {
        setMenuItems(res.items);
      } else {
        setMenuItems(prev => [...prev, ...res.items]);
      }
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      showError("Lỗi khi tải món ăn");
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    if (activeCategory && token) {
      loadItems(activeCategory, page);
    }
  }, [activeCategory, page, token]);

  useEffect(() => {
    if (isUnlocked && token && sessionData) {
      fetchMenu(token);

      // Lắng nghe sự kiện nhả bàn (checkout)
      const { socket } = require('@/lib/socket');
      socket.connect();
      socket.emit('join_branch_room', sessionData.branch_id);

      const handleTableStatus = (data: any) => {
        if (data.action === 'EMPTY' && data.table_ids?.includes(tableId)) {
          // Reset iPad
          setIsUnlocked(false);
          setToken('');
          setSessionData(null);
          setCart([]);
          setPin('');
          success("Bàn đã được thanh toán. Xin cảm ơn quý khách!");
        }
      };

      socket.on('table_status_changed', handleTableStatus);

      return () => {
        socket.off('table_status_changed', handleTableStatus);
      };
    }
  }, [isUnlocked, token, sessionData]);

  const addToCart = (item: any) => {
    if (!item.is_available || item.quantity === 0) {
      showError(`Món ${item.name} hiện đang tạm hết!`);
      return;
    }
    
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      if (item.quantity !== -1 && existing.quantity >= item.quantity) {
        showError(`Chỉ còn ${item.quantity} phần cho món này!`);
        return;
      }
      setCart(cart.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    const existing = cart.find(c => c._id === id);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(c => c._id === id ? { ...c, quantity: c.quantity - 1 } : c));
    } else {
      setCart(cart.filter(c => c._id !== id));
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    try {
      setIsSubmitting(true);
      const payload = cart.map(item => ({
        menu_item_id: item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      await ipadService.placeOrder(sessionData.booking_id, payload, token);
      success("Đã gửi order xuống Bếp thành công!");
      
      // Cập nhật lại sessionData để hiển thị ngay Món Đã Gọi mà không cần tải lại trang
      setSessionData((prev: any) => ({
        ...prev,
        order_items: [...(prev.order_items || []), ...payload.map(i => ({ ...i, price_at_time: i.price, prep_status: 'PENDING' }))]
      }));
      setCart([]);
    } catch (err: any) {
      showError(err.response?.data?.message || "Lỗi khi gọi món");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SpotOn E-Menu</h1>
          <p className="text-gray-500 mb-8">Bàn này đã được thiết lập. Quý khách vui lòng yêu cầu nhân viên mở khóa iPad để gọi món.</p>
          
          <form onSubmit={handleUnlock} className="space-y-6">
            <input 
              type="password" 
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center text-4xl tracking-[1em] font-bold py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            />
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700"
              disabled={isUnlocking || pin.length !== 4}
            >
              {isUnlocking ? 'Đang mở khóa...' : 'Mở Khóa Bàn'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const previousTotal = sessionData?.order_items?.reduce((sum: number, item: any) => sum + ((item.price_at_time || item.price || 0) * item.quantity), 0) || 0;
  const currentCartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalBill = previousTotal + currentCartTotal;
  const deposit = sessionData?.total_deposit_paid || 0;
  const remaining = Math.max(0, totalBill - deposit);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row overflow-hidden">
      {/* Main Menu Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kính chào {sessionData?.customer_name}</h1>
            <p className="text-gray-500">{sessionData?.branch_name}</p>
          </div>
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Gọi nhân viên
          </Button>
        </header>

        {/* Categories */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-3 overflow-x-auto hide-scrollbar z-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
                setMenuItems([]);
              }}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
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
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems.map(item => (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {item.image_url || item.image ? (
                    <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">No Image</div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{item.name}</h3>
                  <div className="flex-1"></div>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-blue-600 font-bold text-xl">{item.price.toLocaleString()}đ</span>
                    {(item.is_available && item.quantity !== 0) ? (
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-blue-50 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <span className="text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg text-sm border border-red-100">
                        Tạm hết
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {isLoadingMenu && (
            <div className="py-8 text-center text-gray-500 font-medium animate-pulse">
              Đang tải thêm...
            </div>
          )}

          {(!isLoadingMenu && page < totalPages) && (
            <div className="py-8 text-center">
              <Button 
                variant="outline"
                className="rounded-full px-8 bg-white"
                onClick={() => setPage(p => p + 1)}
              >
                Xem thêm món {activeCategory}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-screen shadow-xl z-20">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Giỏ Hàng Của Bạn
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
                      onClick={() => setCart(cart.filter(c => c._id !== item._id))}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <p className="font-bold text-gray-900 text-sm leading-tight pr-4">{item.name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-blue-600 font-bold">{item.price.toLocaleString()}đ</span>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                          <button onClick={() => removeFromCart(item._id)} className="text-gray-500 hover:text-blue-600">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="text-gray-500 hover:text-blue-600">
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
            {(!sessionData?.order_items || sessionData.order_items.length === 0) ? (
              <p className="text-sm text-gray-400 italic text-center py-4">Chưa có món nào đã gọi</p>
            ) : (
              <div className="space-y-2">
                {sessionData.order_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                          {PREP_STATUS_MAP[item.prep_status || 'SERVED'] || item.prep_status || 'ĐÃ LÊN MÓN'}
                        </span>
                        {item.type === 'PRE_ORDER' && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase">ĐẶT TRƯỚC</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-sm text-gray-600 mb-1">x{item.quantity}</span>
                      <span className="font-bold text-sm text-gray-900">{((item.price_at_time || item.price || 0) * item.quantity).toLocaleString()}đ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] text-sm space-y-2">
          {previousTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Món đã gọi trước đó:</span>
              <span className="font-medium text-gray-900">{previousTotal.toLocaleString()}đ</span>
            </div>
          )}
          
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-900 uppercase">Tổng tiền món:</span>
            <span className="text-gray-900 text-lg">{totalBill.toLocaleString()}đ</span>
          </div>

          {deposit > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>Đã cọc:</span>
              <span className="font-medium">-{deposit.toLocaleString()}đ</span>
            </div>
          )}

          <div className="flex justify-between items-end pt-3 border-t border-gray-200 mt-2 mb-6">
            <span className="text-gray-900 font-bold text-lg uppercase">Còn lại:</span>
            <span className="text-3xl font-black text-red-600">{remaining.toLocaleString()}đ</span>
          </div>
          <Button 
            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 gap-2"
            disabled={cart.length === 0 || isSubmitting}
            onClick={handleSubmitOrder}
          >
            {isSubmitting ? 'Đang gửi...' : (
              <>Gửi Order Xuống Bếp <Send className="w-5 h-5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
