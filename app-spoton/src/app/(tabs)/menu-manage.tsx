import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/axios';

export default function MenuManageScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  // State cho Modal cập nhật
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editAvailable, setEditAvailable] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/manager/menus');
      if (res.data.success) {
        const cats = res.data.data || [];
        setCategories(cats);
        if (cats.length > 0 && !activeTab) {
          setActiveTab(cats[0].category_name);
        }
      }
    } catch (error) {
      console.error('Error fetching manager menus:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thực đơn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateItem = async (item: any, is_available: boolean, quantity: number) => {
    try {
      if (item.is_master) {
        await apiClient.patch(`/manager/menus/master/${item._id}/override`, {
          is_available,
          quantity
        });
      } else {
        await apiClient.put(`/manager/menus/local/${item._id}`, {
          is_available,
          quantity
        });
      }
      // Update local state instead of refetching for performance
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map((i: any) => i._id === item._id ? { ...i, is_available, quantity } : i)
      })));
    } catch (error) {
      console.error('Error updating menu item:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái món');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const qty = parseInt(editQuantity) || 0;
    await handleUpdateItem(editingItem, editAvailable, qty);
    setEditingItem(null);
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-[#F9FAFB] justify-center items-center">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  const activeCategory = categories.find(c => c.category_name === activeTab);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="bg-white pt-4 pb-0 shadow-sm z-10 border-b border-gray-100">
        <View className="flex-row items-center justify-between px-4 mb-4">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 rounded-full items-center justify-center bg-gray-50">
              <FontAwesome name="arrow-left" size={16} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text className="font-lexend font-bold text-lg text-text">Quản Lý Thực Đơn</Text>
              <Text className="font-lexend text-[10px] text-gray-500">Quản lý số lượng và thêm món đặc trưng</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-[#ea580c] flex-row items-center px-3 py-2 rounded-lg">
            <FontAwesome name="plus" size={12} color="white" />
            <Text className="font-lexend text-white font-bold text-xs ml-1.5">Thêm Món (Local)</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-t border-gray-100 flex-row">
          <View className="flex-row px-2">
            {categories.map((cat, idx) => (
              <TouchableOpacity 
                key={idx}
                onPress={() => setActiveTab(cat.category_name)}
                className={`px-4 py-3 border-b-2 ${activeTab === cat.category_name ? 'border-[#ea580c]' : 'border-transparent'}`}
              >
                <Text className={`font-lexend text-sm ${activeTab === cat.category_name ? 'text-[#ea580c] font-bold' : 'text-gray-500 font-medium'}`}>
                  {cat.category_name} <Text className="text-gray-400 text-xs font-normal ml-1">{cat.items.length}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {!activeCategory || activeCategory.items.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="font-lexend text-muted">Không có món nào trong danh mục này.</Text>
          </View>
        ) : (
          activeCategory.items.map((item: any) => (
            <View key={item._id} className="bg-white rounded-xl p-3 mb-4 border border-gray-100 shadow-sm flex-row">
              {/* Ảnh */}
              <View className="w-20 h-20 bg-gray-100 rounded-lg mr-3 overflow-hidden border border-gray-200">
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center bg-[#14532d]">
                    <Text className="font-lexend font-bold text-white text-xs text-center px-1" numberOfLines={2}>{item.name}</Text>
                  </View>
                )}
              </View>

              {/* Thông tin */}
              <View className="flex-1 justify-between">
                <View>
                  <View className="flex-row items-center flex-wrap">
                    <Text className="font-lexend font-bold text-text text-sm mr-2 uppercase">{item.name}</Text>
                    <View className={`px-1.5 py-0.5 rounded border ${item.is_master ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                      <Text className={`text-[8px] font-lexend font-bold uppercase ${item.is_master ? 'text-yellow-700' : 'text-green-700'}`}>
                        {item.is_master ? 'MASTER' : 'LOCAL'}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-lexend text-gray-500 text-sm mt-1">{item.base_price?.toLocaleString('vi-VN')} đ</Text>
                </View>

                <View className="flex-row items-center mt-2">
                  <View className={`px-2 py-1 rounded mr-3 ${item.is_available ? 'bg-green-100' : 'bg-red-50'}`}>
                    <Text className={`font-lexend font-bold text-xs ${item.is_available ? 'text-green-700' : 'text-red-600'}`}>
                      {item.is_available ? 'Đang phục vụ' : 'Hết hàng / Tắt'}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <FontAwesome name="cubes" size={12} color="#9ca3af" />
                    <Text className="font-lexend text-xs text-gray-500 ml-1.5">Số lượng: {item.quantity}</Text>
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <View className="justify-start ml-2">
                <TouchableOpacity 
                  onPress={() => {
                    setEditingItem(item);
                    setEditQuantity(item.quantity?.toString() || '0');
                    setEditAvailable(item.is_available);
                  }}
                  className="bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg flex-row items-center"
                >
                  <FontAwesome name="power-off" size={10} color="#ca8a04" />
                  <Text className="font-lexend font-bold text-[10px] text-yellow-700 ml-1.5">Trạng Thái</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white w-full rounded-2xl p-5">
            <Text className="font-lexend font-bold text-lg text-text mb-1">Cập nhật món</Text>
            <Text className="font-lexend text-sm text-gray-500 mb-5">{editingItem?.name}</Text>
            
            <View className="flex-row justify-between items-center mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <Text className="font-lexend font-medium text-text">Trạng thái bán</Text>
              <TouchableOpacity 
                onPress={() => setEditAvailable(!editAvailable)}
                className={`px-4 py-2 rounded-lg ${editAvailable ? 'bg-green-100 border border-green-200' : 'bg-red-50 border border-red-100'}`}
              >
                <Text className={`font-lexend font-bold text-sm ${editAvailable ? 'text-green-700' : 'text-red-600'}`}>
                  {editAvailable ? 'ĐANG BÁN' : 'TẠM TẮT'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="font-lexend font-medium text-text mb-2">Số lượng dự kiến trong ngày</Text>
              <TextInput
                value={editQuantity}
                onChangeText={setEditQuantity}
                keyboardType="numeric"
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 font-lexend text-base text-text"
                placeholder="Nhập số lượng..."
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setEditingItem(null)} 
                className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
              >
                <Text className="font-lexend font-bold text-gray-700">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveEdit} 
                className="flex-1 py-3 bg-[#ea580c] rounded-xl items-center shadow-sm"
              >
                <Text className="font-lexend font-bold text-white">Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
