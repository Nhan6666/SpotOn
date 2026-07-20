import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/lib/http';

interface MenuItemFormModalProps {
  visible: boolean;
  menuId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  item?: any | null; // Pass item object if editing
}

export function MenuItemFormModal({ visible, menuId, onClose, onSuccess, item }: MenuItemFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!item;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    image_url: '',
    is_available: true,
    is_core_item: false,
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (visible && item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        base_price: item.base_price?.toString() || item.price?.toString() || '',
        image_url: item.image_url || '',
        is_available: item.is_available ?? true,
        is_core_item: item.is_core_item ?? false,
        status: item.status || 'ACTIVE'
      });
    } else if (visible && !item) {
      setFormData({
        name: '',
        description: '',
        base_price: '',
        image_url: '',
        is_available: true,
        is_core_item: false,
        status: 'ACTIVE'
      });
    }
  }, [visible, item]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!menuId) {
      Alert.alert('Lỗi', 'Không xác định được danh mục để thêm món ăn.');
      return;
    }

    if (!formData.name.trim() || !formData.base_price) {
      Alert.alert('Lỗi', 'Vui lòng nhập Tên món ăn và Giá bán.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        base_price: Number(formData.base_price) || 0,
        image_url: formData.image_url,
        is_available: formData.is_available,
        is_core_item: formData.is_core_item,
        status: formData.status
      };

      if (isEditing && item) {
        const res = await apiClient.put(`/menus/${menuId}/items/${item._id}`, payload);
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã cập nhật món ăn!');
          onSuccess();
          onClose();
        }
      } else {
        const res = await apiClient.post(`/menus/${menuId}/items`, payload);
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã thêm món ăn mới!');
          onSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Lỗi lưu món ăn:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu món ăn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <Text className="font-lexend font-bold text-lg text-text">
            {isEditing ? 'Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <FontAwesome name="times" size={20} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="mb-4">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Tên món ăn *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
              placeholder="Vd: Phở bò, Cà phê sữa..."
              value={formData.name}
              onChangeText={(txt) => handleChange('name', txt)}
            />
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Giá bán cơ bản (VND) *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
              placeholder="Vd: 35000"
              keyboardType="numeric"
              value={formData.base_price}
              onChangeText={(txt) => handleChange('base_price', txt)}
            />
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Mô tả món ăn</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
              placeholder="Thành phần, hương vị..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(txt) => handleChange('description', txt)}
            />
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Đường dẫn Hình ảnh (URL)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
              placeholder="https://..."
              value={formData.image_url}
              onChangeText={(txt) => handleChange('image_url', txt)}
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-50">
            <View>
              <Text className="font-lexend text-sm font-medium text-text">Sẵn sàng phục vụ</Text>
              <Text className="font-lexend text-xs text-gray-500">Cho phép gọi món này</Text>
            </View>
            <Switch
              value={formData.is_available}
              onValueChange={(val) => handleChange('is_available', val)}
              trackColor={{ false: '#e5e7eb', true: '#fcd34d' }}
              thumbColor={formData.is_available ? '#d97706' : '#f4f3f4'}
            />
          </View>

          <View className="flex-row items-center justify-between py-3 mb-6">
            <View>
              <Text className="font-lexend text-sm font-medium text-text">Món đặc trưng (Core Item)</Text>
              <Text className="font-lexend text-xs text-gray-500">Món ăn bắt buộc của toàn chuỗi</Text>
            </View>
            <Switch
              value={formData.is_core_item}
              onValueChange={(val) => handleChange('is_core_item', val)}
              trackColor={{ false: '#e5e7eb', true: '#fcd34d' }}
              thumbColor={formData.is_core_item ? '#d97706' : '#f4f3f4'}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity 
            className={`bg-amber-600 rounded-xl py-4 items-center justify-center flex-row shadow-sm ${loading ? 'opacity-70' : ''}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : null}
            <Text className="font-lexend font-bold text-white text-base">
              {isEditing ? 'Lưu thay đổi' : 'Xác nhận Thêm'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
