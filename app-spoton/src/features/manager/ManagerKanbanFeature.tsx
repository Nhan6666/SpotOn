import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { BookingService } from '@/features/booking/booking.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { getSocket } from '@/lib/socket';
import { Colors } from '@/constants/Colors';
import { CheckoutModal } from './components/CheckoutModal';

const KANBAN_COLUMNS = [
  { id: 'UPCOMING', label: 'Sắp đến', bg: 'bg-white', border: 'border-gray-100', text: 'text-gray-700', headerText: 'text-gray-900', countBg: 'bg-gray-100' },
  { id: 'LATE', label: 'Trễ giờ', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', headerText: 'text-rose-700', countBg: 'bg-rose-100' },
  { id: 'IN_USE', label: 'Đang phục vụ', bg: 'bg-blue-50/30', border: 'border-blue-100', text: 'text-blue-700', headerText: 'text-blue-700', countBg: 'bg-blue-100' },
];

export function ManagerKanbanFeature() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const screenWidth = Dimensions.get('window').width;
  const columnWidth = screenWidth * 0.9;

  useEffect(() => {
    fetchBookings();

    // Socket listeners for real-time updates
    const onTableStatusChanged = (data: any) => {
      // Re-fetch or update locally. For simplicity & accuracy, re-fetch.
      fetchBookings(true);
    };

    const socket = getSocket();
    socket.on('table_status_changed', onTableStatusChanged);

    return () => {
      socket.off('table_status_changed', onTableStatusChanged);
    };
  }, []);

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (user?.branch_id) {
        // Lấy tất cả bookings trong ngày
        const today = new Date().toISOString().split('T')[0]; // Simple YYYY-MM-DD
        const res = await BookingService.getAllBookings({ branch_id: user.branch_id });
        if (res.success) {
          setBookings(res.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (!silent) Alert.alert('Lỗi', 'Không thể tải danh sách đơn đặt bàn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings(true);
  }, []);

  const handleCheckIn = async (bookingId: string) => {
    Alert.alert(
      'Xác nhận Check-in',
      'Khách đã đến và bắt đầu sử dụng dịch vụ?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Check-in',
          onPress: async () => {
            setProcessingId(bookingId);
            try {
              await BookingService.checkInBooking(bookingId);
              fetchBookings(true);
            } catch (error: any) {
              Alert.alert('Lỗi Check-in', error.response?.data?.message || 'Không thể check-in lúc này.');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleCheckout = (booking: any) => {
    setSelectedBookingForCheckout(booking);
  };

  const handleForceRelease = (bookingId: string) => {
    Alert.alert(
      'Cảnh báo',
      'Bạn sắp nhả bàn này mà chưa thanh toán.\nĐơn sẽ được chuyển vào danh sách chờ đối soát.\nTiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nhả bàn',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(bookingId);
              await BookingService.forceReleaseBooking(bookingId);
              Alert.alert('Thành công', 'Đã nhả bàn thành công!');
              fetchBookings(true);
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể nhả bàn');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const getBookingsByStatus = (statusId: string) => {
    const today = new Date();
    const currentTimeStr = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    
    const selDateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const todayLocalStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    return bookings.filter(b => {
      const bDateStr = new Date(new Date(b.reservation_date).getTime() - (new Date(b.reservation_date).getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      if (bDateStr !== selDateStr) return false;
      
      if (['CANCELLED', 'CANCELLED_TIMEOUT', 'CANCELLED_PAYMENT_FAILED', 'REFUND_COMPLETED', 'NO_SHOW'].includes(b.status)) {
        return false;
      }

      if (statusId === 'IN_USE') {
        return b.status === 'IN_USE';
      }

      if (['CONFIRMED', 'PENDING_PAYMENT', 'HOLDING'].includes(b.status)) {
        let isLate = false;
        if (selDateStr < todayLocalStr) {
          isLate = true;
        } else if (selDateStr === todayLocalStr && b.arrival_time < currentTimeStr) {
          isLate = true;
        }

        if (statusId === 'LATE') return isLate;
        if (statusId === 'UPCOMING') return !isLate;
      }
      return false;
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-4 pt-4 pb-3 shadow-sm z-10 border-b border-gray-100">
        <Text className="font-lexend font-bold text-xl text-text mb-1">Check-in Kanban</Text>
        <Text className="font-lexend text-xs text-gray-500 mb-3">Theo dõi và quản lý luồng khách đến nhà hàng.</Text>
        
        <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 p-2 justify-between">
          <View>
            <Text className="font-lexend text-[10px] text-gray-500 mb-1">Ngày Check-in</Text>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => changeDate(-1)} className="px-2 py-1 mr-1 bg-white rounded border border-gray-200">
                <FontAwesome name="chevron-left" size={10} color="#6b7280" />
              </TouchableOpacity>
              <Text className="font-lexend font-bold text-sm text-text mx-1">{selectedDate.toLocaleDateString('vi-VN')}</Text>
              <TouchableOpacity onPress={() => changeDate(1)} className="px-2 py-1 ml-1 bg-white rounded border border-gray-200">
                <FontAwesome name="chevron-right" size={10} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={onRefresh} className="px-3 py-2 rounded-lg bg-white border border-gray-200 items-center justify-center flex-row shadow-sm">
            <FontAwesome name="refresh" size={12} color="#4b5563" />
            <Text className="font-lexend text-xs text-gray-600 ml-2 font-bold">Làm mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-1 px-4 mt-4"
        snapToInterval={columnWidth + 16}
        decelerationRate="fast"
      >
        {KANBAN_COLUMNS.map((col) => {
          const colBookings = getBookingsByStatus(col.id);
          
          return (
            <View 
              key={col.id} 
              style={{ width: columnWidth }}
              className={`mr-4 ${col.bg} border ${col.border} rounded-2xl overflow-hidden mb-6 flex-1 shadow-sm`}
            >
              <View className="p-4 border-b border-gray-100 bg-white/80 flex-row items-center">
                <Text className={`font-lexend font-bold ${col.headerText} mr-2 text-base`}>{col.label}</Text>
                <View className={`${col.countBg} px-2 py-0.5 rounded-full`}>
                  <Text className={`font-lexend font-bold text-xs ${col.text}`}>{colBookings.length}</Text>
                </View>
              </View>

              <ScrollView 
                className="flex-1 p-3" 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
              >
                {colBookings.length === 0 ? (
                  <View className="py-10 items-center justify-center">
                    <Text className="font-lexend text-gray-400 text-sm text-center">Trống</Text>
                  </View>
                ) : (
                  colBookings.map((booking: any) => {
                    const isOnlineMember = !!booking.customer_id;
                    const hasDeposit = booking.payment_info?.status === 'PAID' || !!booking.payment_info?.transaction_id;
                    const isOnlineGuest = !booking.customer_id && (!!booking.walk_in_phone || hasDeposit || booking.status === 'CONFIRMED' || (booking.walk_in_name && booking.walk_in_name !== 'Khách vãng lai'));
                    const isOnline = isOnlineMember || isOnlineGuest;

                    return (
                    <TouchableOpacity
                      key={booking._id}
                      className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3"
                      onPress={() => router.push(`/booking/detail/${booking._id}`)}
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 flex-row items-center flex-wrap pr-2">
                          <Text className="font-lexend font-bold text-text text-sm">
                            {booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai'}
                          </Text>
                          {isOnline && (
                            <View className="bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 ml-2 flex-row items-center">
                              <FontAwesome name="globe" size={8} color="#7e22ce" />
                              <Text className="font-lexend text-[8px] font-bold text-purple-700 ml-1">ĐẶT ONLINE</Text>
                            </View>
                          )}
                        </View>
                        <Text className="font-lexend font-bold text-gray-700 text-sm bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {booking.arrival_time}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center mb-1">
                        <FontAwesome name="phone" size={12} color="#9ca3af" />
                        <Text className="font-lexend text-gray-500 text-xs ml-2">
                          {booking.customer_id?.phone_number || booking.walk_in_phone || '---'}
                        </Text>
                      </View>

                      <View className={`mt-3 pt-3 border-t border-gray-50 ${col.id === 'IN_USE' ? '' : 'flex-row justify-between items-center'}`}>
                        <View className={`flex-row gap-2 ${col.id === 'IN_USE' ? 'mb-3' : ''}`}>
                          <View className="flex-row items-center bg-orange-50 px-2 py-1 rounded border border-orange-100">
                            <FontAwesome name="user" size={10} color="#c2410c" />
                            <Text className="font-lexend text-[10px] font-bold text-orange-700 ml-1">{booking.guest_count}</Text>
                          </View>
                          
                          {booking.assigned_tables && booking.assigned_tables.length > 0 ? (
                            <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded border border-blue-100">
                              <FontAwesome name="square-o" size={10} color="#1d4ed8" />
                              <Text className="font-lexend text-[10px] font-bold text-blue-700 ml-1">
                                {booking.assigned_tables.map((t: any) => t.table_number).join(', ')}
                              </Text>
                            </View>
                          ) : (
                            <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded border border-gray-100">
                              <Text className="font-lexend text-[10px] text-gray-500">Chưa xếp</Text>
                            </View>
                          )}
                        </View>

                        {/* Kanban Action Buttons */}
                        {(col.id === 'UPCOMING' || col.id === 'LATE') && booking.status === 'CONFIRMED' && (
                          <TouchableOpacity 
                            onPress={() => handleCheckIn(booking._id)}
                            disabled={processingId === booking._id}
                            className={`bg-primary px-3 py-1.5 rounded-lg flex-row items-center ${processingId === booking._id ? 'opacity-50' : ''}`}
                          >
                            {processingId === booking._id ? <ActivityIndicator size="small" color="#fff" /> : <Text className="font-lexend font-bold text-white text-xs">Check-in</Text>}
                          </TouchableOpacity>
                        )}

                        {col.id === 'IN_USE' && (
                          <View className="flex-row gap-2">
                            <TouchableOpacity 
                              onPress={() => handleForceRelease(booking._id)}
                              disabled={processingId === booking._id}
                              className={`border border-red-200 bg-red-50 px-3 py-2 rounded-lg flex-row items-center justify-center flex-1 ${processingId === booking._id ? 'opacity-50' : ''}`}
                            >
                              <Text className="font-lexend font-bold text-red-600 text-[11px]">Nhả bàn</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleCheckout(booking)}
                              className="bg-green-600 px-3 py-2 rounded-lg flex-row items-center justify-center flex-1"
                            >
                              <Text className="font-lexend font-bold text-white text-[11px]">Thanh toán →</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                    );
                  })
                )}
                <View className="h-4" />
              </ScrollView>
            </View>
          );
        })}
        <View className="w-4" />
      </ScrollView>

      {selectedBookingForCheckout && (
        <CheckoutModal 
          visible={!!selectedBookingForCheckout}
          booking={selectedBookingForCheckout}
          onClose={() => setSelectedBookingForCheckout(null)}
          onSuccess={() => {
            setSelectedBookingForCheckout(null);
            fetchBookings(true); // reload Kanban
          }}
        />
      )}
    </View>
  );
}
