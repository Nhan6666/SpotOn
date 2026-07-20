import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { BookingService } from '@/features/booking/booking.service';
import { useAuthStore } from '@/hooks/useAuthStore';

const KANBAN_COLUMNS = [
  { id: 'UPCOMING', label: 'Sắp đến', bg: 'bg-white', border: 'border-gray-100', text: 'text-gray-700', headerText: 'text-gray-900', countBg: 'bg-gray-100' },
  { id: 'LATE', label: 'Trễ giờ', bg: 'bg-red-50/30', border: 'border-red-100', text: 'text-red-700', headerText: 'text-red-700', countBg: 'bg-red-100' },
  { id: 'IN_USE', label: 'Đang phục vụ', bg: 'bg-blue-50/30', border: 'border-blue-100', text: 'text-blue-700', headerText: 'text-blue-700', countBg: 'bg-blue-100' },
];

export default function KanbanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get('window').width;
  const columnWidth = screenWidth * 0.75; // Each column takes 75% of screen width

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      if (user?.branch_id) {
        const res = await BookingService.getAllBookings({ branch_id: user.branch_id });
        if (res.success) {
          setBookings(res.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  const getBookingsByStatus = (statusId: string) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    return bookings.filter(b => {
      // Only care about today's bookings (simplified logic for UI)
      const bookingDate = new Date(b.reservation_date).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      if (bookingDate !== today) return false;

      if (statusId === 'UPCOMING') {
        return b.status === 'CONFIRMED' && b.arrival_time >= currentTimeStr;
      }
      if (statusId === 'LATE') {
        return b.status === 'CONFIRMED' && b.arrival_time < currentTimeStr;
      }
      if (statusId === 'IN_USE') {
        return b.status === 'IN_USE';
      }
      return false;
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="bg-white pt-4 pb-4 px-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 rounded-full items-center justify-center">
            <FontAwesome name="arrow-left" size={16} color="#374151" />
          </TouchableOpacity>
          <View>
            <Text className="font-lexend font-bold text-xl text-text">Kanban Check-in</Text>
            <Text className="font-lexend text-xs text-gray-500">Quản lý khách đến nhà hàng theo ngày</Text>
          </View>
        </View>
        
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
          <Text className="font-lexend text-xs text-gray-700 mr-2">Chọn ngày: <Text className="font-bold">{new Date().toLocaleDateString('vi-VN')}</Text></Text>
          <FontAwesome name="calendar" size={12} color="#4b5563" />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-1 px-4 mt-4"
        snapToInterval={columnWidth + 16} // 16 for margin
        decelerationRate="fast"
      >
        {KANBAN_COLUMNS.map((col) => {
          const colBookings = getBookingsByStatus(col.id);
          
          return (
            <View 
              key={col.id} 
              style={{ width: columnWidth }}
              className={`mr-4 ${col.bg} border ${col.border} rounded-2xl overflow-hidden mb-6`}
            >
              <View className="p-4 border-b border-gray-100 bg-white flex-row items-center">
                <Text className={`font-lexend font-bold ${col.headerText} mr-2`}>{col.label}</Text>
                <View className={`${col.countBg} px-2 py-0.5 rounded-full`}>
                  <Text className={`font-lexend font-bold text-xs ${col.text}`}>{colBookings.length}</Text>
                </View>
              </View>

              <ScrollView className="flex-1 p-3" showsVerticalScrollIndicator={false}>
                {colBookings.length === 0 ? (
                  <View className="py-10 items-center justify-center">
                    <Text className="font-lexend text-gray-400 text-xs text-center">Không có khách {col.label.toLowerCase()}</Text>
                  </View>
                ) : (
                  colBookings.map((booking: any) => (
                    <TouchableOpacity
                      key={booking._id}
                      className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3"
                      onPress={() => router.push(`/booking/detail/${booking._id}`)}
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="font-lexend font-bold text-text flex-1 text-sm">
                          {booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai'}
                        </Text>
                        <Text className="font-lexend font-bold text-gray-700 text-sm bg-gray-50 px-2 py-0.5 rounded">
                          {booking.arrival_time}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center mb-1">
                        <FontAwesome name="phone" size={10} color="#9ca3af" />
                        <Text className="font-lexend text-gray-500 text-xs ml-1.5">
                          {booking.customer_id?.phone_number || booking.walk_in_phone || '---'}
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
                        <View className="flex-row items-center bg-orange-50 px-2 py-1 rounded border border-orange-100">
                          <FontAwesome name="user" size={10} color="#c2410c" />
                          <Text className="font-lexend text-[10px] font-bold text-orange-700 ml-1">{booking.guest_count} người</Text>
                        </View>
                        
                        {booking.assigned_tables && booking.assigned_tables.length > 0 ? (
                          <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            <FontAwesome name="square-o" size={10} color="#1d4ed8" />
                            <Text className="font-lexend text-[10px] font-bold text-blue-700 ml-1">
                              Bàn {booking.assigned_tables.map((t: any) => t.table_number).join(', ')}
                            </Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            <Text className="font-lexend text-[10px] text-gray-500">Chưa xếp bàn</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                <View className="h-4" />
              </ScrollView>
            </View>
          );
        })}
        <View className="w-4" />
      </ScrollView>
    </View>
  );
}
