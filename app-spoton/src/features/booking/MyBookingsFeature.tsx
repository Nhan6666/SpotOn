import { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { BookingService } from './booking.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const STATUS_MAP: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'primary'; label: string }> = {
  HOLDING:                  { variant: 'warning', label: 'Đang giữ' },
  PENDING_PAYMENT:          { variant: 'warning', label: 'Chờ thanh toán' },
  PENDING_DEPOSIT:          { variant: 'warning', label: 'Chờ đặt cọc' },
  CONFIRMED:                { variant: 'primary', label: 'Đã xác nhận' },
  IN_USE:                   { variant: 'success', label: 'Đang dùng' },
  COMPLETED:                { variant: 'success', label: 'Hoàn thành' },
  CANCELLED:                { variant: 'error',   label: 'Đã hủy' },
  CANCELLED_TIMEOUT:        { variant: 'error',   label: 'Hết hạn' },
  CANCELLED_REFUND_PENDING: { variant: 'primary', label: 'Chờ hoàn tiền' },
  REFUND_COMPLETED:         { variant: 'success', label: 'Đã hoàn tiền' },
  NO_SHOW:                  { variant: 'error',   label: 'Không đến' },
};

type TabType = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export function MyBookingsFeature() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('UPCOMING');
  const { user } = useAuthStore();

  // Cancel Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<any>(null);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await BookingService.getMyBookings();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.log('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (activeTab === 'UPCOMING') return ['HOLDING', 'PENDING_PAYMENT', 'PENDING_DEPOSIT', 'CONFIRMED', 'IN_USE'].includes(b.status);
      if (activeTab === 'COMPLETED') return ['COMPLETED'].includes(b.status);
      if (activeTab === 'CANCELLED') return ['CANCELLED', 'CANCELLED_TIMEOUT', 'CANCELLED_REFUND_PENDING', 'REFUND_COMPLETED', 'NO_SHOW'].includes(b.status);
      return true;
    }).sort((a, b) => new Date(b.reservation_date).getTime() - new Date(a.reservation_date).getTime());
  }, [bookings, activeTab]);

  const handleCancelHold = async (bookingId: string) => {
    Alert.alert(
      'Hủy đặt bàn',
      'Bạn có chắc muốn hủy đặt bàn này?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Hủy đặt bàn',
          style: 'destructive',
          onPress: async () => {
            try {
              await BookingService.releaseHold(bookingId);
              Alert.alert('Thành công', 'Đã hủy đặt bàn.');
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy');
            }
          }
        }
      ]
    );
  };

  const openCancelModal = (booking: any) => {
    setSelectedBookingForCancel(booking);
    setCancelModalVisible(true);
    setBankName('');
    setBankAccount('');
    setAccountHolder('');
    setCancelReason('');
  };

  const submitCancelConfirmed = async () => {
    if (!selectedBookingForCancel) return;
    const hasDeposit = selectedBookingForCancel.total_deposit_paid > 0;
    
    if (hasDeposit && (!bankName || !bankAccount || !accountHolder)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin ngân hàng để nhận hoàn tiền.');
      return;
    }

    setCanceling(true);
    try {
      await BookingService.cancelBooking(selectedBookingForCancel._id, {
        bank_name: bankName,
        bank_account_number: bankAccount,
        account_holder_name: accountHolder,
        cancellation_reason: cancelReason || 'Khách hàng tự hủy trên App',
      });
      Alert.alert('Thành công', hasDeposit ? 'Yêu cầu hủy bàn và hoàn tiền đã được gửi.' : 'Đã hủy đặt bàn.');
      setCancelModalVisible(false);
      fetchBookings();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy đặt bàn lúc này.');
    } finally {
      setCanceling(false);
    }
  };

  const renderBooking = ({ item }: { item: any }) => {
    const statusInfo = STATUS_MAP[item.status] || { variant: 'default', label: item.status };
    const isHolding = ['HOLDING', 'PENDING_DEPOSIT', 'PENDING_PAYMENT'].includes(item.status);
    const isConfirmed = item.status === 'CONFIRMED';
    const depositPaid = item.total_deposit_paid || 0;

    return (
      <TouchableOpacity 
        className="bg-white rounded-2xl mb-4 p-4 border border-gray-100 shadow-sm"
        activeOpacity={0.7}
        onPress={() => router.push(`/booking/detail/${item._id}`)}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <Text className="font-lexend font-bold text-lg text-text">
              {item.branch_id?.name || 'SpotOn Branch'}
            </Text>
            <View className="flex-row items-center mt-1">
              <FontAwesome name="calendar" size={12} color={Colors.muted} />
              <Text className="font-lexend text-muted text-sm ml-1">
                {new Date(item.reservation_date).toLocaleDateString('vi-VN')} • {item.arrival_time}
              </Text>
            </View>
          </View>
          <Badge label={statusInfo.label} variant={statusInfo.variant} />
        </View>

        {item.assigned_tables && item.assigned_tables.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-2">
            {item.assigned_tables.map((t: any, idx: number) => (
              <View key={idx} className="bg-gray-50 px-2 py-1 rounded border border-gray-200">
                <Text className="font-lexend text-xs text-gray-600">
                  {t.zone_name} - {t.table_number}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <FontAwesome name="user" size={14} color={Colors.muted} />
            <Text className="font-lexend text-text ml-1.5">{item.guest_count} khách</Text>
          </View>
          {depositPaid > 0 ? (
            <Text className="font-lexend font-bold text-primary">
              Đã cọc: {depositPaid.toLocaleString('vi-VN')}đ
            </Text>
          ) : (
             <Text className="font-lexend text-muted">Chưa đặt cọc</Text>
          )}
        </View>

        {item.order_items && item.order_items.length > 0 && (
          <Text className="font-lexend text-xs text-muted mt-2">
            🍽️ {item.order_items.length} món đặt trước
          </Text>
        )}

        {isHolding && (
          <TouchableOpacity
            className="mt-4 py-2.5 bg-red-50 rounded-xl items-center border border-red-200"
            onPress={() => handleCancelHold(item._id)}
          >
            <Text className="font-lexend font-bold text-red-600 text-sm">Hủy giữ bàn</Text>
          </TouchableOpacity>
        )}

        {isConfirmed && (
          <TouchableOpacity
            className="mt-4 py-2.5 bg-red-50 rounded-xl items-center border border-red-200"
            onPress={() => openCancelModal(item)}
          >
            <Text className="font-lexend font-bold text-red-600 text-sm">Yêu cầu hủy bàn</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background pt-12">
      <View className="px-4 pb-2 bg-white z-10">
        <Text className="font-lexend font-bold text-2xl text-text mb-4">Lịch sử Đặt bàn</Text>
        <View className="flex-row bg-gray-100 p-1 rounded-xl">
          {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as TabType[]).map((tab, idx) => (
            <TouchableOpacity 
              key={idx}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 items-center rounded-lg ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-lexend font-semibold text-sm ${activeTab === tab ? 'text-primary' : 'text-gray-500'}`}>
                {tab === 'UPCOMING' ? 'Sắp tới' : tab === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <FontAwesome name="calendar-times-o" size={32} color={Colors.muted} />
          </View>
          <Text className="font-lexend font-bold text-lg text-text mb-2">Chưa có lịch đặt bàn</Text>
          <Text className="font-lexend text-muted text-center mb-6">Bạn chưa có đơn đặt bàn nào trong mục này.</Text>
          {activeTab === 'UPCOMING' && (
            <Button title="Đặt bàn ngay" onPress={() => router.push('/(tabs)/branches')} />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={item => item._id}
          renderItem={renderBooking}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-lexend font-bold text-xl text-red-600">Yêu cầu hủy đặt bàn</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <FontAwesome name="times" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <Text className="font-lexend text-text mb-4 leading-5">
              Bạn đang yêu cầu hủy đơn đặt bàn ngày <Text className="font-bold">{selectedBookingForCancel ? new Date(selectedBookingForCancel.reservation_date).toLocaleDateString('vi-VN') : ''}</Text>.
            </Text>

            {selectedBookingForCancel?.total_deposit_paid > 0 && (
              <View className="bg-amber-50 p-4 rounded-xl mb-4 border border-amber-200">
                <Text className="font-lexend text-amber-800 font-semibold mb-2">Thông tin nhận hoàn tiền cọc:</Text>
                <TextInput 
                  className="bg-white border border-amber-200 rounded-lg p-3 font-lexend mb-2"
                  placeholder="Tên ngân hàng (VD: Vietcombank)"
                  value={bankName} onChangeText={setBankName}
                />
                <TextInput 
                  className="bg-white border border-amber-200 rounded-lg p-3 font-lexend mb-2"
                  placeholder="Số tài khoản"
                  keyboardType="numeric"
                  value={bankAccount} onChangeText={setBankAccount}
                />
                <TextInput 
                  className="bg-white border border-amber-200 rounded-lg p-3 font-lexend"
                  placeholder="Tên chủ thẻ"
                  autoCapitalize="characters"
                  value={accountHolder} onChangeText={setAccountHolder}
                />
              </View>
            )}

            <TextInput 
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 font-lexend mb-6 h-20 text-text"
              placeholder="Lý do hủy (không bắt buộc)"
              multiline
              textAlignVertical="top"
              value={cancelReason} onChangeText={setCancelReason}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Đóng" variant="outline" onPress={() => setCancelModalVisible(false)} />
              </View>
              <View className="flex-1">
                <Button title="Xác nhận hủy" onPress={submitCancelConfirmed} loading={canceling} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
