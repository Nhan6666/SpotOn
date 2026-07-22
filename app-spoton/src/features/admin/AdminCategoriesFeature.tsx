import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';

interface Branch {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  category_name: string;
  branch_id?: string;
  items?: any[];
}

export function AdminCategoriesFeature() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  
  const [formData, setFormData] = useState({ category_name: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Fetch branches on mount
  useEffect(() => {
    apiClient.get('/branches').then(res => {
      if (res.data?.success && res.data.data.length > 0) {
        setBranches(res.data.data);
        setSelectedBranch(res.data.data[0]._id); // Select first branch by default
      }
    }).catch(err => console.log('Error fetching branches:', err));
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/categories?branch_id=${selectedBranch}`);
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      fetchCategories();
    }
  }, [selectedBranch, fetchCategories]);

  const handleSaveAdd = async () => {
    try {
      if (!formData.category_name.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
        return;
      }
      
      await apiClient.post('/categories', {
        category_name: formData.category_name.trim(),
        branch_id: selectedBranch
      });
      
      Alert.alert('Thành công', 'Đã tạo danh mục mới');
      setShowAddModal(false);
      fetchCategories();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo danh mục');
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingCategory || !formData.category_name.trim()) return;
      
      await apiClient.put(`/categories/${editingCategory._id}`, {
        category_name: formData.category_name.trim()
      });
      
      Alert.alert('Thành công', 'Đã cập nhật tên danh mục');
      setShowEditModal(false);
      fetchCategories();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
    }
  };

  const handleDelete = (categoryId: string) => {
    Alert.alert('Xóa Danh mục', 'Bạn có chắc chắn muốn xóa danh mục này? Không thể khôi phục.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/categories/${categoryId}`);
          Alert.alert('Thành công', 'Đã xóa danh mục');
          fetchCategories();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể xóa (có thể danh mục đang chứa món ăn)');
        }
      }}
    ]);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ category_name: cat.category_name });
    setShowEditModal(true);
  };

  const selectedBranchName = branches.find(b => b._id === selectedBranch)?.name || 'Đang tải...';

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-4 pt-5 pb-3 shadow-sm z-10 border-b border-gray-100">
        <Text className="font-lexend text-xs text-gray-500 mb-1">Chi nhánh đang chọn</Text>
        <TouchableOpacity 
          onPress={() => setShowBranchSelect(true)}
          className="flex-row justify-between items-center bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
        >
          <View className="flex-row items-center">
            <FontAwesome name="map-marker" size={14} color="#ea580c" style={{ marginRight: 8 }} />
            <Text className="font-lexend font-bold text-gray-900">{selectedBranchName}</Text>
          </View>
          <FontAwesome name="chevron-down" size={12} color="#9ca3af" />
        </TouchableOpacity>

        <View className="flex-row justify-between items-center">
          <Text className="font-lexend font-bold text-lg text-gray-900">Danh sách Danh mục</Text>
          <TouchableOpacity 
            onPress={() => {
              setFormData({ category_name: '' });
              setShowAddModal(true);
            }}
            className="bg-orange-600 px-3 py-2 rounded-lg flex-row items-center shadow-sm"
          >
            <FontAwesome name="plus" size={12} color="white" />
            <Text className="font-lexend font-bold text-white text-xs ml-1.5">Thêm danh mục</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#ea580c" /></View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-orange-50 rounded-lg items-center justify-center mr-3">
                  <FontAwesome name="tag" size={16} color="#ea580c" />
                </View>
                <View>
                  <Text className="font-lexend font-bold text-base text-gray-900">{item.category_name}</Text>
                  <Text className="font-lexend text-xs text-gray-500 mt-0.5">
                    {item.items?.length || 0} món ăn
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => openEditModal(item)} className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center">
                  <FontAwesome name="pencil" size={14} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)} className="w-8 h-8 bg-red-50 rounded-full items-center justify-center">
                  <FontAwesome name="trash" size={14} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FontAwesome name="folder-open-o" size={32} color="#d1d5db" />
              <Text className="font-lexend text-gray-500 mt-3">Chưa có danh mục nào.</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white w-full rounded-2xl p-5 shadow-lg">
            <Text className="font-lexend font-bold text-lg text-gray-900 mb-4">Thêm Danh Mục Mới</Text>
            <Text className="font-lexend text-sm text-gray-600 mb-2">Tên danh mục (vd: Khai vị, Món chính...)</Text>
            <TextInput
              value={formData.category_name}
              onChangeText={t => setFormData({ category_name: t })}
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-6"
              placeholder="Nhập tên danh mục"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl items-center">
                <Text className="font-lexend font-bold text-gray-700">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveAdd} className="flex-1 py-3 bg-orange-600 rounded-xl items-center shadow-sm">
                <Text className="font-lexend font-bold text-white">Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white w-full rounded-2xl p-5 shadow-lg">
            <Text className="font-lexend font-bold text-lg text-gray-900 mb-4">Sửa Tên Danh Mục</Text>
            <TextInput
              value={formData.category_name}
              onChangeText={t => setFormData({ category_name: t })}
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-6"
              placeholder="Nhập tên danh mục mới"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl items-center">
                <Text className="font-lexend font-bold text-gray-700">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEdit} className="flex-1 py-3 bg-blue-600 rounded-xl items-center shadow-sm">
                <Text className="font-lexend font-bold text-white">Cập Nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Branch Select Modal */}
      <Modal visible={showBranchSelect} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-lexend font-bold text-lg text-gray-900">Chọn Chi Nhánh</Text>
              <TouchableOpacity onPress={() => setShowBranchSelect(false)} className="p-2">
                <FontAwesome name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {branches.map(branch => (
                <TouchableOpacity 
                  key={branch._id}
                  onPress={() => {
                    setSelectedBranch(branch._id);
                    setShowBranchSelect(false);
                  }}
                  className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${selectedBranch === branch._id ? 'bg-orange-50 px-2 rounded-lg border-b-0' : ''}`}
                >
                  <Text className={`font-lexend ${selectedBranch === branch._id ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
                    {branch.name}
                  </Text>
                  {selectedBranch === branch._id && <FontAwesome name="check" size={14} color="#ea580c" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
