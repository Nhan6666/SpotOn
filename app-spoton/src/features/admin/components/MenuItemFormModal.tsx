import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/lib/http';
import * as ImagePicker from 'expo-image-picker';

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
  
  // States for new image
  const [imageUri, setImageUri] = useState<string | null>(null);

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
      setImageUri(item.image_url || null);
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
      setImageUri(null);
    }
  }, [visible, item]);

  const handleChange = (field: string, value: any) => {
    if (field === 'base_price') {
      // Chỉ cho phép nhập số (loại bỏ tất cả ký tự không phải số)
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để upload hình.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadMenuImage = async (localUri: string): Promise<string | null> => {
    if (!localUri || localUri.startsWith('http')) return localUri; // Already uploaded

    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;

    const form = new FormData();
    form.append('image', {
      uri: localUri,
      name: filename,
      type
    } as any);

    try {
      const res = await apiClient.post(`/uploads/menu`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.data?.url) {
        return res.data.data.url;
      }
      return null;
    } catch (e) {
      console.error('Lỗi upload ảnh món ăn:', e);
      return null;
    }
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

      // Upload image first if there is a new image
      let uploadedUrl = formData.image_url;
      if (imageUri && !imageUri.startsWith('http')) {
        const newUrl = await uploadMenuImage(imageUri);
        if (newUrl) {
          uploadedUrl = newUrl;
        } else {
          Alert.alert('Lỗi', 'Tải ảnh lên thất bại, vui lòng thử lại.');
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        base_price: Number(formData.base_price) || 0,
        image_url: uploadedUrl,
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
            <Text className="font-lexend font-bold text-gray-800 mb-3">Hình ảnh món ăn</Text>
            <View className="items-center">
              <TouchableOpacity onPress={pickImage} className="items-center justify-center bg-gray-50 rounded-xl w-40 h-32 overflow-hidden border border-gray-200 border-dashed">
                {imageUri ? (
                  <Image source={{ uri: imageUri }} className="w-full h-full" />
                ) : (
                  <View className="items-center justify-center p-4">
                    <FontAwesome name="image" size={24} color="#9ca3af" className="mb-2" />
                    <Text className="font-lexend text-xs text-gray-500 text-center">Chọn ảnh tải lên</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

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
