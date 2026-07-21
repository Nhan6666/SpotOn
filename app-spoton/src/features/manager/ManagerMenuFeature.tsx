import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView, Image } from 'react-native';
import apiClient from '@/lib/http';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

interface MenuItem {
  _id: string;
  name: string;
  sku: string;
  description: string;
  base_price: number;
  is_available: boolean;
  quantity: number;
  is_master: boolean;
  image_url: string;
}

interface MenuCategory {
  category_name: string;
  items: MenuItem[];
}

export function ManagerMenuFeature() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Modals
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Modal Data
  const [selectedItem, setSelectedItem] = useState<Partial<MenuItem> | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchMenus = useCallback(async () => {
    try {
      const res = await apiClient.get('/manager/menus');
      if (res.data?.data) {
        setCategories(res.data.data);
        if (res.data.data.length > 0 && !selectedCategory) {
          setSelectedCategory(res.data.data[0].category_name);
        }
      }
    } catch (error) {
      console.log('Error fetching menus:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Master Override
  const handleOpenOverride = (item: MenuItem) => {
    setSelectedItem(item);
    setFormData({
      is_available: item.is_available,
      quantity: Math.max(0, item.quantity),
    });
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async () => {
    if (!selectedItem) return;
    try {
      await apiClient.patch(`/manager/menus/master/${selectedItem._id}/override`, {
        is_available: formData.is_available,
        quantity: formData.quantity,
      });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái món MASTER');
      setShowOverrideModal(false);
      fetchMenus();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
    }
  };

  // Local Edit
  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      await apiClient.put(`/manager/menus/local/${selectedItem._id}`, formData);
      Alert.alert('Thành công', 'Đã cập nhật món LOCAL');
      setShowEditModal(false);
      fetchMenus();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
    }
  };

  // Local Delete
  const handleDeleteLocal = (itemId: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa món này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/manager/menus/local/${itemId}`);
          Alert.alert('Thành công', 'Đã xóa món LOCAL');
          fetchMenus();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể xóa');
        }
      }}
    ]);
  };

  // Local Add
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category_name: categories.length > 0 ? categories[0].category_name : '',
      description: '',
      base_price: 0,
      quantity: 0,
      is_available: true,
      image_url: ''
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = async () => {
    try {
      if (!formData.name || !formData.category_name || formData.base_price < 0 || formData.quantity < 0) {
        Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin hợp lệ');
        return;
      }
      
      const payload = { ...formData };
      await apiClient.post('/manager/menus/local', payload);
      Alert.alert('Thành công', 'Đã thêm món LOCAL mới');
      setShowAddModal(false);
      fetchMenus();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể thêm món');
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  const activeCategory = categories.find(c => c.category_name === selectedCategory);
  const displayItems = activeCategory ? activeCategory.items : [];

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="bg-white px-4 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={() => router.push(user?.role === 'ADMIN' ? '/admin-dashboard' : '/profile')}
          className="mr-3 w-8 h-8 items-center justify-center"
        >
          <FontAwesome name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-lexend font-bold text-xl text-gray-900 mb-1">Thực Đơn (Menu)</Text>
          <Text className="font-lexend text-xs text-gray-500">
            Quản lý số lượng và thêm món đặc trưng
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleOpenAdd}
          className="bg-orange-600 px-4 py-2.5 rounded-lg flex-row items-center ml-2 shadow-sm"
        >
          <FontAwesome name="plus" size={14} color="white" />
          <Text className="font-lexend font-bold text-white text-xs ml-1.5">Thêm Món</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Tabs */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.category_name;
            return (
              <TouchableOpacity
                key={cat.category_name}
                onPress={() => setSelectedCategory(cat.category_name)}
                className={`py-3.5 px-4 border-b-2 mr-2 ${isActive ? 'border-orange-600' : 'border-transparent'}`}
              >
                <Text className={`font-lexend text-sm font-semibold ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                  {cat.category_name} <Text className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{cat.items.length}</Text>
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Items List */}
      <FlatList
        data={displayItems}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMenus(); }} />}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm flex-row items-start">
            <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden mr-4">
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <FontAwesome name="picture-o" size={24} color="#9ca3af" />
                </View>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row justify-between items-start mb-1">
                <View className="flex-1 mr-2">
                  <Text className="font-lexend font-bold text-base text-gray-900">{item.name}</Text>
                  <Text className="font-lexend font-semibold text-sm text-gray-500 mt-0.5">{item.base_price.toLocaleString('vi-VN')} đ</Text>
                </View>
                {item.is_master ? (
                  <View className="bg-amber-100 px-2 py-1 rounded">
                    <Text className="font-lexend text-[10px] font-bold text-amber-700">MASTER</Text>
                  </View>
                ) : (
                  <View className="bg-blue-100 px-2 py-1 rounded">
                    <Text className="font-lexend text-[10px] font-bold text-blue-700">LOCAL</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-2 mt-2">
                <View className={`px-2 py-1 rounded flex-row items-center ${item.is_available && item.quantity > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <FontAwesome name={item.is_available && item.quantity > 0 ? 'check-circle' : 'times-circle'} size={12} color={item.is_available && item.quantity > 0 ? '#15803d' : '#b91c1c'} />
                  <Text className={`font-lexend font-bold text-[10px] ml-1 ${item.is_available && item.quantity > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {item.is_available && item.quantity > 0 ? 'Đang phục vụ' : 'Hết hàng / Tắt'}
                  </Text>
                </View>
                <Text className="font-lexend text-xs text-gray-500 font-medium">SL: {item.quantity}</Text>
              </View>

              <View className="flex-row gap-2 mt-3 justify-end border-t border-gray-100 pt-3">
                {item.is_master ? (
                  <TouchableOpacity
                    onPress={() => handleOpenOverride(item)}
                    className="flex-row items-center px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <FontAwesome name="power-off" size={12} color="#b45309" />
                    <Text className="font-lexend text-xs font-bold text-amber-700 ml-1.5">Số Lượng & Trạng Thái</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(item)}
                      className="flex-row items-center px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <FontAwesome name="edit" size={12} color="#1d4ed8" />
                      <Text className="font-lexend text-xs font-bold text-blue-700 ml-1.5">Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteLocal(item._id)}
                      className="flex-row items-center px-3 py-1.5 bg-red-50 rounded-lg border border-red-200"
                    >
                      <FontAwesome name="trash" size={12} color="#b91c1c" />
                      <Text className="font-lexend text-xs font-bold text-red-700 ml-1.5">Xóa</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="font-lexend text-gray-400 text-lg font-medium">Danh mục này chưa có món.</Text>
          </View>
        }
      />

      {/* MODALS */}
      {/* Override Modal */}
      <Modal visible={showOverrideModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <Text className="font-lexend font-bold text-lg text-gray-900 mb-1">Chỉnh Sửa Trạng Thái (MASTER)</Text>
            <Text className="font-lexend text-sm text-gray-500 mb-5">{selectedItem?.name}</Text>
            
            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-2">Số lượng tồn kho</Text>
              <TextInput
                value={String(formData.quantity)}
                onChangeText={t => setFormData({ ...formData, quantity: Number(t) })}
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
              />
            </View>
            
            <TouchableOpacity 
              onPress={() => setFormData({ ...formData, is_available: !formData.is_available })}
              className="flex-row items-center mb-6"
            >
              <FontAwesome name={formData.is_available ? 'check-square-o' : 'square-o'} size={24} color={formData.is_available ? '#ea580c' : '#9ca3af'} />
              <Text className="font-lexend text-sm text-gray-900 ml-3 font-medium">Cho phép bán món này</Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowOverrideModal(false)} className="flex-1 py-3 bg-gray-100 rounded-lg items-center">
                <Text className="font-lexend font-bold text-gray-600">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveOverride} className="flex-1 py-3 bg-orange-600 rounded-lg items-center">
                <Text className="font-lexend font-bold text-white">Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit/Add Local Modal */}
      <Modal visible={showEditModal || showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100 shadow-sm bg-white">
            <Text className="font-lexend font-bold text-lg text-gray-900">
              {showEditModal ? 'Sửa Món (LOCAL)' : 'Thêm Món Mới (LOCAL)'}
            </Text>
            <TouchableOpacity onPress={() => { setShowEditModal(false); setShowAddModal(false); }} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Tên món <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={formData.name}
                onChangeText={t => setFormData({ ...formData, name: t })}
                className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                placeholder="Nhập tên món ăn"
              />
            </View>

            {showAddModal && (
              <View className="mb-4">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Danh mục <Text className="text-red-500">*</Text></Text>
                {/* For simplicity on mobile, we can use a ScrollView of chips to select category */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                  {categories.map(c => (
                    <TouchableOpacity
                      key={c.category_name}
                      onPress={() => setFormData({ ...formData, category_name: c.category_name })}
                      className={`px-4 py-2 rounded-full mr-2 border ${formData.category_name === c.category_name ? 'bg-orange-50 border-orange-600' : 'border-gray-300'}`}
                    >
                      <Text className={`font-lexend text-sm ${formData.category_name === c.category_name ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>{c.category_name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Mô tả</Text>
              <TextInput
                value={formData.description}
                onChangeText={t => setFormData({ ...formData, description: t })}
                className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 h-24"
                placeholder="Mô tả món ăn"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={String(formData.base_price || 0)}
                  onChangeText={t => setFormData({ ...formData, base_price: Number(t) })}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Tồn kho <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={String(formData.quantity || 0)}
                  onChangeText={t => setFormData({ ...formData, quantity: Number(t) })}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Đường dẫn ảnh (URL)</Text>
              <TextInput
                value={formData.image_url}
                onChangeText={t => setFormData({ ...formData, image_url: t })}
                className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                placeholder="https://..."
              />
            </View>

            <TouchableOpacity 
              onPress={() => setFormData({ ...formData, is_available: !formData.is_available })}
              className="flex-row items-center mb-8"
            >
              <FontAwesome name={formData.is_available ? 'check-square-o' : 'square-o'} size={24} color={formData.is_available ? '#2563eb' : '#9ca3af'} />
              <Text className="font-lexend text-sm text-gray-900 ml-3 font-medium">Đang bán (Hiển thị cho khách)</Text>
            </TouchableOpacity>

          </ScrollView>
          <View className="p-5 border-t border-gray-100 bg-white">
            <TouchableOpacity 
              onPress={showEditModal ? handleSaveEdit : handleSaveAdd} 
              className="py-4 bg-blue-600 rounded-xl items-center"
            >
              <Text className="font-lexend font-bold text-white text-lg">Lưu Món Ăn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
