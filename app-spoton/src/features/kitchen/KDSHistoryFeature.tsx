import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/stores/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';
import { FontAwesome } from '@expo/vector-icons';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  READY:  { bg: 'bg-green-50',  text: 'text-green-700', label: 'Đã Nấu Xong' },
  SERVED: { bg: 'bg-gray-100',  text: 'text-gray-600',  label: 'Đã Lên Món' },
};

// Hàm lấy timestamp từ MongoDB _id (nếu item không có created_at)
const getTimestampFromId = (id: string) => {
  if (!id || id.length < 8) return Date.now();
  return parseInt(id.substring(0, 8), 16) * 1000;
};

export function KDSHistoryFeature() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'TABLE' | 'ITEM'>('ITEM'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const branchId = user?.branch_id;

  const fetchHistory = useCallback(async () => {
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
        const historyItems: any[] = [];
        (res.data || []).forEach((booking: any) => {
          if (['IN_USE', 'CONFIRMED', 'COMPLETED'].includes(booking.status) && booking.order_items) {
            booking.order_items.forEach((item: any) => {
              if (['READY', 'SERVED'].includes(item.prep_status)) {
                historyItems.push({
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
        
        // Sort by created_at descending (newest finished items first)
        historyItems.sort((a, b) => b.created_at - a.created_at);
        setItems(historyItems);
      }
    } catch (error) {
      console.log('Error fetching KDS History:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId, selectedDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onChangeDate = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  // Nhóm theo tên món
  const groupedByItem = items.reduce((acc: any, item: any) => {
    const key = `${item.name}_${item.prep_status}`;
    if (!acc[key]) {
      acc[key] = {
        name: item.name,
        prep_status: item.prep_status,
        total_quantity: 0,
        items: [],
        newest_time: item.created_at
      };
    }
    acc[key].total_quantity += item.quantity;
    acc[key].items.push(item);
    if (item.created_at > acc[key].newest_time) {
      acc[key].newest_time = item.created_at;
    }
    return acc;
  }, {});

  const groupedArray = Object.values(groupedByItem).sort((a: any, b: any) => b.newest_time - a.newest_time);

  const stats = {
    ready: items.filter(i => i.prep_status === 'READY').length,
    served: items.filter(i => i.prep_status === 'SERVED').length
  };

  const getTimeString = (createdAt: number) => {
    return new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 font-lexend text-gray-500">Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 shadow-sm border-b border-gray-200 flex-row justify-between items-center z-10">
        <View>
          <Text className="font-lexend font-bold text-2xl text-gray-900 mb-1">Lịch Sử Nấu</Text>
          <Text className="font-lexend text-gray-500 text-sm">
            {stats.ready} đã nấu xong • {stats.served} đã phục vụ
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
            onPress={() => { setRefreshing(true); fetchHistory(); }}
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
            <Text className="font-lexend font-bold text-green-700 text-xs underline">Về hôm nay</Text>
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

      {/* Tabs */}
      <View className="flex-row px-4 py-3 gap-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg border items-center ${viewMode === 'ITEM' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
          onPress={() => setViewMode('ITEM')}
        >
          <Text className={`font-lexend font-bold text-sm ${viewMode === 'ITEM' ? 'text-green-700' : 'text-gray-600'}`}>Gom Theo Món</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg border items-center ${viewMode === 'TABLE' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
          onPress={() => setViewMode('TABLE')}
        >
          <Text className={`font-lexend font-bold text-sm ${viewMode === 'TABLE' ? 'text-green-700' : 'text-gray-600'}`}>Theo Bàn</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'ITEM' ? (
        <FlatList
          data={groupedArray}
          keyExtractor={(item: any, idx) => `group_${idx}`}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} />}
          renderItem={({ item: group }: any) => {
            const info = STATUS_COLORS[group.prep_status];
            
            return (
              <View className="bg-white rounded-xl mb-4 border border-gray-200 shadow-sm overflow-hidden">
                <View className="flex-row items-center border-b border-gray-100">
                  <View className={`w-2 h-full absolute left-0 bg-gray-300`} />
                  <View className="flex-1 px-5 py-4 pl-6 flex-row justify-between items-center">
                    <View>
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-lexend font-bold text-lg text-gray-900">{group.name}</Text>
                        <View className={`px-2 py-0.5 rounded ${info?.bg || 'bg-gray-100'}`}>
                          <Text className={`font-lexend font-bold text-[10px] ${info?.text || 'text-gray-600'}`}>{info?.label || group.prep_status}</Text>
                        </View>
                      </View>
                      <Text className="font-lexend text-xs text-gray-500 flex-row items-center">
                        <FontAwesome name="clock-o" /> Lúc: {getTimeString(group.newest_time)}
                      </Text>
                    </View>
                    <View className="items-center justify-center bg-gray-100 w-12 h-12 rounded-xl">
                      <Text className="font-lexend font-bold text-xl text-gray-700">x{group.total_quantity}</Text>
                    </View>
                  </View>
                </View>

                {/* Sub-items (Tables) */}
                <View className="bg-gray-50 px-5 py-3">
                  <Text className="font-lexend text-xs font-semibold text-gray-500 mb-2 uppercase">Chi tiết bàn</Text>
                  {group.items.map((subItem: any, idx: number) => (
                    <View key={idx} className="flex-row justify-between items-center mb-2">
                      <Text className="font-lexend text-sm text-gray-700 font-medium">Bàn {subItem.table_name}</Text>
                      <Text className="font-lexend text-sm font-bold text-gray-900">x{subItem.quantity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="font-lexend text-gray-400 text-lg font-medium">Chưa có lịch sử nấu trong ngày! 🍳</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, idx) => `item_${idx}`}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} />}
          renderItem={({ item }) => {
            const info = STATUS_COLORS[item.prep_status];
            
            return (
              <View className="bg-white rounded-xl mb-4 border border-gray-200 shadow-sm overflow-hidden flex-row">
                <View className={`w-2 h-full bg-gray-300`} />
                <View className="flex-1 p-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="font-lexend font-bold text-base text-gray-900 mb-0.5">{item.name}</Text>
                      <Text className="font-lexend text-xs text-gray-500">Bàn {item.table_name} • {item.customer_name}</Text>
                    </View>
                    <View className="items-center bg-gray-100 px-3 py-1 rounded-lg">
                      <Text className="font-lexend font-bold text-lg text-gray-800">x{item.quantity}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center gap-2 mt-3">
                    <View className={`px-2 py-1 rounded ${info?.bg || 'bg-gray-100'}`}>
                      <Text className={`font-lexend font-bold text-[10px] ${info?.text || 'text-gray-600'}`}>{info?.label || item.prep_status}</Text>
                    </View>
                    <Text className="font-lexend text-xs text-gray-500">
                      <FontAwesome name="clock-o" /> {getTimeString(item.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="font-lexend text-gray-400 text-lg font-medium">Chưa có lịch sử nấu trong ngày! 🍳</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
