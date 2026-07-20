import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, ScrollView } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';
import apiClient from '@/lib/http';
import { FontAwesome } from '@expo/vector-icons';

export function POSFeature() {
  const { user } = useAuthStore();
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Menu & Ordering state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, any>>({});
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const branchId = user?.branch_id;

  const fetchActiveTables = useCallback(async () => {
    if (!branchId) return setLoading(false);
    try {
      const res = await BookingService.getAllBookings({ branch_id: branchId });
      if (res.success) {
        const inUse = (res.data || []).filter((b: any) => b.status === 'IN_USE');
        setActiveBookings(inUse);
      }
    } catch (error) {
      console.log('Error fetching POS tables:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchActiveTables();
    const interval = setInterval(fetchActiveTables, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveTables]);

  const fetchMenu = async () => {
    if (!branchId) return;
    try {
      const res = await apiClient.get(`/menus/public/branch/${branchId}`);
      if (res.data?.success) {
        const allItems: any[] = [];
        (res.data.data || []).forEach((category: any) => {
          (category.items || []).forEach((item: any) => {
            allItems.push({ ...item, category_name: category.name });
          });
        });
        setMenuItems(allItems);
      }
    } catch (error) {
      console.log('Error fetching menu:', error);
    }
  };

  const handleTablePress = (booking: any) => {
    setSelectedBooking(booking);
    setCart({});
    if (menuItems.length === 0) fetchMenu();
    setShowOrderModal(true);
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev[item._id];
      if (existing) {
        return { ...prev, [item._id]: { ...existing, quantity: existing.quantity + 1 } };
      }
      return { 
        ...prev, 
        [item._id]: { 
          menu_item_id: item._id, 
          name: item.name, 
          price_at_time: item.price, 
          quantity: 1,
          type: 'ADDITIONAL'
        } 
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
      }
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  };

  const submitOrder = async () => {
    const itemsToOrder = Object.values(cart);
    if (itemsToOrder.length === 0) return;

    setSubmittingOrder(true);
    try {
      const res = await apiClient.post(`/orders/${selectedBooking._id}/items`, {
        items: itemsToOrder
      });
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã gửi order xuống bếp!');
        setShowOrderModal(false);
        setCart({});
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gọi thêm món.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const totalCartValue = Object.values(cart).reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
  const totalCartItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-5 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="font-lexend font-bold text-xl text-gray-900 mb-1">POS (Order Bổ Sung)</Text>
          <Text className="font-lexend text-xs text-gray-500 font-medium">
            Chọn bàn đang có khách để gọi thêm món
          </Text>
        </View>
        <TouchableOpacity onPress={() => fetchActiveTables()} className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 items-center justify-center">
          <FontAwesome name="refresh" size={16} color="#4b5563" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeBookings}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchActiveTables(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-1 m-2 bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-sm items-center justify-center min-h-[140px]"
            onPress={() => handleTablePress(item)}
          >
            <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-2">
              <FontAwesome name="cutlery" size={20} color="#1d4ed8" />
            </View>
            <Text className="font-lexend font-bold text-xl text-blue-900">
              {item.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A'}
            </Text>
            <Text className="font-lexend text-xs text-blue-700 mt-1 text-center" numberOfLines={1}>
              {item.customer_id?.full_name || item.walk_in_name || 'Khách vãng lai'}
            </Text>
            <Text className="font-lexend text-[10px] text-blue-600 mt-1 font-bold bg-blue-200/50 px-2 py-0.5 rounded-full">
              {item.guest_count} khách
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="font-lexend text-gray-400 text-lg font-medium">Hiện không có bàn nào đang phục vụ.</Text>
          </View>
        }
      />

      {/* Order Modal */}
      <Modal visible={showOrderModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 shadow-sm bg-white">
            <View className="flex-1">
              <Text className="font-lexend font-bold text-lg text-gray-900">Gọi Thêm Món</Text>
              <Text className="font-lexend text-xs text-gray-500">
                Bàn {selectedBooking?.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowOrderModal(false)} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* Menu List */}
          <FlatList
            data={menuItems}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            renderItem={({ item }) => {
              const qty = cart[item._id]?.quantity || 0;
              return (
                <View className="flex-row items-center justify-between bg-white border border-gray-100 p-3 mb-3 rounded-xl shadow-sm">
                  <View className="flex-1 mr-3">
                    <Text className="font-lexend font-bold text-gray-900 text-base">{item.name}</Text>
                    <Text className="font-lexend text-blue-600 font-medium text-sm mt-0.5">
                      {item.price.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                  
                  {qty > 0 ? (
                    <View className="flex-row items-center bg-blue-50 rounded-lg border border-blue-200">
                      <TouchableOpacity onPress={() => removeFromCart(item._id)} className="px-3 py-2">
                        <FontAwesome name="minus" size={14} color="#1d4ed8" />
                      </TouchableOpacity>
                      <Text className="font-lexend font-bold text-blue-900 px-2">{qty}</Text>
                      <TouchableOpacity onPress={() => addToCart(item)} className="px-3 py-2">
                        <FontAwesome name="plus" size={14} color="#1d4ed8" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => addToCart(item)} className="bg-blue-600 px-4 py-2.5 rounded-lg">
                      <Text className="font-lexend font-bold text-white text-xs">THÊM</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />

          {/* Cart Footer */}
          {totalCartItems > 0 && (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-lexend font-medium text-gray-600">Đã chọn: <Text className="font-bold text-gray-900">{totalCartItems} món</Text></Text>
                <Text className="font-lexend font-bold text-xl text-blue-700">{totalCartValue.toLocaleString('vi-VN')}đ</Text>
              </View>
              <TouchableOpacity 
                className="bg-blue-600 rounded-xl py-3.5 flex-row justify-center items-center"
                onPress={submitOrder}
                disabled={submittingOrder}
              >
                {submittingOrder ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FontAwesome name="send" size={14} color="white" />
                    <Text className="font-lexend font-bold text-white text-base ml-2">Gửi Order Xuống Bếp</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
