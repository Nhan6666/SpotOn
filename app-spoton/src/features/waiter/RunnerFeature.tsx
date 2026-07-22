import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Vibration, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/stores/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';
import apiClient from '@/lib/http';
import { FontAwesome } from '@expo/vector-icons';
import { getSocket } from '@/lib/socket';

const getTimestampFromId = (id: string) => {
  if (!id || id.length < 8) return Date.now();
  return parseInt(id.substring(0, 8), 16) * 1000;
};

export function RunnerFeature() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const branchId = user?.branch_id;

  const fetchOrders = useCallback(async () => {
    if (!branchId) return setLoading(false);
    try {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const res = await BookingService.getAllBookings({ 
        branch_id: branchId,
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });
      if (res.success) {
        const readyItems: any[] = [];
        (res.data || []).forEach((booking: any) => {
          if (['IN_USE', 'CONFIRMED'].includes(booking.status) && booking.order_items) {
            booking.order_items.forEach((item: any) => {
              if (item.prep_status === 'READY') {
                readyItems.push({
                  ...item,
                  booking_id: booking._id,
                  table_name: booking.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A',
                  customer_name: booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai',
                  created_at: item.created_at || getTimestampFromId(item._id)
                });
              }
            });
          }
        });
        readyItems.sort((a, b) => a.created_at - b.created_at);
        setItems(readyItems);
      }
    } catch (error) {
      console.log('Error fetching runner data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId, selectedDate]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    const timerInterval = setInterval(() => setNow(Date.now()), 60000);

    const socket = getSocket();
    if (socket && branchId) {
      socket.on('order_status_changed', (data: any) => {
        if (data.newStatus === 'READY') {
          Vibration.vibrate([0, 500, 200, 500]); // Haptic feedback pattern
          fetchOrders();
        }
      });
    }

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
      if (socket) socket.off('order_status_changed');
    };
  }, [fetchOrders, branchId]);

  const markAsServed = async (bookingId: string, itemId: string) => {
    try {
      // Optimistic UI
      setItems(prev => prev.filter(i => i._id !== itemId));
      await apiClient.patch(`/orders/${bookingId}/items/${itemId}/status`, {
        status: 'SERVED',
      });
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái');
      fetchOrders();
    }
  };

  const getWaitText = (createdAt: number) => {
    const diffMinutes = Math.floor((now - createdAt) / 60000);
    if (diffMinutes === 0) return 'Vừa xong';
    return `${diffMinutes} phút`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 font-lexend text-gray-500">Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const onChangeDate = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 shadow-sm border-b border-gray-200 flex-row justify-between items-center z-10">
        <View>
          <Text className="font-lexend font-bold text-2xl text-gray-900 mb-1">Chạy Món (Runner)</Text>
          <Text className="font-lexend text-green-600 text-sm font-medium flex-row items-center">
            <FontAwesome name="bell" /> Có {items.length} món đang chờ bưng
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            className="w-10 h-10 bg-green-50 rounded-full items-center justify-center border border-green-200"
            onPress={() => setShowDatePicker(true)}
          >
            <FontAwesome name="calendar" size={16} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"
            onPress={fetchOrders}
          >
            <FontAwesome name="refresh" size={16} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Indicator */}
      <View className="px-6 py-3 bg-green-50 border-b border-green-100 flex-row justify-between items-center">
        <Text className="font-lexend font-bold text-green-800 text-sm">
          Ngày: {selectedDate.toLocaleDateString('vi-VN')}
        </Text>
        {selectedDate.toDateString() !== new Date().toDateString() && (
          <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
            <Text className="font-lexend font-bold text-green-600 text-xs underline">Về hôm nay</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl mb-4 border border-gray-200 shadow-sm overflow-hidden flex-row">
            <View className="w-2 h-full bg-green-500" />
            <View className="flex-1 p-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="font-lexend font-bold text-lg text-gray-900 mb-0.5">{item.name}</Text>
                  <Text className="font-lexend text-xs text-gray-500">Khách: {item.customer_name}</Text>
                </View>
                <View className="items-center bg-gray-100 px-3 py-1 rounded-lg">
                  <Text className="font-lexend font-bold text-xl text-gray-900">x{item.quantity}</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between items-center mt-2 border-t border-gray-50 pt-3">
                <View>
                  <Text className="font-lexend font-bold text-sm text-blue-700 mb-1">Bàn {item.table_name}</Text>
                  <Text className="font-lexend text-[10px] text-gray-400">
                    <FontAwesome name="clock-o" /> Đợi: {getWaitText(item.created_at)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  className="bg-green-600 px-5 py-2.5 rounded-xl shadow-sm flex-row items-center"
                  onPress={() => markAsServed(item.booking_id, item._id)}
                >
                  <FontAwesome name="check-circle" size={14} color="white" />
                  <Text className="font-lexend text-white text-sm font-bold ml-2">Đã Phục Vụ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="font-lexend text-gray-400 text-lg font-medium">Tuyệt vời! Đã bưng hết món. 🎉</Text>
          </View>
        }
      />
    </View>
  );
}
