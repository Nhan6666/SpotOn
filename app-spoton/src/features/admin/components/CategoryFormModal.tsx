import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/lib/http';

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any | null; // Pass category object if editing
}

export function CategoryFormModal({ visible, onClose, onSuccess, category }: CategoryFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  
  const isEditing = !!category;

  useEffect(() => {
    if (visible && category) {
      setCategoryName(category.category_name || '');
    } else if (visible && !category) {
      setCategoryName('');
    }
  }, [visible, category]);

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục.');
      return;
    }

    try {
      setLoading(true);
      const payload = { category_name: categoryName };

      if (isEditing && category) {
        const res = await apiClient.put(`/categories/${category._id}`, payload);
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã cập nhật danh mục!');
          onSuccess();
          onClose();
        }
      } else {
        const res = await apiClient.post('/categories', payload);
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã thêm danh mục mới!');
          onSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Lỗi lưu danh mục:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu danh mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white w-full rounded-2xl overflow-hidden shadow-xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Text className="font-lexend font-bold text-lg text-text">
              {isEditing ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
              <FontAwesome name="times" size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="p-5">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Tên danh mục *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-lexend text-text"
              placeholder="Vd: Món khai vị, Đồ uống..."
              value={categoryName}
              onChangeText={setCategoryName}
              autoFocus
            />
          </View>

          {/* Footer */}
          <View className="p-5 pt-0 flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 bg-gray-100 rounded-xl py-3.5 items-center justify-center"
              onPress={onClose}
              disabled={loading}
            >
              <Text className="font-lexend font-medium text-gray-600">Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 bg-amber-600 rounded-xl py-3.5 items-center justify-center flex-row shadow-sm ${loading ? 'opacity-70' : ''}`}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
              <Text className="font-lexend font-bold text-white">
                {isEditing ? 'Lưu thay đổi' : 'Xác nhận Thêm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
