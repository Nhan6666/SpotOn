import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/lib/http';

interface CreateBranchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBranchModal({ visible, onClose, onSuccess }: CreateBranchModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    addressFull: '',
    addressCity: 'Hồ Chí Minh',
    addressDistrict: '',
    hotline: '',
    lng: '106.6297',
    lat: '10.8231'
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.addressFull || !formData.addressDistrict) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tên, Địa chỉ và Quận/Huyện.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        address: {
          full: formData.addressFull,
          city: formData.addressCity,
          district: formData.addressDistrict
        },
        hotline: formData.hotline,
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.lng) || 106.6297, parseFloat(formData.lat) || 10.8231]
        }
      };

      const res = await apiClient.post('/branches', payload);
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã thêm chi nhánh mới!');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Lỗi thêm chi nhánh:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <Text className="font-lexend font-bold text-lg text-text">Thêm Chi Nhánh Mới</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <FontAwesome name="times" size={20} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View className="mb-4">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Tên chi nhánh *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
              placeholder="Vd: SpotOn Quận 1..."
              value={formData.name}
              onChangeText={(txt) => handleChange('name', txt)}
            />
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Địa chỉ chi tiết *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
              placeholder="Số nhà, tên đường..."
              value={formData.addressFull}
              onChangeText={(txt) => handleChange('addressFull', txt)}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Quận/Huyện *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                placeholder="Vd: Quận 1"
                value={formData.addressDistrict}
                onChangeText={(txt) => handleChange('addressDistrict', txt)}
              />
            </View>
            <View className="flex-1">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Tỉnh/Thành</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                placeholder="Vd: Hồ Chí Minh"
                value={formData.addressCity}
                onChangeText={(txt) => handleChange('addressCity', txt)}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-text mb-2 font-medium">Số điện thoại (Hotline)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
              placeholder="0909..."
              keyboardType="phone-pad"
              value={formData.hotline}
              onChangeText={(txt) => handleChange('hotline', txt)}
            />
          </View>

          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Kinh độ (Lng)</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                placeholder="106.xxx"
                keyboardType="numeric"
                value={formData.lng}
                onChangeText={(txt) => handleChange('lng', txt)}
              />
            </View>
            <View className="flex-1">
              <Text className="font-lexend text-sm text-text mb-2 font-medium">Vĩ độ (Lat)</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-lexend text-text"
                placeholder="10.xxx"
                keyboardType="numeric"
                value={formData.lat}
                onChangeText={(txt) => handleChange('lat', txt)}
              />
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
              Xác nhận Thêm
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
