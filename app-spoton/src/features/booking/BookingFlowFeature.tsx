import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useBookingCartStore } from '@/hooks/useBookingCartStore';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BookingService } from './booking.service';
import { CustomerService } from '../customer/customer.service';

interface BookingFlowProps {
  id: string; // branch_id
}

const TABLE_STATUS = {
  EMPTY:    { bg: 'bg-gray-100',   text: 'text-gray-600',  label: 'Trống' },
  HOLDING:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Đang giữ' },
  LOCKED:   { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Đã khóa' },
  RESERVED: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Đã đặt' },
  OCCUPIED: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Đang dùng' },
  CLEANING: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Đang dọn' },
} as Record<string, { bg: string; text: string; label: string }>;

export function BookingFlowFeature({ id }: BookingFlowProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { preselectedItems, clearPreselectedItems } = useBookingCartStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO'>('VNPAY');
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(900); // 15 mins
  
  const [branch, setBranch] = useState<any>(null);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);

  const allMenuItems = useMemo(() => {
    return menuCategories.flatMap((category: any) => 
      (category.items || []).filter((item: any) => item.is_available !== false)
    );
  }, [menuCategories]);
  
  // Step 1: Date/Time/Guests
  const [guests, setGuests] = useState(2);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(-1);
  const [note, setNote] = useState('');
  
  // Step 2: Table selection
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(0);
  const [bookedTableIds, setBookedTableIds] = useState<string[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  
  // Step 3: Pre-order
  const [cart, setCart] = useState<{item: any, quantity: number}[]>([]);
  const [canPreOrder, setCanPreOrder] = useState(true);
  
  // Sync preselected items from home page
  useEffect(() => {
    if (allMenuItems.length > 0 && preselectedItems.length > 0) {
      let changed = false;
      const itemsToAdd: {item: any, quantity: number}[] = [];
      
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

  const [holdingBookingId, setHoldingBookingId] = useState<string | null>(null);

  // Generate next 7 days for date picker
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

  // Generate time slots based on branch operating hours
  const timeOptions = useMemo(() => {
    const openTime = branch?.open_time || '09:00';
    const closeTime = branch?.close_time || '22:00';
    const [oh, om] = openTime.split(':').map(Number);
    const [ch, cm] = closeTime.split(':').map(Number);
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    
    const slots: { label: string; value: string; disabled: boolean }[] = [];
    const selectedDate = dateOptions[selectedDateIdx]?.value;
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
    
    for (let m = openMin; m <= closeMin - 60; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const isPast = isToday && m <= nowMin + 30; // Must be at least 30 min from now
      slots.push({ label: timeStr, value: timeStr, disabled: isPast });
    }
    return slots;
  }, [branch, selectedDateIdx, dateOptions]);

  useEffect(() => {
    fetchInitData();
  }, [id]);

  const fetchInitData = async () => {
    try {
      const branchRes = await CustomerService.getBranchById(id);
      if (branchRes.success) {
        setBranch(branchRes.data);
        setZones(branchRes.data.zones || []);
      }
      try {
        const menuRes = await CustomerService.getPublicMenu(id);
        if (menuRes.success) {
          setMenuCategories(menuRes.data || []);
        }
      } catch {}
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu chi nhánh');
      router.back();
    } finally {
      setInitLoading(false);
    }
  };

  const selectedDate = dateOptions[selectedDateIdx]?.value || '';
  const selectedTime = selectedTimeIdx >= 0 ? timeOptions[selectedTimeIdx]?.value || '' : '';

  const validateStep1 = () => {
    if (!selectedDate) { Alert.alert('Lỗi', 'Vui lòng chọn ngày'); return false; }
    if (!selectedTime) { Alert.alert('Lỗi', 'Vui lòng chọn giờ'); return false; }
    if (guests < 1 || guests > 20) { Alert.alert('Lỗi', 'Số khách từ 1 đến 20'); return false; }

    // Pre-order rule: if < 2 hours from now, disable pre-order
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
    setLoading(true);
    try {
      const res = await BookingService.checkAvailability(id, selectedDate, selectedTime);
      if (res.success) {
        setBookedTableIds(res.data.booked_table_ids || []);
        setStep(2);
      }
    } catch {
      // Fallback: skip availability check if endpoint not working, proceed to table selection
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
      // Try reception hold first
      const res = await BookingService.holdBooking({
        branch_id: id, date: selectedDate, time: selectedTime,
        table_ids: selectedTableIds, guest_count: guests,
      });
      if (res.success) {
        setHoldingBookingId(res.data._id);
        setStep(3);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback: reception/hold failed (Redis down, etc.) — skip hold, proceed
    }
    // Fallback: no hold, just continue to pre-order / summary
    setStep(3);
    setLoading(false);
  };

  const handleAddToCart = (item: any, delta: number) => {
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

  const getPreOrderTotal = () => cart.reduce((t, i) => t + (i.item.price * i.quantity), 0);

  const handleConfirm = async () => {
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
        // Update holding booking with pre-order info
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
        // Fallback: Create direct booking first
        const payload: any = {
          branch_id: id, reservation_date: selectedDate, arrival_time: selectedTime,
          guest_count: guests, note,
          table_ids: selectedTableIds,
        };
        if (cart.length > 0) {
          payload.order_items = cart.map(i => ({
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
      
      // Step 2 of confirmation: Call createPayment to lock for 15 mins and set PENDING_PAYMENT
      if (bId) {
        const paymentData = await BookingService.createPayment(bId, paymentMethod);
        if (paymentData.success) {
          setDepositAmount(paymentData.data.total_deposit);
          setPaymentTimeLeft(paymentData.data.expires_in_seconds || 900);
          setStep(5); // Move to Payment Step
        } else {
          Alert.alert('Lỗi', 'Không thể tính toán thanh toán.');
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xác nhận đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    if (!holdingBookingId) return;
    setLoading(true);
    try {
      const res = await BookingService.mockConfirmPayment(holdingBookingId);
      if (res.success) {
        Alert.alert('Thành công', 'Thanh toán thành công! Bàn của bạn đã được xác nhận.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi thanh toán giả lập');
    } finally {
      setLoading(false);
    }
  };

  // Timer effect for Step 5
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

  if (initLoading) {
    return <View className="flex-1 justify-center items-center bg-background"><ActivityIndicator size="large" color="#b45309" /></View>;
  }

  if (branch?.status === 'CLOSED') {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="font-lexend font-bold text-xl text-text mb-2">Chi nhánh đã đóng cửa</Text>
        <Text className="font-lexend text-muted text-center mb-4">Vui lòng chọn chi nhánh khác hoặc quay lại sau.</Text>
        <Button title="Quay lại" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  if (branch?.status === 'FULL') {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="font-lexend font-bold text-xl text-text mb-2">Chi nhánh đã đầy</Text>
        <Text className="font-lexend text-muted text-center mb-4">Hiện tại chi nhánh không còn chỗ. Vui lòng thử lại sau.</Text>
        <Button title="Quay lại" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const totalSteps = canPreOrder ? 5 : 4;
  const stepLabels = ['Chọn ngày giờ', 'Chọn bàn', ...(canPreOrder ? ['Đặt trước món'] : []), 'Xác nhận', 'Thanh toán'];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-2 border-b border-gray-100 bg-white flex-row items-center">
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="mr-3">
          <Text className="text-text text-xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-lexend font-bold text-lg text-text">{branch?.name || 'Đặt bàn'}</Text>
          <Text className="font-lexend text-muted text-xs">Bước {step}/{totalSteps} — {stepLabels[step - 1]}</Text>
        </View>
      </View>

      {/* === STEP 1: Chọn ngày, giờ, số khách === */}
      {step === 1 && (
        <ScrollView className="flex-1 p-4">
          {/* Date Selector */}
          <Text className="font-lexend font-bold text-base mb-2">Chọn ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {dateOptions.map((d, i) => (
              <TouchableOpacity key={d.value} onPress={() => { setSelectedDateIdx(i); setSelectedTimeIdx(-1); }}
                className={`px-4 py-3 mr-2 rounded-xl border ${selectedDateIdx === i ? 'bg-amber-700 border-amber-700' : 'bg-white border-gray-200'}`}>
                <Text className={`font-lexend font-semibold text-sm ${selectedDateIdx === i ? 'text-white' : 'text-text'}`}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time Selector */}
          <Text className="font-lexend font-bold text-base mb-2">Chọn giờ</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {timeOptions.map((t, i) => (
              <TouchableOpacity key={t.value} onPress={() => !t.disabled && setSelectedTimeIdx(i)} disabled={t.disabled}
                className={`px-3 py-2 rounded-lg border ${
                  t.disabled ? 'bg-gray-100 border-gray-100 opacity-40' :
                  selectedTimeIdx === i ? 'bg-amber-700 border-amber-700' : 'bg-white border-gray-200'
                }`}>
                <Text className={`font-lexend text-sm font-semibold ${
                  t.disabled ? 'text-gray-400' :
                  selectedTimeIdx === i ? 'text-white' : 'text-text'
                }`}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Guests */}
          <Text className="font-lexend font-bold text-base mb-2">Số khách</Text>
          <View className="flex-row items-center bg-white rounded-lg border border-gray-200 p-3 mb-4">
            <TouchableOpacity onPress={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <Text className="font-lexend font-bold text-lg">-</Text>
            </TouchableOpacity>
            <Text className="font-lexend font-bold text-xl mx-6">{guests}</Text>
            <TouchableOpacity onPress={() => setGuests(Math.min(20, guests + 1))} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <Text className="font-lexend font-bold text-lg">+</Text>
            </TouchableOpacity>
          </View>

          <Input label="Ghi chú (tùy chọn)" value={note} onChangeText={setNote} placeholder="Dị ứng, ghế trẻ em, v.v." />
        </ScrollView>
      )}

      {/* === STEP 2: Chọn bàn === */}
      {step === 2 && (
        <View className="flex-1">
          <ScrollView horizontal className="px-4 py-3 border-b border-gray-100 bg-white" showsHorizontalScrollIndicator={false}>
            {zones.map((zone: any, idx: number) => (
              <TouchableOpacity key={zone._id || idx} onPress={() => setSelectedZoneIdx(idx)}
                className={`px-4 py-2 mr-2 rounded-full ${selectedZoneIdx === idx ? 'bg-amber-700' : 'bg-gray-200'}`}>
                <Text className={`font-lexend text-sm font-semibold ${selectedZoneIdx === idx ? 'text-white' : 'text-gray-600'}`}>{zone.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FlatList
            data={(zones[selectedZoneIdx]?.tables || []) as any[]}
            keyExtractor={(item: any) => item._id}
            numColumns={2}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item: table }: { item: any }) => {
              const isBooked = bookedTableIds.includes(table._id);
              const isSelected = selectedTableIds.includes(table._id);
              const isAvailable = !isBooked && (table.status === 'EMPTY' || !table.status);
              const statusInfo = TABLE_STATUS[table.status] || TABLE_STATUS.EMPTY;
              return (
                <TouchableOpacity
                  className={`flex-1 m-2 p-4 rounded-xl border-2 ${
                    isSelected ? 'border-amber-700 bg-amber-50' :
                    isAvailable ? 'border-green-300 bg-green-50' :
                    'border-gray-200 bg-gray-100 opacity-60'
                  }`}
                  onPress={() => isAvailable && handleTableToggle(table._id)}
                  disabled={!isAvailable}>
                  <Text className="font-lexend font-bold text-text">{table.table_number}</Text>
                  <Text className="font-lexend text-xs text-muted">Chỗ ngồi: {table.capacity}</Text>
                  <View className={`mt-2 px-2 py-1 rounded-full self-start ${isSelected ? 'bg-amber-100' : statusInfo.bg}`}>
                    <Text className={`text-xs font-lexend font-bold ${isSelected ? 'text-amber-700' : statusInfo.text}`}>
                      {isBooked ? 'Đã đặt' : isSelected ? '✓ Đã chọn' : statusInfo.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<View className="py-10 items-center"><Text className="font-lexend text-muted">Không có bàn trong khu vực này</Text></View>}
          />
          {selectedTableIds.length > 0 && (
            <View className="px-4 py-2 bg-amber-50 border-t border-amber-200">
              <Text className="font-lexend text-amber-800 text-sm font-semibold">Đã chọn {selectedTableIds.length} bàn</Text>
            </View>
          )}
        </View>
      )}

      {/* === STEP 3: Đặt trước món === */}
      {step === 3 && (
        <View className="flex-1 p-4">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1">
            <Text className="font-lexend font-bold text-lg mb-1">Đặt trước món ăn</Text>
            
            {!canPreOrder ? (
              <View className="flex-1 justify-center items-center py-10">
                <Text className="text-4xl mb-4">⏰</Text>
                <Text className="font-lexend font-bold text-lg text-text mb-2">Không thể đặt món trước</Text>
                <Text className="font-lexend text-muted text-center leading-6">
                  Giờ đặt bàn của bạn cách hiện tại chưa đến 2 tiếng. {"\n"}
                  Quý khách vui lòng gọi món trực tiếp tại nhà hàng nhé!
                </Text>
              </View>
            ) : (
              <>
                <Text className="font-lexend text-muted text-xs mb-3">Không bắt buộc — bạn có thể gọi món tại nhà hàng</Text>
                <FlatList
              data={allMenuItems}
              keyExtractor={(item: any) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({item}: {item: any}) => {
                const cartItem = cart.find(i => i.item._id === item._id);
                const qty = cartItem ? cartItem.quantity : 0;
                return (
                  <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                    <View className="flex-1 mr-2">
                      <Text className="font-lexend font-semibold text-text">{item.name}</Text>
                      <Text className="font-lexend text-primary text-sm">{item.price?.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity onPress={() => handleAddToCart(item, -1)} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                        <Text className="font-lexend font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="font-lexend font-bold mx-2 w-4 text-center">{qty}</Text>
                      <TouchableOpacity onPress={() => handleAddToCart(item, 1)} className="w-8 h-8 bg-amber-700 rounded-full items-center justify-center">
                        <Text className="font-lexend font-bold text-white">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text className="font-lexend text-muted text-center py-4">Chưa có món trong thực đơn</Text>}
            />
            {cart.length > 0 && (
              <View className="pt-4 border-t border-gray-100">
                <View className="flex-row justify-between">
                  <Text className="font-lexend font-bold text-text">Tổng đặt trước:</Text>
                  <Text className="font-lexend font-bold text-primary">{getPreOrderTotal().toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            )}
            </>
            )}
          </View>
        </View>
      )}

      {/* === STEP 4: Xác nhận === */}
      {step === 4 && (
        <ScrollView className="flex-1 p-4">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="font-lexend font-bold text-lg mb-4">Tóm tắt đặt bàn</Text>
            <InfoRow label="Chi nhánh" value={branch?.name || ''} />
            <InfoRow label="Ngày" value={selectedDate} />
            <InfoRow label="Giờ" value={selectedTime} />
            <InfoRow label="Số khách" value={`${guests} khách`} />
            <InfoRow label="Số bàn" value={`${selectedTableIds.length} bàn`} />
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-4">
            <Text className="font-lexend font-bold text-lg mb-4">Thông tin khách hàng</Text>
            {isAuthenticated && user ? (
              <>
                <InfoRow label="Họ tên" value={user.full_name} />
                <InfoRow label="Số điện thoại" value={user.phone} />
                <InfoRow label="Email" value={user.email} />
              </>
            ) : (
              <Text className="font-lexend text-red-500 text-sm">Chưa đăng nhập. Bạn sẽ được yêu cầu đăng nhập khi thanh toán.</Text>
            )}
            {cart.length > 0 && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="font-lexend font-bold text-text mb-2">Món đặt trước ({cart.reduce((a,b) => a+b.quantity, 0)} món)</Text>
                {cart.map(i => (
                  <View key={i.item._id} className="flex-row justify-between mb-1">
                    <Text className="font-lexend text-muted text-sm">{i.quantity}x {i.item.name}</Text>
                    <Text className="font-lexend text-muted text-sm">{(i.item.price * i.quantity).toLocaleString('vi-VN')}đ</Text>
                  </View>
                ))}
                <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-50">
                  <Text className="font-lexend font-bold">Tổng món</Text>
                  <Text className="font-lexend font-bold text-primary">{getPreOrderTotal().toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            )}
            {note ? <Text className="font-lexend text-muted text-sm mt-4">Ghi chú: {note}</Text> : null}
          </View>
        </ScrollView>
      )}

      {/* === STEP 5: Thanh toán === */}
      {step === 5 && (
        <ScrollView className="flex-1 p-4">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 items-center">
            <Text className="font-lexend font-bold text-lg mb-2">Thanh toán cọc bảo đảm</Text>
            <Text className="font-lexend text-muted text-center text-sm mb-4">
              Theo quy định, bạn cần thanh toán cọc để xác nhận đặt bàn. Bàn sẽ được giữ cho bạn trong thời gian đếm ngược dưới đây.
            </Text>
            
            <View className="bg-orange-50 px-6 py-3 rounded-xl border border-orange-200 mb-6 w-full items-center">
              <Text className="font-lexend text-orange-800 text-sm mb-1">Thời gian giữ bàn còn lại</Text>
              <Text className="font-lexend font-bold text-3xl text-orange-600">
                {Math.floor(paymentTimeLeft / 60).toString().padStart(2, '0')}:{(paymentTimeLeft % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            <View className="w-full flex-row justify-between mb-2">
              <Text className="font-lexend text-muted">Số tiền cần thanh toán:</Text>
              <Text className="font-lexend font-bold text-primary text-lg">{depositAmount.toLocaleString('vi-VN')}đ</Text>
            </View>

            <View className="w-full mt-4">
              <Text className="font-lexend font-bold mb-3">Phương thức thanh toán</Text>
              <TouchableOpacity onPress={() => setPaymentMethod('VNPAY')} className={`flex-row items-center p-3 border rounded-xl mb-2 ${paymentMethod === 'VNPAY' ? 'border-primary bg-amber-50' : 'border-gray-200'}`}>
                <View className="w-4 h-4 rounded-full border border-primary mr-3 items-center justify-center">
                  {paymentMethod === 'VNPAY' && <View className="w-2 h-2 rounded-full bg-primary" />}
                </View>
                <Text className="font-lexend font-semibold text-text">Thanh toán qua VNPAY</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPaymentMethod('MOMO')} className={`flex-row items-center p-3 border rounded-xl ${paymentMethod === 'MOMO' ? 'border-primary bg-amber-50' : 'border-gray-200'}`}>
                <View className="w-4 h-4 rounded-full border border-primary mr-3 items-center justify-center">
                  {paymentMethod === 'MOMO' && <View className="w-2 h-2 rounded-full bg-primary" />}
                </View>
                <Text className="font-lexend font-semibold text-text">Thanh toán qua MoMo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Bar */}
      <View className="p-4 bg-white border-t border-gray-100">
        <Button 
          title={
            step === 1 ? 'Kiểm tra bàn trống' :
            step === 2 ? 'Giữ bàn & tiếp tục' :
            step === 3 && canPreOrder ? 'Tiếp tục' :
            step === 4 ? 'Tiến hành thanh toán' :
            'Tôi đã thanh toán (Giả lập)'
          }
          onPress={() => {
            if (step === 1) { if (validateStep1()) checkAvailabilityAndContinue(); }
            else if (step === 2) { handleHoldAndContinue(); }
            else if (step === 3 && canPreOrder) { setStep(4); }
            else if (step === 4) { handleConfirm(); }
            else if (step === 5) { handleMockPayment(); }
          }}
          loading={loading}
        />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="font-lexend text-muted">{label}</Text>
      <Text className="font-lexend font-semibold text-text">{value}</Text>
    </View>
  );
}
