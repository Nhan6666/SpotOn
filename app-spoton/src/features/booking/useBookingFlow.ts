import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBookingCartStore } from '@/stores/useBookingCartStore';
import { BookingService } from './booking.service';
import { CustomerService } from '../customer/customer.service';
import { MenuItem } from '@/types/menu.types';
import { Branch, Zone, Table } from '@/types/branch.types';

export function useBookingFlow(branchId: string) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { preselectedItems, clearPreselectedItems } = useBookingCartStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO'>('VNPAY');
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900); // 15 mins
  const [holdTimeLeft, setHoldTimeLeft] = useState(600); // 10 mins

  const [branch, setBranch] = useState<Branch | null>(null);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [holdingBookingId, setHoldingBookingId] = useState<string | null>(null);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);

  const allMenuItems = useMemo(() => {
    return menuCategories.flatMap((category: any) => 
      (category.items || []).filter((item: MenuItem) => item.is_available !== false)
    );
  }, [menuCategories]);

  // Step 1: Date/Time/Guests
  const [guests, setGuests] = useState(2);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(-1);
  const [note, setNote] = useState('');

  // Step 2: Table selection
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(0);
  const [bookedTableIds, setBookedTableIds] = useState<string[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);

  // Step 3: Pre-order
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [canPreOrder, setCanPreOrder] = useState(true);

  useEffect(() => {
    fetchInitData();
  }, [branchId]);

  useEffect(() => {
    if (allMenuItems.length > 0 && preselectedItems.length > 0) {
      let changed = false;
      const itemsToAdd: {item: MenuItem, quantity: number}[] = [];
      
      preselectedItems.forEach(pre => {
        const item = allMenuItems.find(i => i._id === pre.item_id);
        if (item) {
          itemsToAdd.push({ item, quantity: pre.quantity });
          changed = true;
        }
      });

      if (changed) {
        setCart(prevCart => {
          let newCart = [...prevCart];
          itemsToAdd.forEach(newItem => {
            if (!newCart.find(c => c.item._id === newItem.item._id)) {
              newCart.push(newItem);
            }
          });
          return newCart;
        });
        clearPreselectedItems();
      }
    }
  }, [allMenuItems, preselectedItems, clearPreselectedItems]);

  useEffect(() => {
    let timer: any;
    if (step === 5 && paymentTimeLeft > 0) {
      timer = setInterval(() => {
        setPaymentTimeLeft(p => p - 1);
      }, 1000);
    } else if (step === 5 && paymentTimeLeft <= 0) {
      Alert.alert('Hết giờ', 'Đã hết thời gian giữ bàn để thanh toán. Vui lòng đặt lại từ đầu.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    return () => clearInterval(timer);
  }, [step, paymentTimeLeft]);

  useEffect(() => {
    let timer: any;
    if ((step === 3 || step === 4) && holdTimeLeft > 0) {
      timer = setInterval(() => {
        setHoldTimeLeft(p => p - 1);
      }, 1000);
    } else if ((step === 3 || step === 4) && holdTimeLeft <= 0) {
      Alert.alert('Hết giờ', 'Thời gian giữ bàn đã hết. Vui lòng thử lại.', [
        { text: 'OK', onPress: () => {
          BookingService.releaseHold(holdingBookingId || '');
          router.back();
        }}
      ]);
    }
    return () => clearInterval(timer);
  }, [step, holdTimeLeft, holdingBookingId]);

  const fetchInitData = async () => {
    try {
      const branchRes = await CustomerService.getBranchById(branchId);
      if (branchRes.success) {
        setBranch(branchRes.data);
        setZones(branchRes.data.zones || []);
      }
      try {
        const menuRes = await CustomerService.getPublicMenu(branchId);
        if (menuRes.success) {
          setMenuCategories(menuRes.data || []);
        }
      } catch {}
      
      if (isAuthenticated) {
        try {
          const walletRes = await CustomerService.getMyWallet();
          if (walletRes.success) {
            setMyVouchers(walletRes.data || []);
          }
        } catch {}
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu chi nhánh');
      router.back();
    } finally {
      setInitLoading(false);
    }
  };

  const dateOptions = useMemo(() => {
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        label: i === 0 ? 'Hôm nay' : `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
        value: d.toISOString().split('T')[0],
        date: d,
      });
    }
    return days;
  }, []);

  const timeOptions = useMemo(() => {
    const openTime = branch?.open_time || '09:00';
    const closeTime = branch?.close_time || '22:00';
    const [oh, om] = openTime.split(':').map(Number);
    const [ch, cm] = closeTime.split(':').map(Number);
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    
    const slots = [];
    const selectedDate = dateOptions[selectedDateIdx]?.value;
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
    
    for (let m = openMin; m <= closeMin - 60; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const isPast = isToday && m <= nowMin + 30;
      slots.push({ label: timeStr, value: timeStr, disabled: isPast });
    }
    return slots;
  }, [branch, selectedDateIdx, dateOptions]);

  const selectedDate = dateOptions[selectedDateIdx]?.value || '';
  const selectedTime = selectedTimeIdx >= 0 ? timeOptions[selectedTimeIdx]?.value || '' : '';

  const validateStep1 = () => {
    if (!selectedDate) { Alert.alert('Lỗi', 'Vui lòng chọn ngày'); return false; }
    if (!selectedTime) { Alert.alert('Lỗi', 'Vui lòng chọn giờ'); return false; }
    if (guests < 1 || guests > 20) { Alert.alert('Lỗi', 'Số khách từ 1 đến 20'); return false; }

    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    if (isToday) {
      const [h, m] = selectedTime.split(':').map(Number);
      const selectedMin = h * 60 + m;
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      setCanPreOrder(selectedMin - nowMin >= 120);
    } else {
      setCanPreOrder(true);
    }
    return true;
  };

  const checkAvailabilityAndContinue = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const res = await BookingService.checkAvailability(branchId, selectedDate, selectedTime);
      if (res.success) {
        setBookedTableIds(res.data.booked_table_ids || []);
        setStep(2);
      }
    } catch {
      setBookedTableIds([]);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleTableToggle = (tableId: string) => {
    setSelectedTableIds(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const validateStep2 = () => {
    if (selectedTableIds.length === 0) {
      Alert.alert('Chưa chọn bàn', 'Vui lòng chọn ít nhất một bàn');
      return false;
    }
    const allTables = zones.flatMap((z: any) => z.tables || []);
    const selected = allTables.filter((t: any) => selectedTableIds.includes(t._id));
    const cap = selected.reduce((s: number, t: any) => s + (t.capacity || 0), 0);
    if (guests > cap) {
      Alert.alert('Quá sức chứa', `Bàn chọn chứa tối đa ${cap} khách, bạn có ${guests} khách`);
      return false;
    }
    return true;
  };

  const handleHoldAndContinue = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const res = await BookingService.holdBooking({
        branch_id: branchId, date: selectedDate, time: selectedTime,
        table_ids: selectedTableIds, guest_count: guests,
      });
      if (res.success) {
        setHoldingBookingId(res.data._id);
        
        // Cập nhật timer nếu có expires_at từ server
        if (res.data.expires_at) {
          const diffSeconds = Math.floor((new Date(res.data.expires_at).getTime() - Date.now()) / 1000);
          setHoldTimeLeft(diffSeconds > 0 ? diffSeconds : 600);
        } else {
          setHoldTimeLeft(600);
        }

        setStep(3);
        setLoading(false);
        return;
      }
    } catch {}
    setStep(3);
    setLoading(false);
  };

  const handleAddToCart = (item: MenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.item._id === item._id);
      if (existing) {
        const q = existing.quantity + delta;
        if (q <= 0) return prev.filter(i => i.item._id !== item._id);
        return prev.map(i => i.item._id === item._id ? { ...i, quantity: q } : i);
      }
      if (delta > 0) return [...prev, { item, quantity: 1 }];
      return prev;
    });
  };

  const cancelHoldAndExit = () => {
    Alert.alert(
      'Hủy đặt bàn',
      'Bạn có chắc chắn muốn hủy giữ bàn và thoát không?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          style: 'destructive',
          onPress: async () => {
            if (holdingBookingId) {
              setLoading(true);
              try {
                await BookingService.releaseHold(holdingBookingId);
              } catch (error) {
                console.log('Error releasing hold', error);
              } finally {
                setLoading(false);
                setHoldingBookingId(null);
                setStep(1);
                router.back();
              }
            } else {
              router.back();
            }
          }
        }
      ]
    );
  };

  const getPreOrderTotal = () => cart.reduce((t, i) => t + (i.item.price * i.quantity), 0);

  // State for Payment (Step 5)
  const [voucherCode, setVoucherCode] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const calculateDepositInfo = async (bId: string, vCode: string = '') => {
    try {
      const res = await BookingService.calculateDeposit(bId, vCode);
      if (res.success) {
        setPaymentDetails(res.data);
      }
    } catch (error) {
      // ignore or alert
    }
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
       Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để tiếp tục đặt bàn. Thông tin của bạn sẽ được dùng để xác nhận đơn.", [
         { text: "Hủy", style: "cancel" },
         { text: "Đăng nhập", onPress: () => router.push('/(auth)/login') }
       ]);
       return;
    }

    setLoading(true);
    try {
      let bId = holdingBookingId;
      
      if (holdingBookingId) {
        if (cart.length > 0 || note) {
          await BookingService.updateBookingInfo(holdingBookingId, {
            order_items: cart.map(i => ({
              menu_item_id: i.item._id, name: i.item.name,
              quantity: i.quantity, price_at_time: i.item.price, type: 'PRE_ORDER' as const,
            })),
            note: note || undefined,
          });
        }
      } else {
        const payload: any = {
          branch_id: branchId, reservation_date: selectedDate, arrival_time: selectedTime,
          guest_count: guests, note,
          table_ids: selectedTableIds,
        };
        if (cart.length > 0) {
          payload.order_items = cart.map((i: any) => ({
            menu_item_id: i.item._id, name: i.item.name,
            quantity: i.quantity, price_at_time: i.item.price, type: 'PRE_ORDER',
          }));
        }
        const data = await BookingService.createBooking(payload);
        if (data.success) {
          bId = data.data._id;
          setHoldingBookingId(bId);
        } else {
          Alert.alert('Lỗi', data.message || 'Đặt bàn thất bại');
          setLoading(false);
          return;
        }
      }
      
      if (bId) {
        // Just calculate deposit and move to step 5
        await calculateDepositInfo(bId, voucherCode);
        setStep(5);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xác nhận đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!holdingBookingId) return;
    setLoading(true);
    try {
      const res = await BookingService.calculateDeposit(holdingBookingId, voucherCode);
      if (res.success) {
        setPaymentDetails(res.data);
        if (voucherCode && res.data.applied_voucher) {
          Alert.alert('Thành công', 'Đã áp dụng mã giảm giá!');
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setVoucherCode('');
      await calculateDepositInfo(holdingBookingId, ''); // reset
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!holdingBookingId) return;
    setLoading(true);
    try {
      if (paymentMethod === 'MOCK') {
        const mockData = await BookingService.mockConfirmPayment(holdingBookingId);
        if (mockData.success) {
          setLoading(false);
          Alert.alert('Thành công', 'Thanh toán giả lập thành công!');
          router.replace('/(tabs)/bookings');
        } else {
          Alert.alert('Lỗi', 'Không thể thanh toán giả lập.');
          setLoading(false);
        }
        return;
      }

      const paymentData = await BookingService.createPayment(holdingBookingId, paymentMethod as any, voucherCode);
      if (paymentData.success) {
        setLoading(false); // Stop loading before opening browser
        const WebBrowser = await import('expo-web-browser');
        await WebBrowser.openBrowserAsync(paymentData.data.payment_url);
        // After they close the in-app browser, redirect to bookings
        router.replace('/(tabs)/bookings');
      } else {
        Alert.alert('Lỗi', 'Không thể tạo thanh toán.');
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thanh toán');
      setLoading(false);
    }
  };

  return {
    state: {
      step, initLoading, loading, branch, zones, guests, note, cart, canPreOrder,
      selectedDateIdx, selectedTimeIdx, selectedZoneIdx, selectedTableIds, bookedTableIds,
      dateOptions, timeOptions, selectedDate, selectedTime, allMenuItems, menuCategories,
      isAuthenticated, user, depositAmount, paymentMethod, paymentTimeLeft, holdTimeLeft,
      voucherCode, paymentDetails, myVouchers
    },
    actions: {
      setStep, setGuests, setNote, setSelectedDateIdx, setSelectedTimeIdx, setSelectedZoneIdx,
      setPaymentMethod, handleTableToggle, handleAddToCart, getPreOrderTotal,
      checkAvailabilityAndContinue, handleHoldAndContinue, cancelHoldAndExit,
      handleConfirmBooking, handleProcessPayment, handleApplyVoucher,
      setVoucherCode,
      router
    }
  };
}
