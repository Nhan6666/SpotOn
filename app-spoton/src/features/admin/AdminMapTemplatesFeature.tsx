import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';
import { useRouter } from 'expo-router';

interface Template {
  _id: string;
  name: string;
  description?: string;
  created_at: string;
}

export function AdminMapTemplatesFeature() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/map-templates');
      if (res.data?.success) {
        setTemplates(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching map templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveAdd = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên mẫu sơ đồ');
        return;
      }
      
      await apiClient.post('/map-templates', {
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      
      Alert.alert('Thành công', 'Đã tạo mẫu sơ đồ mới');
      setShowAddModal(false);
      fetchTemplates();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo mẫu');
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingTemplate || !formData.name.trim()) return;
      
      await apiClient.put(`/map-templates/${editingTemplate._id}`, {
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      
      Alert.alert('Thành công', 'Đã cập nhật mẫu sơ đồ');
      setShowEditModal(false);
      fetchTemplates();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
    }
  };

  const handleDelete = (templateId: string) => {
    Alert.alert('Xóa Mẫu', 'Bạn có chắc chắn muốn xóa mẫu sơ đồ này? Các chi nhánh đang dùng mẫu này sẽ bị ảnh hưởng.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/map-templates/${templateId}`);
          Alert.alert('Thành công', 'Đã xóa mẫu');
          fetchTemplates();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể xóa');
        }
      }}
    ]);
  };

  const openEditModal = (tpl: Template) => {
    setEditingTemplate(tpl);
    setFormData({ name: tpl.name, description: tpl.description || '' });
    setShowEditModal(true);
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-4 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <Text className="font-lexend font-bold text-lg text-gray-900">Mẫu Sơ đồ bàn</Text>
        <TouchableOpacity 
          onPress={() => {
            setFormData({ name: '', description: '' });
            setShowAddModal(true);
          }}
          className="bg-orange-600 px-3 py-2 rounded-lg flex-row items-center shadow-sm"
        >
          <FontAwesome name="plus" size={12} color="white" />
          <Text className="font-lexend font-bold text-white text-xs ml-1.5">Tạo mẫu mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#ea580c" /></View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
                  <FontAwesome name="th-large" size={16} color="#2563eb" />
                </View>
                <View>
                  <Text className="font-lexend font-bold text-base text-gray-900">{item.name}</Text>
                  <Text className="font-lexend text-xs text-gray-500 mt-0.5">
                    {item.description || 'Không có mô tả'}
                  </Text>
                </View>
              </View>

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity onPress={() => router.push(`/admin/map-editor/${item._id}` as any)} className="bg-emerald-50 px-3 py-1.5 rounded-lg flex-row items-center border border-emerald-100">
                    <FontAwesome name="map" size={12} color="#10b981" />
                    <Text className="font-lexend font-bold text-emerald-700 text-xs ml-1.5">Sửa sơ đồ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => openEditModal(item)} className="bg-blue-50 px-3 py-1.5 rounded-lg flex-row items-center border border-blue-100">
                    <FontAwesome name="pencil" size={12} color="#2563eb" />
                    <Text className="font-lexend font-bold text-blue-700 text-xs ml-1.5">Sửa Tên</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(item._id)} className="w-8 h-8 bg-red-50 rounded-full items-center justify-center border border-red-100 ml-auto">
                    <FontAwesome name="trash" size={14} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FontAwesome name="map-o" size={32} color="#d1d5db" />
              <Text className="font-lexend text-gray-500 mt-3">Chưa có mẫu sơ đồ nào.</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white w-full rounded-2xl p-5 shadow-lg">
            <Text className="font-lexend font-bold text-lg text-gray-900 mb-4">Tạo Mẫu Mới</Text>
            <TextInput
              value={formData.name}
              onChangeText={t => setFormData({ ...formData, name: t })}
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-3"
              placeholder="Tên mẫu (vd: Layout Nhà hàng 2 tầng)"
              autoFocus
            />
            <TextInput
              value={formData.description}
              onChangeText={t => setFormData({ ...formData, description: t })}
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-6"
              placeholder="Mô tả ngắn"
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
            <Text className="font-lexend font-bold text-lg text-gray-900 mb-4">Sửa Mẫu Sơ Đồ</Text>
            <TextInput
              value={formData.name}
              onChangeText={t => setFormData({ ...formData, name: t })}
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-3"
              placeholder="Tên mẫu"
              autoFocus
            />
            <TextInput
              value={formData.description}
              onChangeText={t => setFormData({ ...formData, description: t })}
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-6"
              placeholder="Mô tả ngắn"
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

    </View>
  );
}
