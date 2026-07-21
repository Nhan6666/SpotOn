import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';

export function AdminSystemConfigFeature() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    deposit_percent: '30',
    min_advance_hours: '2',
    max_advance_days: '30',
    max_party_size: '20',
    no_show_minutes: '30',
    service_periods: {
      lunch: { start: '08:00', end: '13:00', last_booking: '12:00', last_order: '12:30' },
      dinner: { start: '15:00', end: '23:00', last_booking: '22:00', last_order: '22:30' }
    }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiClient.get('/system-configs/booking-rules');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setFormData({
          deposit_percent: String(d.deposit_percent || '30'),
          min_advance_hours: String(d.min_advance_hours || '2'),
          max_advance_days: String(d.max_advance_days || '30'),
          max_party_size: String(d.max_party_size || '20'),
          no_show_minutes: String(d.no_show_minutes || '30'),
          service_periods: {
            lunch: {
              start: d.service_periods?.lunch?.start || '08:00',
              end: d.service_periods?.lunch?.end || '13:00',
              last_booking: d.service_periods?.lunch?.last_booking || '12:00',
              last_order: d.service_periods?.lunch?.last_order || '12:30'
            },
            dinner: {
              start: d.service_periods?.dinner?.start || '15:00',
              end: d.service_periods?.dinner?.end || '23:00',
              last_booking: d.service_periods?.dinner?.last_booking || '22:00',
              last_order: d.service_periods?.dinner?.last_order || '22:30'
            }
          }
        });
      }
    } catch (error) {
      console.log('Error fetching system config:', error);
      Alert.alert('Lỗi', 'Không thể tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        deposit_percent: Number(formData.deposit_percent),
        min_advance_hours: Number(formData.min_advance_hours),
        max_advance_days: Number(formData.max_advance_days),
        max_party_size: Number(formData.max_party_size),
        no_show_minutes: Number(formData.no_show_minutes),
        service_periods: formData.service_periods
      };

      if (payload.deposit_percent < 0 || payload.deposit_percent > 100) {
        Alert.alert('Lỗi', 'Tỷ lệ cọc phải từ 0 đến 100%');
        setSaving(false);
        return;
      }

      await apiClient.put('/system-configs/booking-rules', payload);
      Alert.alert('Thành công', 'Đã lưu cấu hình đặt bàn hệ thống');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const updateTime = (period: 'lunch' | 'dinner', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      service_periods: {
        ...prev.service_periods,
        [period]: {
          ...prev.service_periods[period],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#ea580c" /></View>;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-[#F9FAFB]"
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4 border-b border-gray-100 pb-3">
            <FontAwesome name="cogs" size={16} color="#ea580c" />
            <Text className="font-lexend font-bold text-base text-gray-900 ml-2">Quy định Đặt Bàn Chung</Text>
          </View>
          
          <View className="mb-4">
            <Text className="font-lexend text-sm text-gray-700 mb-1">Tỷ lệ tiền cọc (%)</Text>
            <TextInput
              value={formData.deposit_percent}
              onChangeText={t => setFormData({ ...formData, deposit_percent: t })}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
            />
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-gray-700 mb-1">Thời gian đặt trước tối thiểu (giờ)</Text>
            <TextInput
              value={formData.min_advance_hours}
              onChangeText={t => setFormData({ ...formData, min_advance_hours: t })}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
            />
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-gray-700 mb-1">Thời gian đặt trước tối đa (ngày)</Text>
            <TextInput
              value={formData.max_advance_days}
              onChangeText={t => setFormData({ ...formData, max_advance_days: t })}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
            />
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-sm text-gray-700 mb-1">Số khách tối đa / bàn</Text>
            <TextInput
              value={formData.max_party_size}
              onChangeText={t => setFormData({ ...formData, max_party_size: t })}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
            />
          </View>

          <View className="mb-2">
            <Text className="font-lexend text-sm text-gray-700 mb-1">Thời gian tự hủy nếu khách đến trễ (phút)</Text>
            <TextInput
              value={formData.no_show_minutes}
              onChangeText={t => setFormData({ ...formData, no_show_minutes: t })}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
            />
          </View>
        </View>

        <View className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4 border-b border-gray-100 pb-3">
            <FontAwesome name="sun-o" size={16} color="#eab308" />
            <Text className="font-lexend font-bold text-base text-gray-900 ml-2">Ca Trưa (Lunch)</Text>
          </View>
          
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Giờ mở cửa</Text>
              <TextInput
                value={formData.service_periods.lunch.start}
                onChangeText={t => updateTime('lunch', 'start', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center"
              />
            </View>
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Giờ đóng cửa</Text>
              <TextInput
                value={formData.service_periods.lunch.end}
                onChangeText={t => updateTime('lunch', 'end', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center"
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Nhận bàn cuối</Text>
              <TextInput
                value={formData.service_periods.lunch.last_booking}
                onChangeText={t => updateTime('lunch', 'last_booking', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center bg-gray-50"
              />
            </View>
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Last Order</Text>
              <TextInput
                value={formData.service_periods.lunch.last_order}
                onChangeText={t => updateTime('lunch', 'last_order', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center bg-gray-50"
              />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl p-5 mb-8 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4 border-b border-gray-100 pb-3">
            <FontAwesome name="moon-o" size={16} color="#6366f1" />
            <Text className="font-lexend font-bold text-base text-gray-900 ml-2">Ca Tối (Dinner)</Text>
          </View>
          
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Giờ mở cửa</Text>
              <TextInput
                value={formData.service_periods.dinner.start}
                onChangeText={t => updateTime('dinner', 'start', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center"
              />
            </View>
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Giờ đóng cửa</Text>
              <TextInput
                value={formData.service_periods.dinner.end}
                onChangeText={t => updateTime('dinner', 'end', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center"
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Nhận bàn cuối</Text>
              <TextInput
                value={formData.service_periods.dinner.last_booking}
                onChangeText={t => updateTime('dinner', 'last_booking', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center bg-gray-50"
              />
            </View>
            <View className="flex-1">
              <Text className="font-lexend text-xs text-gray-500 mb-1">Last Order</Text>
              <TextInput
                value={formData.service_periods.dinner.last_order}
                onChangeText={t => updateTime('dinner', 'last_order', t)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-gray-900 text-center bg-gray-50"
              />
            </View>
          </View>
        </View>

      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={saving}
          className={`py-4 rounded-xl items-center shadow-sm flex-row justify-center ${saving ? 'bg-orange-400' : 'bg-orange-600'}`}
        >
          {saving && <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />}
          <Text className="font-lexend font-bold text-white text-lg">Lưu Thay Đổi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
