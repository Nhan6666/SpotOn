import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';
import apiClient from '@/lib/axios';

// prep_status colors from SCHEMA_DESIGN.md
const ITEM_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: 'bg-amber-100',  text: 'text-amber-700' },
  PREPARING: { bg: 'bg-blue-100',   text: 'text-blue-700' },
  READY:     { bg: 'bg-green-100',  text: 'text-green-700' },
  SERVED:    { bg: 'bg-gray-100',   text: 'text-gray-500' },
};

export function RunnerFeature() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const branchId = user?.branch_id;

  const fetchOrders = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    try {
      const res = await BookingService.getAllBookings({ branch_id: branchId });
      if (res.success) {
        const activeOrders: any[] = [];
        (res.data || []).forEach((booking: any) => {
          if (booking.order_items && booking.order_items.length > 0) {
            // Use correct field: prep_status (from schema)
            const readyItems = booking.order_items.filter(
              (item: any) => item.prep_status === 'READY' || item.prep_status === 'PREPARING'
            );
            if (readyItems.length > 0) {
              activeOrders.push({
                _id: booking._id,
                table_name: booking.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A',
                customer_name: booking.customer_id?.full_name || booking.walk_in_name || 'Walk-in',
                pendingItems: readyItems,
              });
            }
          }
        });
        setOrders(activeOrders);
      }
    } catch (error) {
      console.log('Error fetching runner data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const markAsServed = async (bookingId: string, itemId: string) => {
    try {
      await apiClient.patch(`/orders/${bookingId}/items/${itemId}/status`, {
        status: 'SERVED',
      });
      fetchOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  if (!branchId) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="font-lexend font-bold text-xl text-text mb-2">No Branch Assigned</Text>
        <Text className="font-lexend text-muted text-center">Contact your manager to assign you to a branch.</Text>
      </View>
    );
  }

  const readyCount = orders.reduce((sum, o) => sum + o.pendingItems.filter((i: any) => i.prep_status === 'READY').length, 0);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-6 pb-2">
        <Text className="font-lexend font-bold text-2xl text-text">Food Runner</Text>
        <Text className="font-lexend text-muted mt-1">
          {readyCount} items ready to serve
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={['#b45309']} />}
        renderItem={({ item: booking }) => (
          <View className="bg-white rounded-md mb-4 p-4 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-lexend font-bold text-text">
                Table: {booking.table_name}
              </Text>
              <Text className="font-lexend text-xs text-muted">
                {booking.customer_name}
              </Text>
            </View>

            {(booking.pendingItems || []).map((orderItem: any) => {
              const statusInfo = ITEM_STATUS_COLORS[orderItem.prep_status] || ITEM_STATUS_COLORS.PENDING;
              return (
                <View key={orderItem._id} className="flex-row justify-between items-center py-2 border-t border-gray-50">
                  <View className="flex-1">
                    <Text className="font-lexend font-semibold text-text">{orderItem.name}</Text>
                    <Text className="font-lexend text-xs text-muted">Qty: {orderItem.quantity}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${statusInfo.bg} mr-2`}>
                    <Text className={`text-xs font-lexend font-bold ${statusInfo.text}`}>{orderItem.prep_status}</Text>
                  </View>
                  {orderItem.prep_status === 'READY' && (
                    <TouchableOpacity
                      className="bg-green-600 px-3 py-1.5 rounded-md"
                      onPress={() => markAsServed(booking._id, orderItem._id)}
                    >
                      <Text className="font-lexend text-white text-xs font-bold">Served ✓</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="font-lexend text-muted text-lg">All clear! 🎉</Text>
            <Text className="font-lexend text-muted text-sm mt-1">No items waiting to be served</Text>
          </View>
        }
      />
    </View>
  );
}
