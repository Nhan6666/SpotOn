import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';

interface WalkInModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { guest_count: number; walk_in_name?: string; walk_in_phone?: string }) => void;
  tableName: string;
}

export function WalkInModal({ visible, onClose, onSubmit, tableName }: WalkInModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestCount, setGuestCount] = useState('2');

  const handleSubmit = () => {
    const count = parseInt(guestCount, 10);
    if (isNaN(count) || count < 1) {
      Alert.alert('Lỗi', 'Số lượng khách phải lớn hơn 0');
      return;
    }
    onSubmit({
      guest_count: count,
      walk_in_name: name.trim() || undefined,
      walk_in_phone: phone.trim() || undefined,
    });
    // Reset form for next use
    setName('');
    setPhone('');
    setGuestCount('2');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center bg-black/50 px-4"
      >
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-lg">
          <Text className="font-lexend font-bold text-xl text-text mb-2">Mở bàn {tableName}</Text>
          <Text className="font-lexend text-sm text-muted mb-4">Nhập thông tin cho khách vãng lai (Walk-in)</Text>

          <Text className="font-lexend text-sm text-text font-medium mb-1">Số lượng khách *</Text>
          <TextInput
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 font-lexend text-text"
            keyboardType="number-pad"
            value={guestCount}
            onChangeText={setGuestCount}
            placeholder="Ví dụ: 2"
          />

          <Text className="font-lexend text-sm text-text font-medium mb-1">Tên khách hàng (Tùy chọn)</Text>
          <TextInput
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 font-lexend text-text"
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên khách"
          />

          <Text className="font-lexend text-sm text-text font-medium mb-1">Số điện thoại (Tùy chọn)</Text>
          <TextInput
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6 font-lexend text-text"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
          />

          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 py-3 bg-gray-100 rounded-xl items-center border border-gray-200"
              onPress={onClose}
            >
              <Text className="font-lexend font-bold text-gray-600">Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 py-3 bg-primary rounded-xl items-center"
              onPress={handleSubmit}
            >
              <Text className="font-lexend font-bold text-white">Tạo đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
