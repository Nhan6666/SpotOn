import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/lib/http';
import { CategoryFormModal } from './components/CategoryFormModal';
import { MenuItemFormModal } from './components/MenuItemFormModal';

export function AdminMenuFeature() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  // Modals state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

  const fetchMenuData = useCallback(async () => {
    try {
      // Fetch master menus (Admin-only)
      // /api/v1/menus/master returns paginated list of items with categories
      const res = await apiClient.get('/menus/master?limit=100');
      if (res.data?.success) {
        setCategories(res.data.data.categories || []);
        setItems(res.data.data.items || []);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách menu:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thực đơn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenuData();
  };

  // SectionList data format: [{ title: Category, data: [Items] }]
  const sections = useMemo(() => {
    return categories.map(cat => ({
      title: cat,
      data: items.filter(item => item.menu_id === cat._id)
    }));
  }, [categories, items]);

  // Actions for Category
  const openCreateCategory = () => {
    setSelectedCategory(null);
    setCategoryModalVisible(true);
  };

  const openEditCategory = (cat: any) => {
    setSelectedCategory(cat);
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = (cat: any) => {
    Alert.alert(
      "Xóa Danh Mục",
      `Bạn có chắc muốn xóa danh mục "${cat.category_name}" không? Toàn bộ món ăn bên trong có thể bị mất.`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/categories/${cat._id}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa danh mục');
                fetchMenuData();
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa danh mục');
            }
          }
        }
      ]
    );
  };

  // Actions for Item
  const openCreateItem = (menuId: string) => {
    setSelectedItem(null);
    setSelectedMenuId(menuId);
    setItemModalVisible(true);
  };

  const openEditItem = (item: any) => {
    setSelectedItem(item);
    setSelectedMenuId(item.menu_id);
    setItemModalVisible(true);
  };

  const handleDeleteItem = (item: any) => {
    Alert.alert(
      "Xóa Món Ăn",
      `Bạn có chắc muốn xóa món "${item.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/menus/${item.menu_id}/items/${item._id}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa món ăn');
                fetchMenuData();
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa món ăn');
            }
          }
        }
      ]
    );
  };

  const toggleItemVisibility = async (item: any) => {
    try {
      const res = await apiClient.patch(`/menus/${item.menu_id}/items/${item._id}/toggle-visibility`);
      if (res.data?.success) {
        fetchMenuData();
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      Alert.alert('Lỗi', 'Không thể đổi trạng thái hiển thị');
    }
  };

  const renderCategoryHeader = ({ section: { title } }: any) => (
    <View className="flex-row items-center justify-between bg-white px-4 py-3 mt-4 mb-2 shadow-sm border-y border-gray-100">
      <View className="flex-row items-center gap-2">
        <FontAwesome name="bookmark" size={16} color={Colors.primary} />
        <Text className="font-lexend font-bold text-base text-gray-800">{title.category_name}</Text>
        <View className="bg-gray-100 rounded-full px-2 py-0.5">
          <Text className="font-lexend text-xs text-gray-500">{title.item_count} món</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity onPress={() => openCreateItem(title._id)}>
          <FontAwesome name="plus-circle" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEditCategory(title)}>
          <FontAwesome name="edit" size={18} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteCategory(title)}>
          <FontAwesome name="trash" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: any) => {
    const defaultImage = 'https://placehold.co/200x200/f3f4f6/a1a1aa?text=No+Image';
    const isHidden = !item.is_available;

    return (
      <View className="bg-white mx-4 mb-3 rounded-xl p-3 shadow-sm border border-gray-100 flex-row gap-3">
        <Image 
          source={{ uri: item.image_url || defaultImage }} 
          className={`w-20 h-20 rounded-lg bg-gray-50 ${isHidden ? 'opacity-50' : ''}`}
        />
        <View className="flex-1 justify-center">
          <View className="flex-row items-start justify-between">
            <Text className="font-lexend font-bold text-gray-800 flex-1 mr-2" numberOfLines={2}>
              {item.name}
            </Text>
            {item.is_core_item && (
              <View className="bg-amber-100 px-1.5 py-0.5 rounded">
                <Text className="font-lexend text-[10px] text-amber-700 font-bold">CORE</Text>
              </View>
            )}
          </View>
          <Text className="font-lexend text-primary font-medium mt-1">
            {item.base_price.toLocaleString('vi-VN')} đ
          </Text>
          <Text className="font-lexend text-gray-400 text-xs mt-1" numberOfLines={1}>
            {item.description || 'Chưa có mô tả'}
          </Text>
        </View>
        
        {/* Actions for Item */}
        <View className="justify-between items-end border-l border-gray-100 pl-2 ml-1">
          <TouchableOpacity onPress={() => toggleItemVisibility(item)} className="p-1">
            <FontAwesome name={isHidden ? "eye-slash" : "eye"} size={16} color={isHidden ? Colors.muted : Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEditItem(item)} className="p-1">
            <FontAwesome name="edit" size={16} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteItem(item)} className="p-1">
            <FontAwesome name="trash" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderSectionHeader={renderCategoryHeader}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <FontAwesome name="list-alt" size={48} color="#e5e7eb" className="mb-4" />
            <Text className="font-lexend text-gray-400 text-center">Chưa có danh mục nào.</Text>
            <Text className="font-lexend text-gray-400 text-center text-xs mt-1">Bấm dấu + góc dưới để thêm.</Text>
          </View>
        }
      />

      {/* FAB to Add Category */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 w-14 h-14 bg-amber-600 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 4 }}
        onPress={openCreateCategory}
      >
        <FontAwesome name="plus" size={20} color="#fff" />
      </TouchableOpacity>

      <CategoryFormModal 
        visible={categoryModalVisible}
        category={selectedCategory}
        onClose={() => setCategoryModalVisible(false)}
        onSuccess={() => {
          setCategoryModalVisible(false);
          fetchMenuData();
        }}
      />

      <MenuItemFormModal 
        visible={itemModalVisible}
        menuId={selectedMenuId}
        item={selectedItem}
        onClose={() => setItemModalVisible(false)}
        onSuccess={() => {
          setItemModalVisible(false);
          fetchMenuData();
        }}
      />
    </View>
  );
}
