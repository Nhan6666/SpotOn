import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';

// prep_status flow from SCHEMA_DESIGN.md: PENDING → PREPARING → READY → SERVED
const STATUS_FLOW: Record<string, string> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; btnBg: string; btnLabel: string }> = {
  PENDING:   { bg: 'bg-amber-50',  text: 'text-amber-700',  btnBg: 'bg-blue-600',  btnLabel: 'Start Cooking' },
  PREPARING: { bg: 'bg-blue-50',   text: 'text-blue-700',   btnBg: 'bg-green-600', btnLabel: 'Mark Ready' },
  READY:     { bg: 'bg-green-50',  text: 'text-green-700',  btnBg: '',             btnLabel: '' },
  SERVED:    { bg: 'bg-gray-50',   text: 'text-gray-500',   btnBg: '',             btnLabel: '' },
};

export function KDSFeature() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PREPARING'>('ALL');

  const branchId = user?.branch_id;

  const fetchOrders = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    try {
      const res = await BookingService.getAllBookings({ branch_id: branchId });
      if (res.success) {
        const kitchenOrders: any[] = [];
        (res.data || []).forEach((booking: any) => {
          if (booking.order_items && booking.order_items.length > 0) {
            // Use correct field: prep_status (from schema)
            const cookItems = booking.order_items.filter(
              (item: any) => item.prep_status === 'PENDING' || item.prep_status === 'PREPARING'
            );
            if (cookItems.length > 0) {
              kitchenOrders.push({
                _id: booking._id,
                table_name: booking.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A',
                walk_in_name: booking.walk_in_name,
                customer_name: booking.customer_id?.full_name,
                cookItems,
              });
            }
          }
        });
        setOrders(kitchenOrders);
      }
    } catch (error) {
      console.log('Error fetching KDS data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateItemStatus = async (bookingId: string, itemId: string, newStatus: string) => {
    try {
      const apiClient = (await import('@/lib/axios')).default;
      await apiClient.patch(`/orders/${bookingId}/items/${itemId}/status`, {
        status: newStatus,
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

  const filteredOrders = orders.map(order => ({
    ...order,
    cookItems: order.cookItems.filter((item: any) => filter === 'ALL' || item.prep_status === filter),
  })).filter(order => order.cookItems.length > 0);

  // Count items by status
  const pendingCount = orders.reduce((sum, o) => sum + o.cookItems.filter((i: any) => i.prep_status === 'PENDING').length, 0);
  const preparingCount = orders.reduce((sum, o) => sum + o.cookItems.filter((i: any) => i.prep_status === 'PREPARING').length, 0);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-6 pb-2">
        <Text className="font-lexend font-bold text-2xl text-text">Kitchen Display</Text>
        <Text className="font-lexend text-muted mt-1">
          {pendingCount} pending • {preparingCount} cooking
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-4 py-2 gap-2">
        {([
          { key: 'ALL' as const, label: 'All' },
          { key: 'PENDING' as const, label: `Pending (${pendingCount})` },
          { key: 'PREPARING' as const, label: `Cooking (${preparingCount})` },
        ]).map((f) => (
          <TouchableOpacity
            key={f.key}
            className={`px-4 py-2 rounded-full ${filter === f.key ? 'bg-amber-700' : 'bg-gray-200'}`}
            onPress={() => setFilter(f.key)}
          >
            <Text className={`font-lexend text-sm font-semibold ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={['#b45309']} />}
        renderItem={({ item: booking }) => (
          <View className="bg-white rounded-md mb-4 border border-gray-100 shadow-sm overflow-hidden">
            <View className="bg-gray-50 px-4 py-3 flex-row justify-between items-center">
              <Text className="font-lexend font-bold text-text">
                Table: {booking.table_name}
              </Text>
              <Text className="font-lexend text-xs text-muted">
                {booking.customer_name || booking.walk_in_name || 'Walk-in'}
              </Text>
            </View>

            {(booking.cookItems || []).map((orderItem: any) => {
              const info = STATUS_COLORS[orderItem.prep_status] || STATUS_COLORS.PENDING;
              const nextStatus = STATUS_FLOW[orderItem.prep_status];
              return (
                <View key={orderItem._id} className={`flex-row justify-between items-center px-4 py-3 border-t border-gray-50 ${info.bg}`}>
                  <View className="flex-1">
                    <Text className="font-lexend font-semibold text-text">{orderItem.name}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="font-lexend text-xs text-muted">Qty: {orderItem.quantity}</Text>
                      <View className={`px-2 py-0.5 rounded-full ${info.bg}`}>
                        <Text className={`text-xs font-lexend font-bold ${info.text}`}>{orderItem.prep_status}</Text>
                      </View>
                      {orderItem.type === 'ADDITIONAL' && (
                        <View className="px-2 py-0.5 rounded-full bg-orange-100">
                          <Text className="text-xs font-lexend font-bold text-orange-700">ADD</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {nextStatus && (
                    <TouchableOpacity
                      className={`${info.btnBg} px-3 py-2 rounded-md`}
                      onPress={() => updateItemStatus(booking._id, orderItem._id, nextStatus)}
                    >
                      <Text className="font-lexend text-white text-xs font-bold">{info.btnLabel}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="font-lexend text-muted text-lg">Kitchen is clear! 🧑‍🍳</Text>
            <Text className="font-lexend text-muted text-sm mt-1">No pending orders right now</Text>
          </View>
        }
      />
    </View>
  );
}
