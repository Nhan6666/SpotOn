import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';
import apiClient from '@/lib/http';
import { FontAwesome } from '@expo/vector-icons';
import { getSocket } from '@/lib/socket';

const STATUS_FLOW: Record<string, string> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; btnBg: string; btnLabel: string }> = {
  PENDING:   { bg: 'bg-amber-50',  text: 'text-amber-700',  btnBg: 'bg-blue-600',  btnLabel: 'Bắt Đầu Nấu' },
  PREPARING: { bg: 'bg-blue-50',   text: 'text-blue-700',   btnBg: 'bg-green-600', btnLabel: 'Hoàn Thành' },
};

// Hàm lấy timestamp từ MongoDB _id (nếu item không có created_at)
const getTimestampFromId = (id: string) => {
  if (!id || id.length < 8) return Date.now();
  return parseInt(id.substring(0, 8), 16) * 1000;
};

export function KDSFeature() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'TABLE' | 'ITEM'>('ITEM'); // Group by Table or Group by Item
  const [now, setNow] = useState(Date.now());

  const branchId = user?.branch_id;

  const fetchOrders = useCallback(async () => {
    if (!branchId) return setLoading(false);
    try {
      const res = await BookingService.getAllBookings({ branch_id: branchId });
      if (res.success) {
        const activeItems: any[] = [];
        (res.data || []).forEach((booking: any) => {
          if (booking.status === 'IN_USE' && booking.order_items) {
            booking.order_items.forEach((item: any) => {
              if (['PENDING', 'PREPARING'].includes(item.prep_status)) {
                activeItems.push({
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
        
        // Sort by created_at (oldest first)
        activeItems.sort((a, b) => a.created_at - b.created_at);
        setItems(activeItems);
      }
    } catch (error) {
      console.log('Error fetching KDS:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s auto refresh
    const timerInterval = setInterval(() => setNow(Date.now()), 60000); // Update timer every minute

    const socket = getSocket();
    if (socket && branchId) {
      // socket.emit('join_branch', branchId); is handled globally if needed
      socket.on('new_order_kitchen', () => {
        fetchOrders();
      });
    }

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
      if (socket) socket.off('new_order_kitchen');
    };
  }, [fetchOrders, branchId]);

  const updateStatus = async (bookingId: string, itemId: string, newStatus: string) => {
    try {
      // Optimistic update
      setItems(prev => prev.map(i => i._id === itemId ? { ...i, prep_status: newStatus } : i));
      
      await apiClient.patch(`/orders/${bookingId}/items/${itemId}/status`, {
        status: newStatus,
      });
      // Will refetch on next tick or socket event
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái');
      fetchOrders(); // Revert
    }
  };

  const updateGroupStatus = async (groupItems: any[], newStatus: string) => {
    // For grouped items, we update them sequentially or via Promise.all
    try {
      setItems(prev => prev.map(i => groupItems.some(gi => gi._id === i._id) ? { ...i, prep_status: newStatus } : i));
      
      await Promise.all(
        groupItems.map(item => 
          apiClient.patch(`/orders/${item.booking_id}/items/${item._id}/status`, { status: newStatus })
        )
      );
    } catch (error) {
      fetchOrders();
    }
  };

  // Tính SLA
  const getSLAColor = (createdAt: number) => {
    const diffMinutes = (now - createdAt) / 60000;
    if (diffMinutes > 20) return 'bg-red-500';
    if (diffMinutes > 10) return 'bg-amber-500';
    return 'bg-green-500';
  };
  
  const getSLAText = (createdAt: number) => {
    const diffMinutes = Math.floor((now - createdAt) / 60000);
    if (diffMinutes === 0) return 'Vừa xong';
    return `${diffMinutes} phút`;
  };

  // Nhóm theo tên món (Group by Item)
  const groupedByItem = items.reduce((acc: any, item: any) => {
    const key = `${item.name}_${item.prep_status}`;
    if (!acc[key]) {
      acc[key] = {
        name: item.name,
        prep_status: item.prep_status,
        total_quantity: 0,
        items: [],
        oldest_time: item.created_at
      };
    }
    acc[key].total_quantity += item.quantity;
    acc[key].items.push(item);
    if (item.created_at < acc[key].oldest_time) {
      acc[key].oldest_time = item.created_at;
    }
    return acc;
  }, {});

  const groupedArray = Object.values(groupedByItem).sort((a: any, b: any) => a.oldest_time - b.oldest_time);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-5 pt-5 pb-3 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="font-lexend font-bold text-xl text-gray-900 mb-1">Màn Hình Bếp (KDS)</Text>
          <Text className="font-lexend text-xs text-gray-500">
            {items.filter(i => i.prep_status === 'PENDING').length} chờ nấu • {items.filter(i => i.prep_status === 'PREPARING').length} đang nấu
          </Text>
        </View>
        <TouchableOpacity onPress={() => fetchOrders()} className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 items-center justify-center">
          <FontAwesome name="refresh" size={16} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-3 gap-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg border items-center ${viewMode === 'ITEM' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
          onPress={() => setViewMode('ITEM')}
        >
          <Text className={`font-lexend font-bold text-sm ${viewMode === 'ITEM' ? 'text-blue-700' : 'text-gray-600'}`}>Gom Theo Món</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-lg border items-center ${viewMode === 'TABLE' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
          onPress={() => setViewMode('TABLE')}
        >
          <Text className={`font-lexend font-bold text-sm ${viewMode === 'TABLE' ? 'text-blue-700' : 'text-gray-600'}`}>Theo Bàn</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'ITEM' ? (
        <FlatList
          data={groupedArray}
          keyExtractor={(item: any, idx) => `group_${idx}`}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
          renderItem={({ item: group }: any) => {
            const info = STATUS_COLORS[group.prep_status];
            const nextStatus = STATUS_FLOW[group.prep_status];
            
            return (
              <View className="bg-white rounded-xl mb-4 border border-gray-200 shadow-sm overflow-hidden">
                <View className="flex-row items-center border-b border-gray-100">
                  <View className={`w-2 h-full absolute left-0 ${getSLAColor(group.oldest_time)}`} />
                  <View className="flex-1 px-5 py-4 pl-6 flex-row justify-between items-center">
                    <View>
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-lexend font-bold text-lg text-gray-900">{group.name}</Text>
                        <View className={`px-2 py-0.5 rounded ${info.bg}`}>
                          <Text className={`font-lexend font-bold text-[10px] ${info.text}`}>{group.prep_status}</Text>
                        </View>
                      </View>
                      <Text className="font-lexend text-xs text-gray-500 flex-row items-center">
                        <FontAwesome name="clock-o" /> Chờ: {getSLAText(group.oldest_time)}
                      </Text>
                    </View>
                    <View className="items-center justify-center bg-blue-50 w-12 h-12 rounded-xl">
                      <Text className="font-lexend font-bold text-xl text-blue-700">x{group.total_quantity}</Text>
                    </View>
                  </View>
                </View>

                {/* Sub-items (Tables) */}
                <View className="bg-gray-50 px-5 py-3">
                  <Text className="font-lexend text-xs font-semibold text-gray-500 mb-2 uppercase">Chi tiết bàn</Text>
                  {group.items.map((subItem: any, idx: number) => (
                    <View key={subItem._id} className="flex-row justify-between items-center mb-2">
                      <Text className="font-lexend text-sm text-gray-700 font-medium">Bàn {subItem.table_name}</Text>
                      <Text className="font-lexend text-sm font-bold text-gray-900">x{subItem.quantity}</Text>
                    </View>
                  ))}
                </View>

                <View className="px-4 py-3 bg-white border-t border-gray-100">
                  {nextStatus && (
                    <TouchableOpacity
                      className={`${info.btnBg} py-3 rounded-xl items-center flex-row justify-center shadow-sm`}
                      onPress={() => updateGroupStatus(group.items, nextStatus)}
                    >
                      <Text className="font-lexend text-white text-sm font-bold">{info.btnLabel} ({group.total_quantity} phần)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="font-lexend text-gray-400 text-lg font-medium">Bếp đang trống! 🧑‍🍳</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
          renderItem={({ item }) => {
            const info = STATUS_COLORS[item.prep_status];
            const nextStatus = STATUS_FLOW[item.prep_status];
            
            return (
              <View className="bg-white rounded-xl mb-4 border border-gray-200 shadow-sm overflow-hidden flex-row">
                <View className={`w-2 h-full ${getSLAColor(item.created_at)}`} />
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
                  
                  <View className="flex-row justify-between items-center mt-3">
                    <View className="flex-row items-center gap-2">
                      <View className={`px-2 py-1 rounded ${info.bg}`}>
                        <Text className={`font-lexend font-bold text-[10px] ${info.text}`}>{item.prep_status}</Text>
                      </View>
                      <Text className="font-lexend text-xs text-gray-500">
                        <FontAwesome name="clock-o" /> {getSLAText(item.created_at)}
                      </Text>
                    </View>
                    
                    {nextStatus && (
                      <TouchableOpacity
                        className={`${info.btnBg} px-4 py-2 rounded-lg shadow-sm`}
                        onPress={() => updateStatus(item.booking_id, item._id, nextStatus)}
                      >
                        <Text className="font-lexend text-white text-xs font-bold">{info.btnLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Text className="font-lexend text-gray-400 text-lg font-medium">Bếp đang trống! 🧑‍🍳</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
