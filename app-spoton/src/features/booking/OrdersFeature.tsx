import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { OrderService } from './order.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { io, Socket } from 'socket.io-client';

export function OrdersFeature() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchOrders();

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.10.100.205:5000/api/v1';
    const newSocket = io(apiUrl.replace('/api/v1', ''));
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user?.branch_id) {
      socket.emit('join_branch', user.branch_id);
      
      socket.on('order_status_changed', (data) => {
        setOrders(prev => prev.map(order => {
          if (order._id === data.bookingId) {
            return {
              ...order,
              order_items: order.order_items.map((item: any) => 
                item._id === data.itemId ? { ...item, prep_status: data.newStatus } : item
              )
            };
          }
          return order;
        }));
      });
    }
  }, [socket, user]);

  const fetchOrders = async () => {
    try {
      const data = await OrderService.getBookings();
      if (data.success) {
        // Filter bookings that are IN_USE and have order_items
        const activeBookings = data.data.filter((b: any) => 
          ['IN_USE', 'CONFIRMED'].includes(b.status) && b.order_items && b.order_items.length > 0
        );
        setOrders(activeBookings);
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700';
      case 'PREPARING': return 'bg-yellow-100 text-yellow-700';
      case 'READY': return 'bg-green-100 text-green-700';
      case 'SERVED': return 'bg-blue-100 text-blue-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleItemPress = (bookingId: string, item: any) => {
    // Waiter Logic: Waiter should only update READY -> SERVED.
    // Kitchen updates PENDING -> PREPARING -> READY.
    // But for Manager, they can override anything. We assume role logic here:
    
    let allowedTransitions: any[] = [];
    
    if (user?.role === 'WAITER') {
      if (item.prep_status === 'READY') allowedTransitions = ['SERVED'];
      else {
        Alert.alert('Info', `Item is currently ${item.prep_status}. Waiting for Kitchen to mark READY.`);
        return;
      }
    } else if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      if (item.prep_status === 'PENDING') allowedTransitions = ['PREPARING', 'CANCELLED'];
      else if (item.prep_status === 'PREPARING') allowedTransitions = ['READY', 'PENDING'];
      else if (item.prep_status === 'READY') allowedTransitions = ['SERVED', 'PREPARING'];
    }

    if (allowedTransitions.length === 0) return;

    Alert.alert(
      "Update Item Status",
      `Current: ${item.prep_status}`,
      [
        { text: "Cancel", style: "cancel" },
        ...allowedTransitions.map(status => ({
          text: `Mark as ${status}`,
          onPress: async () => {
            try {
              await OrderService.updateItemStatus(bookingId, item._id, status);
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to update status');
            }
          }
        }))
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  // Flatten active order items to render
  const flatOrderItems = orders.flatMap(order => 
    order.order_items.map((item: any) => ({
      ...item,
      bookingId: order._id,
      tableName: order.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A',
      bookingStatus: order.status
    }))
  ).filter(item => item.prep_status !== 'SERVED' && item.prep_status !== 'CANCELLED'); // Hide served items

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      {flatOrderItems.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="font-lexend text-muted text-lg">No active orders</Text>
        </View>
      ) : (
        <FlatList
          data={flatOrderItems}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const statusClasses = getStatusColor(item.prep_status).split(' ');
            const bgClass = statusClasses[0];
            const textClass = statusClasses[1];
            return (
              <TouchableOpacity 
                onPress={() => handleItemPress(item.bookingId, item)}
                className="bg-white rounded-md mb-4 p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1 pr-4">
                    <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-primary font-lexend font-bold text-xs text-center">{item.tableName}</Text>
                    </View>
                    <View>
                      <Text className="font-lexend font-bold text-text text-lg">{item.quantity}x {item.name || 'Item'}</Text>
                      {item.notes ? (
                        <Text className="font-lexend text-muted text-xs">Note: {item.notes}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded-md ${bgClass}`}>
                    <Text className={`font-lexend font-bold text-xs ${textClass}`}>
                      {item.prep_status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
