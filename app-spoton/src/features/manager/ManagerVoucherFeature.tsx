import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import apiClient from '@/lib/http';
import { FontAwesome } from '@expo/vector-icons';

interface VoucherItem {
  _id: string;
  code: string;
  discount_percentage: number;
  max_discount_amount?: number;
  min_order_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  is_public: boolean;
}

export function ManagerVoucherFeature() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  
  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    code: '',
    discount_percentage: 10,
    max_discount_amount: 50000,
    min_order_value: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage_limit: 100,
    is_active: true,
    is_public: true
  });

  const fetchVouchers = useCallback(async () => {
    try {
      const res = await apiClient.get('/vouchers');
      if (res.data?.success) {
        setVouchers(res.data.data || []);
      }
    } catch (error) {
      console.log('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleEndEarly = (voucher: VoucherItem) => {
    Alert.alert('Kết thúc sớm', `Bạn có chắc muốn dừng voucher ${voucher.code}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Kết thúc', style: 'destructive', onPress: async () => {
        try {
          await apiClient.put(`/vouchers/${voucher._id}`, {
            is_active: false,
            valid_until: new Date().toISOString()
          });
          Alert.alert('Thành công', 'Đã kết thúc voucher');
          fetchVouchers();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
        }
      }}
    ]);
  };

  const handleDelete = (voucherId: string) => {
    Alert.alert('Xóa Voucher', `Xóa vĩnh viễn voucher này?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/vouchers/${voucherId}`);
          Alert.alert('Thành công', 'Đã xóa voucher');
          fetchVouchers();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể xóa');
        }
      }}
    ]);
  };

  const handleSaveAdd = async () => {
    try {
      if (!formData.code || formData.discount_percentage <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập Mã và % Giảm');
        return;
      }
      
      const payload = {
        ...formData,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until + 'T23:59:59.999Z').toISOString(),
      };
      
      await apiClient.post('/vouchers', payload);
      Alert.alert('Thành công', 'Đã tạo voucher mới');
      setShowAddModal(false);
      fetchVouchers();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo voucher');
    }
  };

  const getStatus = (v: VoucherItem) => {
    if (!v.is_active) return 'ended';
    const now = new Date();
    const until = new Date(v.valid_until);
    if (now > until) return 'ended';
    return 'active';
  };

  const filtered = vouchers.filter(v => {
    if (search && !v.code.toLowerCase().includes(search.toLowerCase())) return false;
    const st = getStatus(v);
    if (statusFilter === 'active' && st !== 'active') return false;
    if (statusFilter === 'ended' && st !== 'ended') return false;
    return true;
  });

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="bg-white px-5 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="font-lexend font-bold text-xl text-gray-900 mb-1">Khuyến mãi</Text>
          <Text className="font-lexend text-xs text-gray-500">
            Tạo và quản lý các mã giảm giá cho nhà hàng
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            setFormData({
              code: '', discount_percentage: 10, max_discount_amount: 50000, min_order_value: 0,
              valid_from: new Date().toISOString().split('T')[0],
              valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              usage_limit: 100, is_active: true, is_public: true
            });
            setShowAddModal(true);
          }}
          className="bg-orange-600 px-4 py-2.5 rounded-lg flex-row items-center ml-2 shadow-sm"
        >
          <FontAwesome name="plus" size={14} color="white" />
          <Text className="font-lexend font-bold text-white text-xs ml-1.5">Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 gap-3">
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <FontAwesome name="search" size={14} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm mã voucher..."
            className="flex-1 font-lexend ml-2 text-sm text-gray-900"
          />
        </View>
        
        <View className="flex-row gap-2">
          {['all', 'active', 'ended'].map(f => {
            const labels: any = { all: 'Tất cả', active: 'Đang chạy', ended: 'Đã kết thúc' };
            const isActive = statusFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setStatusFilter(f as any)}
                className={`px-4 py-1.5 rounded-full border ${isActive ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}
              >
                <Text className={`font-lexend text-xs font-medium ${isActive ? 'text-orange-700' : 'text-gray-600'}`}>{labels[f]}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVouchers(); }} />}
        renderItem={({ item }) => {
          const status = getStatus(item);
          const usagePercent = item.usage_limit ? Math.min(100, (item.used_count / item.usage_limit) * 100) : 0;
          
          return (
            <View className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="bg-gray-100 px-2 py-1 rounded">
                    <Text className="font-lexend font-bold text-gray-800 text-sm tracking-widest">{item.code}</Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ${status === 'active' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`font-lexend font-bold text-[10px] ${status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                      {status === 'active' ? 'Đang chạy' : 'Đã dừng'}
                    </Text>
                  </View>
                </View>
                <Text className="font-lexend font-bold text-orange-600 text-lg">-{item.discount_percentage}%</Text>
              </View>

              <Text className="font-lexend text-xs text-gray-500 mb-3">
                Giảm tối đa {item.max_discount_amount ? item.max_discount_amount.toLocaleString('vi-VN') + 'đ' : 'Không giới hạn'}
              </Text>

              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1 mr-4">
                  <View className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full bg-blue-500 rounded-full" style={{ width: `${usagePercent}%` }} />
                  </View>
                </View>
                <Text className="font-lexend text-xs text-gray-500 font-medium">
                  Đã dùng {item.used_count} / {item.usage_limit || '∞'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
                <View>
                  <Text className="font-lexend text-[10px] text-gray-400">HSD: {new Date(item.valid_until).toLocaleDateString('vi-VN')}</Text>
                </View>
                <View className="flex-row gap-2">
                  {status === 'active' ? (
                    <TouchableOpacity onPress={() => handleEndEarly(item)} className="p-2 bg-amber-50 rounded-lg">
                      <FontAwesome name="stop-circle" size={14} color="#b45309" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-2 bg-red-50 rounded-lg">
                      <FontAwesome name="trash" size={14} color="#b91c1c" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
              <FontAwesome name="tags" size={24} color="#9ca3af" />
            </View>
            <Text className="font-lexend font-bold text-gray-700 text-base mb-1">Chưa có voucher nào</Text>
            <Text className="font-lexend text-gray-500 text-xs text-center">Bạn chưa tạo voucher hoặc không có kết quả tìm kiếm.</Text>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100 shadow-sm bg-white">
            <Text className="font-lexend font-bold text-lg text-gray-900">Thêm Mã Khuyến Mãi</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Mã Code (vd: SUMMER20) <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={formData.code}
                onChangeText={t => setFormData({ ...formData, code: t.toUpperCase() })}
                className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 font-bold uppercase"
                placeholder="Nhập mã voucher"
              />
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">% Giảm <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={String(formData.discount_percentage)}
                  onChangeText={t => setFormData({ ...formData, discount_percentage: Number(t) })}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Giảm Tối Đa (VNĐ)</Text>
                <TextInput
                  value={String(formData.max_discount_amount || '')}
                  onChangeText={t => setFormData({ ...formData, max_discount_amount: Number(t) })}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                />
              </View>
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</Text>
                <TextInput
                  value={String(formData.min_order_value || 0)}
                  onChangeText={t => setFormData({ ...formData, min_order_value: Number(t) })}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Số lượt dùng tối đa</Text>
                <TextInput
                  value={String(formData.usage_limit || 0)}
                  onChangeText={t => setFormData({ ...formData, usage_limit: Number(t) })}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu (YYYY-MM-DD)</Text>
              <TextInput
                value={formData.valid_from}
                onChangeText={t => setFormData({ ...formData, valid_from: t })}
                className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
              />
            </View>

            <View className="mb-6">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Ngày kết thúc (YYYY-MM-DD)</Text>
              <TextInput
                value={formData.valid_until}
                onChangeText={t => setFormData({ ...formData, valid_until: t })}
                className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
              />
            </View>

            <TouchableOpacity 
              onPress={() => setFormData({ ...formData, is_public: !formData.is_public })}
              className="flex-row items-center mb-8"
            >
              <FontAwesome name={formData.is_public ? 'check-square-o' : 'square-o'} size={24} color={formData.is_public ? '#ea580c' : '#9ca3af'} />
              <Text className="font-lexend text-sm text-gray-900 ml-3 font-medium">Hiển thị công khai trên App (Voucher lưu tự động)</Text>
            </TouchableOpacity>

          </ScrollView>
          <View className="p-5 border-t border-gray-100 bg-white">
            <TouchableOpacity 
              onPress={handleSaveAdd} 
              className="py-4 bg-orange-600 rounded-xl items-center shadow-sm"
            >
              <Text className="font-lexend font-bold text-white text-lg">Tạo Voucher</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
