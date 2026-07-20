import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Switch } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';

interface Amenity {
  _id: string;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
}

const AVAILABLE_ICONS = ['wifi', 'car', 'wheelchair', 'paw', 'glass', 'music', 'tv', 'leaf', 'cutlery', 'coffee', 'gamepad', 'child'];

export function AdminAmenitiesFeature() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', icon: 'wifi', description: '', is_active: true });
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);

  const fetchAmenities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/amenities');
      if (res.data?.success) {
        setAmenities(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching amenities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  const handleSaveAdd = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên tiện ích');
        return;
      }
      
      await apiClient.post('/amenities', {
        name: formData.name.trim(),
        icon: formData.icon,
        description: formData.description.trim()
      });
      
      Alert.alert('Thành công', 'Đã tạo tiện ích mới');
      setShowAddModal(false);
      fetchAmenities();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo tiện ích');
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingAmenity || !formData.name.trim()) return;
      
      await apiClient.put(`/amenities/${editingAmenity._id}`, {
        name: formData.name.trim(),
        icon: formData.icon,
        description: formData.description.trim(),
        is_active: formData.is_active
      });
      
      Alert.alert('Thành công', 'Đã cập nhật tiện ích');
      setShowEditModal(false);
      fetchAmenities();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xóa Tiện ích', 'Bạn có chắc chắn muốn xóa tiện ích này khỏi hệ thống?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/amenities/${id}`);
          Alert.alert('Thành công', 'Đã xóa tiện ích');
          fetchAmenities();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể xóa');
        }
      }}
    ]);
  };

  const openEditModal = (item: Amenity) => {
    setEditingAmenity(item);
    setFormData({ 
      name: item.name, 
      icon: item.icon || 'wifi', 
      description: item.description || '', 
      is_active: item.is_active 
    });
    setShowEditModal(true);
  };

  const renderIconPicker = () => (
    <View className="mb-4">
      <Text className="font-lexend text-sm text-gray-700 mb-2">Chọn Biểu tượng</Text>
      <View className="flex-row flex-wrap gap-3">
        {AVAILABLE_ICONS.map(icon => (
          <TouchableOpacity 
            key={icon}
            onPress={() => setFormData({ ...formData, icon })}
            className={`w-12 h-12 rounded-xl items-center justify-center border ${formData.icon === icon ? 'bg-orange-50 border-orange-500' : 'bg-gray-50 border-gray-200'}`}
          >
            <FontAwesome name={icon as any} size={20} color={formData.icon === icon ? '#ea580c' : '#6b7280'} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-4 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <Text className="font-lexend font-bold text-lg text-gray-900">Danh mục Tiện ích</Text>
        <TouchableOpacity 
          onPress={() => {
            setFormData({ name: '', icon: 'wifi', description: '', is_active: true });
            setShowAddModal(true);
          }}
          className="bg-orange-600 px-3 py-2 rounded-lg flex-row items-center shadow-sm"
        >
          <FontAwesome name="plus" size={12} color="white" />
          <Text className="font-lexend font-bold text-white text-xs ml-1.5">Thêm tiện ích</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#ea580c" /></View>
      ) : (
        <FlatList
          data={amenities}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
              <View className="flex-row items-center flex-1 pr-4">
                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${item.is_active ? 'bg-orange-50' : 'bg-gray-100'}`}>
                  <FontAwesome 
                    name={item.icon as any || 'star'} 
                    size={20} 
                    color={item.is_active ? "#ea580c" : "#9ca3af"} 
                  />
                </View>
                <View className="flex-1">
                  <Text className={`font-lexend font-bold text-base ${item.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {item.name}
                  </Text>
                  <Text className="font-lexend text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {item.description || 'Không có mô tả'}
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
              <FontAwesome name="list-alt" size={32} color="#d1d5db" />
              <Text className="font-lexend text-gray-500 mt-3">Chưa có tiện ích nào.</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white p-5">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-lexend font-bold text-lg text-gray-900">Thêm Tiện Ích Mới</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>
          
          <Text className="font-lexend text-sm text-gray-700 mb-1">Tên tiện ích (vd: Chỗ đỗ xe ô tô)</Text>
          <TextInput
            value={formData.name}
            onChangeText={t => setFormData({ ...formData, name: t })}
            className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-4"
            placeholder="Nhập tên tiện ích"
          />
          
          <Text className="font-lexend text-sm text-gray-700 mb-1">Mô tả chi tiết</Text>
          <TextInput
            value={formData.description}
            onChangeText={t => setFormData({ ...formData, description: t })}
            className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-6"
            placeholder="Mô tả"
          />

          {renderIconPicker()}

          <TouchableOpacity onPress={handleSaveAdd} className="mt-8 py-4 bg-orange-600 rounded-xl items-center shadow-sm">
            <Text className="font-lexend font-bold text-white text-lg">Lưu Tiện Ích</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white p-5">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-lexend font-bold text-lg text-gray-900">Sửa Tiện Ích</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>
          
          <Text className="font-lexend text-sm text-gray-700 mb-1">Tên tiện ích</Text>
          <TextInput
            value={formData.name}
            onChangeText={t => setFormData({ ...formData, name: t })}
            className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-4"
          />
          
          <Text className="font-lexend text-sm text-gray-700 mb-1">Mô tả chi tiết</Text>
          <TextInput
            value={formData.description}
            onChangeText={t => setFormData({ ...formData, description: t })}
            className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 mb-6"
          />

          {renderIconPicker()}

          <View className="flex-row justify-between items-center bg-gray-50 p-4 rounded-xl mb-8">
            <View>
              <Text className="font-lexend font-bold text-gray-900">Trạng thái hoạt động</Text>
              <Text className="font-lexend text-xs text-gray-500">Bật để hiển thị tiện ích này</Text>
            </View>
            <Switch
              value={formData.is_active}
              onValueChange={v => setFormData({ ...formData, is_active: v })}
              trackColor={{ false: "#d1d5db", true: "#ea580c" }}
            />
          </View>

          <TouchableOpacity onPress={handleSaveEdit} className="py-4 bg-blue-600 rounded-xl items-center shadow-sm">
            <Text className="font-lexend font-bold text-white text-lg">Cập Nhật</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}
