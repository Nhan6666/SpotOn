import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/lib/http';
import { Branch } from '@/types/branch.types';
import * as ImagePicker from 'expo-image-picker';

interface BranchFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branch?: Branch | null;
}

export function BranchFormModal({ visible, onClose, onSuccess, branch }: BranchFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!branch;
  
  // States for options
  const [managers, setManagers] = useState<any[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  
  // States for advanced toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // States for new image
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    addressFull: '',
    addressCity: 'Hồ Chí Minh',
    addressDistrict: '',
    hotline: '',
    manager_id: '',
    amenities: [] as string[],
    lunchStart: '08:00',
    lunchEnd: '13:00',
    dinnerStart: '15:00',
    dinnerEnd: '23:00',
  });

  useEffect(() => {
    if (visible) {
      fetchOptions();
      
      if (branch) {
        setFormData({
          name: branch.name || '',
          addressFull: typeof branch.address === 'object' ? branch.address.full || '' : branch.address || '',
          addressCity: typeof branch.address === 'object' ? branch.address.city || 'Hồ Chí Minh' : 'Hồ Chí Minh',
          addressDistrict: typeof branch.address === 'object' ? branch.address.district || '' : '',
          hotline: branch.hotline || '',
          manager_id: branch.manager_id && typeof branch.manager_id === 'object' ? (branch.manager_id as any)._id : branch.manager_id || '',
          amenities: branch.amenities?.map((a: any) => typeof a === 'object' && a !== null ? a._id.toString() : a.toString()) || [],
          lunchStart: branch.service_periods?.lunch?.start || '08:00',
          lunchEnd: branch.service_periods?.lunch?.end || '13:00',
          dinnerStart: branch.service_periods?.dinner?.start || '15:00',
          dinnerEnd: branch.service_periods?.dinner?.end || '23:00',
        });
        setImageUri(branch.images && branch.images.length > 0 ? branch.images[0] : (branch.image || null));
      } else {
        setFormData({
          name: '',
          addressFull: '',
          addressCity: 'Hồ Chí Minh',
          addressDistrict: '',
          hotline: '',
          manager_id: '',
          amenities: [],
          lunchStart: '08:00',
          lunchEnd: '13:00',
          dinnerStart: '15:00',
          dinnerEnd: '23:00',
        });
        setImageUri(null);
      }
      setShowAdvanced(false);
    }
  }, [visible, branch]);

  const fetchOptions = async () => {
    try {
      const [managersRes, amenitiesRes] = await Promise.all([
        apiClient.get('/users/managers'),
        apiClient.get('/amenities')
      ]);
      if (managersRes.data?.success) {
        setManagers(managersRes.data.data);
      }
      if (amenitiesRes.data?.success) {
        setAmenitiesList(amenitiesRes.data.data);
      }
    } catch (error) {
      console.log('Error fetching branch options:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => {
      if (prev.amenities.includes(id)) {
        return { ...prev, amenities: prev.amenities.filter(a => a !== id) };
      } else {
        return { ...prev, amenities: [...prev.amenities, id] };
      }
    });
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

  const uploadBranchImage = async (branchId: string, localUri: string) => {
    if (!localUri || localUri.startsWith('http')) return; // Already uploaded

    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;

    const form = new FormData();
    form.append('images', {
      uri: localUri,
      name: filename,
      type
    } as any);

    try {
      await apiClient.put(`/uploads/branch/${branchId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (e) {
      console.error('Lỗi upload ảnh:', e);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.addressFull || !formData.addressDistrict) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tên, Địa chỉ và Quận/Huyện.');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        name: formData.name,
        address: {
          full: formData.addressFull,
          city: formData.addressCity,
          district: formData.addressDistrict
        },
        hotline: formData.hotline,
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231] // Default for now
        },
        service_periods: {
          lunch: { start: formData.lunchStart, end: formData.lunchEnd },
          dinner: { start: formData.dinnerStart, end: formData.dinnerEnd }
        },
        amenities: formData.amenities
      };

      if (formData.manager_id) {
        payload.manager_id = formData.manager_id;
      }

      let savedBranchId = '';

      if (isEditing && branch) {
        const res = await apiClient.put(`/branches/${branch._id}`, payload);
        if (res.data?.success) {
          savedBranchId = branch._id;
        }
      } else {
        const res = await apiClient.post('/branches', payload);
        if (res.data?.success) {
          savedBranchId = res.data.data._id;
        }
      }

      if (savedBranchId && imageUri && !imageUri.startsWith('http')) {
        await uploadBranchImage(savedBranchId, imageUri);
      }

      Alert.alert('Thành công', isEditing ? 'Đã cập nhật thông tin chi nhánh!' : 'Đã thêm chi nhánh mới!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi lưu chi nhánh:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu chi nhánh');
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
            {isEditing ? 'Sửa Chi Nhánh' : 'Thêm Chi Nhánh Mới'}
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <FontAwesome name="times" size={20} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="font-lexend font-bold text-gray-800 mb-3">1. Ảnh chi nhánh</Text>
            <View className="items-center">
              <TouchableOpacity onPress={pickImage} className="items-center justify-center bg-gray-200 rounded-xl w-40 h-32 overflow-hidden border border-gray-300 border-dashed">
                {imageUri ? (
                  <Image source={{ uri: imageUri }} className="w-full h-full" />
                ) : (
                  <View className="items-center justify-center p-4">
                    <FontAwesome name="cloud-upload" size={24} color="#9ca3af" className="mb-2" />
                    <Text className="font-lexend text-xs text-gray-500 text-center">Tải ảnh lên</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="font-lexend font-bold text-gray-800 mb-3">2. Thông tin cơ bản</Text>
            
            <View className="mb-4">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Tên chi nhánh *</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                placeholder="Vd: SpotOn Quận 1..."
                value={formData.name}
                onChangeText={(txt) => handleChange('name', txt)}
              />
            </View>

            <View className="mb-4">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Địa chỉ chi tiết *</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                placeholder="Số nhà, tên đường..."
                value={formData.addressFull}
                onChangeText={(txt) => handleChange('addressFull', txt)}
              />
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="font-lexend text-sm text-text mb-2 font-medium">Quận/Huyện *</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                  placeholder="Vd: Quận 1"
                  value={formData.addressDistrict}
                  onChangeText={(txt) => handleChange('addressDistrict', txt)}
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-sm text-text mb-2 font-medium">Tỉnh/Thành</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                  placeholder="Vd: Hồ Chí Minh"
                  value={formData.addressCity}
                  onChangeText={(txt) => handleChange('addressCity', txt)}
                />
              </View>
            </View>

            <View className="mb-2">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Số điện thoại (Hotline)</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                placeholder="0909..."
                keyboardType="phone-pad"
                value={formData.hotline}
                onChangeText={(txt) => handleChange('hotline', txt)}
              />
            </View>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="font-lexend font-bold text-gray-800 mb-3">3. Thời gian hoạt động (Ca)</Text>
            
            <Text className="font-lexend font-semibold text-gray-700 text-xs mb-2">Ca Sáng / Trưa</Text>
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="font-lexend text-xs text-text mb-1 font-medium">Bắt đầu</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 font-lexend text-text"
                  placeholder="08:00"
                  value={formData.lunchStart}
                  onChangeText={(txt) => handleChange('lunchStart', txt)}
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-xs text-text mb-1 font-medium">Kết thúc</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 font-lexend text-text"
                  placeholder="13:00"
                  value={formData.lunchEnd}
                  onChangeText={(txt) => handleChange('lunchEnd', txt)}
                />
              </View>
            </View>

            <Text className="font-lexend font-semibold text-gray-700 text-xs mb-2">Ca Chiều / Tối</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-xs text-text mb-1 font-medium">Bắt đầu</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 font-lexend text-text"
                  placeholder="15:00"
                  value={formData.dinnerStart}
                  onChangeText={(txt) => handleChange('dinnerStart', txt)}
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-xs text-text mb-1 font-medium">Kết thúc</Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 font-lexend text-text"
                  placeholder="23:00"
                  value={formData.dinnerEnd}
                  onChangeText={(txt) => handleChange('dinnerEnd', txt)}
                />
              </View>
            </View>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <Text className="font-lexend font-bold text-gray-800 mb-3">4. Quản lý & Tiện ích</Text>
            
            <View className="mb-4">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Quản lý chi nhánh</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                <TouchableOpacity
                  onPress={() => handleChange('manager_id', '')}
                  className={`px-4 py-2 rounded-full border mr-2 ${!formData.manager_id ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-300'}`}
                >
                  <Text className={`font-lexend text-sm ${!formData.manager_id ? 'text-white font-bold' : 'text-gray-600'}`}>Không có</Text>
                </TouchableOpacity>
                {managers.map(m => (
                  <TouchableOpacity
                    key={m._id}
                    onPress={() => handleChange('manager_id', m._id)}
                    className={`px-4 py-2 rounded-full border mr-2 flex-row items-center gap-1 ${formData.manager_id === m._id ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-300'}`}
                  >
                    <FontAwesome name="user" size={12} color={formData.manager_id === m._id ? '#fff' : '#6b7280'} />
                    <Text className={`font-lexend text-sm ${formData.manager_id === m._id ? 'text-white font-bold' : 'text-gray-600'}`}>{m.full_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Tiện ích (Amenities)</Text>
              <View className="flex-row flex-wrap gap-2">
                {amenitiesList.map(a => {
                  const isSelected = formData.amenities.includes(a._id.toString());
                  return (
                    <TouchableOpacity
                      key={a._id}
                      onPress={() => toggleAmenity(a._id.toString())}
                      className={`px-3 py-2 rounded-lg border flex-row items-center gap-2 ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-200'}`}
                    >
                      <FontAwesome name={a.icon || 'star'} size={12} color={isSelected ? '#10b981' : '#9ca3af'} />
                      <Text className={`font-lexend text-xs ${isSelected ? 'text-emerald-700 font-bold' : 'text-gray-600'}`}>{a.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
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
