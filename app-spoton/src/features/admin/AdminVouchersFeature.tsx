import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import apiClient from '@/lib/http';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';

interface Branch {
  _id: string;
  name: string;
}

export interface VoucherItem {
  _id: string;
  code: string;
  branch_id?: string | { _id: string; name: string } | null;
  discount_percentage: number;
  max_discount_amount?: number;
  min_order_value: number;
  min_guest_count?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  is_public: boolean;
}

export function AdminVouchersFeature() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tableCapacities, setTableCapacities] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'inactive'>('all');
  
  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    code: '',
    discount_percentage: 10,
    max_discount_amount: 50000,
    min_order_value: 0,
    min_guest_count: 1,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    usage_limit: 100,
    is_active: true,
    is_public: true,
    branch_id: '' // empty string means Global (null in backend)
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [vouchersRes, branchesRes, capacitiesRes] = await Promise.all([
        apiClient.get('/vouchers'),
        apiClient.get('/branches'),
        apiClient.get('/branches/table-capacities')
      ]);
      
      if (vouchersRes.data?.success) {
        setVouchers(vouchersRes.data.data || []);
      }
      if (branchesRes.data?.success) {
        setBranches(branchesRes.data.data || []);
      }
      if (capacitiesRes.data?.success) {
        setTableCapacities(capacitiesRes.data.data || []);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          fetchData();
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
          fetchData();
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
      
      const startDate = new Date(formData.valid_from);
      const endDate = new Date(formData.valid_until);
      
      if (startDate >= endDate) {
        Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
      
      const payload: any = {
        ...formData,
        valid_from: startDate.toISOString(),
        valid_until: endDate.toISOString(),
      };
      
      if (!payload.branch_id) {
        delete payload.branch_id; // Let backend use default/null for global
      }
      
      await apiClient.post('/vouchers', payload);
      Alert.alert('Thành công', 'Đã tạo voucher mới');
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo voucher');
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!formData.code || formData.discount_percentage <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập Mã và % Giảm');
        return;
      }
      const startDate = new Date(formData.valid_from);
      const endDate = new Date(formData.valid_until);
      
      if (startDate >= endDate) {
        Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
      
      const payload: any = {
        ...formData,
        valid_from: startDate.toISOString(),
        valid_until: endDate.toISOString(),
      };
      
      if (!payload.branch_id) {
        payload.branch_id = null; // Update global
      }
      
      await apiClient.put(`/vouchers/${formData._id}`, payload);
      Alert.alert('Thành công', 'Đã cập nhật voucher');
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật voucher');
    }
  };

  const handleEditClick = (item: VoucherItem) => {
    setFormData({
      ...item,
      branch_id: typeof item.branch_id === 'object' && item.branch_id ? item.branch_id._id : (item.branch_id || '')
    });
    setShowAddModal(true);
  };

  const getStatus = (v: VoucherItem) => {
    if (!v.is_active) return 'inactive';
    const now = new Date();
    const from = new Date(v.valid_from);
    const until = new Date(v.valid_until);
    if (now < from) return 'scheduled';
    if (now > until) return 'expired';
    return 'active';
  };

  const filtered = vouchers.filter(v => {
    if (search && !v.code.toLowerCase().includes(search.toLowerCase())) return false;
    const st = getStatus(v);
    if (statusFilter !== 'all' && st !== statusFilter) return false;
    return true;
  });

  const isFormRunning = formData._id ? getStatus(formData as VoucherItem) === 'active' : false;

  const handleShowStartPicker = () => {
    if (isFormRunning) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: new Date(formData.valid_from),
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event: any, selectedDate?: Date) => {
          if (event.type === 'set' && selectedDate) {
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: 'time',
              is24Hour: true,
              onChange: (timeEvent: any, selectedTime?: Date) => {
                if (timeEvent.type === 'set' && selectedTime) {
                  const finalDate = new Date(selectedDate);
                  finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                  setFormData((prev: any) => ({ ...prev, valid_from: finalDate.toISOString() }));
                }
              }
            });
          }
        },
      });
    } else {
      setShowStartPicker(true);
    }
  };

  const handleShowEndPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: new Date(formData.valid_until),
        mode: 'date',
        minimumDate: new Date(formData.valid_from),
        onChange: (event: any, selectedDate?: Date) => {
          if (event.type === 'set' && selectedDate) {
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: 'time',
              is24Hour: true,
              onChange: (timeEvent: any, selectedTime?: Date) => {
                if (timeEvent.type === 'set' && selectedTime) {
                  const finalDate = new Date(selectedDate);
                  finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                  setFormData((prev: any) => ({ ...prev, valid_until: finalDate.toISOString() }));
                }
              }
            });
          }
        },
      });
    } else {
      setShowEndPicker(true);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  const selectedBranchName = formData.branch_id 
    ? branches.find(b => b._id === formData.branch_id)?.name || 'Chi nhánh'
    : 'Toàn hệ thống (Global)';

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="bg-white px-5 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="font-lexend font-bold text-xl text-gray-900 mb-1">Khuyến mãi (Admin)</Text>
          <Text className="font-lexend text-xs text-gray-500">
            Quản lý voucher toàn hệ thống hoặc theo chi nhánh
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            setFormData({
              code: '', discount_percentage: 10, max_discount_amount: 50000, min_order_value: 0,
              valid_from: new Date().toISOString(),
              valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              usage_limit: 100, min_guest_count: 1, is_active: true, is_public: true, branch_id: ''
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
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
          {['all', 'active', 'scheduled', 'expired', 'inactive'].map(f => {
            const labels: any = { all: 'Tất cả', active: 'Đang chạy', scheduled: 'Sắp diễn ra', expired: 'Đã kết thúc', inactive: 'Tạm dừng' };
            const isActive = statusFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setStatusFilter(f as any)}
                className={`px-4 py-1.5 rounded-full border mr-2 ${isActive ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}
              >
                <Text className={`font-lexend text-xs font-medium ${isActive ? 'text-orange-700' : 'text-gray-600'}`}>{labels[f]}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        renderItem={({ item }) => {
          const status = getStatus(item);
          const usagePercent = item.usage_limit ? Math.min(100, (item.used_count / item.usage_limit) * 100) : 0;
          
          return (
            <TouchableOpacity 
              onPress={() => handleEditClick(item)}
              activeOpacity={0.7}
              className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-start gap-2 flex-1">
                  <View>
                    <View className="bg-gray-100 px-2 py-1 rounded self-start mb-1">
                      <Text className="font-lexend font-bold text-gray-800 text-sm tracking-widest">{item.code}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <FontAwesome name={typeof item.branch_id === 'object' && item.branch_id ? "map-marker" : "globe"} size={10} color="#6b7280" />
                      <Text className="font-lexend text-[10px] text-gray-500 ml-1" numberOfLines={1}>
                        {typeof item.branch_id === 'object' && item.branch_id ? `Chi nhánh ${item.branch_id.name}` : 'Toàn hệ thống (Global)'}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ml-1 ${
                    status === 'active' ? 'bg-green-100' : 
                    status === 'scheduled' ? 'bg-yellow-100' :
                    status === 'expired' ? 'bg-gray-100' : 'bg-red-100'
                  }`}>
                    <Text className={`font-lexend font-bold text-[10px] ${
                      status === 'active' ? 'text-green-700' : 
                      status === 'scheduled' ? 'text-yellow-700' :
                      status === 'expired' ? 'text-gray-500' : 'text-red-700'
                    }`}>
                      {status === 'active' ? 'Đang chạy' : 
                       status === 'scheduled' ? 'Sắp diễn ra' :
                       status === 'expired' ? 'Đã kết thúc' : 'Tạm dừng'}
                    </Text>
                  </View>
                </View>
                <Text className="font-lexend font-bold text-orange-600 text-lg">-{item.discount_percentage}%</Text>
              </View>

              <Text className="font-lexend text-xs text-gray-500 mb-3 mt-1">
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
                  <Text className="font-lexend text-[10px] text-gray-500">
                    {new Date(item.valid_from).toLocaleString('vi-VN')}
                  </Text>
                  <Text className="font-lexend text-[10px] text-gray-500 mt-0.5">
                    Đến: {new Date(item.valid_until).toLocaleString('vi-VN')}
                  </Text>
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
            </TouchableOpacity>
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

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100 shadow-sm bg-white z-10">
            <Text className="font-lexend font-bold text-lg text-gray-900">{formData._id ? 'Sửa Khuyến Mãi' : 'Thêm Khuyến Mãi'}</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Branch Selector */}
            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Phạm vi áp dụng <Text className="text-red-500">*</Text></Text>
              <TouchableOpacity 
                onPress={() => !isFormRunning && setShowBranchSelect(true)}
                activeOpacity={isFormRunning ? 1 : 0.2}
                className={`flex-row justify-between items-center border border-gray-300 rounded-lg px-4 py-3 ${isFormRunning ? 'bg-gray-100 opacity-70' : ''}`}
              >
                <Text className={`font-lexend ${isFormRunning ? 'text-gray-500' : 'text-gray-900'}`}>{selectedBranchName}</Text>
                <FontAwesome name="chevron-down" size={12} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Mã Code (vd: SUMMER20) <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={formData.code}
                editable={!isFormRunning}
                onChangeText={t => setFormData({ ...formData, code: t.toUpperCase() })}
                className={`border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 font-bold uppercase ${isFormRunning ? 'bg-gray-100 text-gray-500 opacity-70' : ''}`}
                placeholder="Nhập mã voucher"
              />
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">% Giảm <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={String(formData.discount_percentage)}
                  editable={!isFormRunning}
                  onChangeText={t => setFormData({ ...formData, discount_percentage: Number(t) })}
                  keyboardType="numeric"
                  className={`border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 ${isFormRunning ? 'bg-gray-100 text-gray-500 opacity-70' : ''}`}
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Giảm Tối Đa (VNĐ)</Text>
                <TextInput
                  value={String(formData.max_discount_amount || '')}
                  editable={!isFormRunning}
                  onChangeText={t => setFormData({ ...formData, max_discount_amount: Number(t) })}
                  keyboardType="numeric"
                  className={`border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 ${isFormRunning ? 'bg-gray-100 text-gray-500 opacity-70' : ''}`}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</Text>
              <TextInput
                value={String(formData.min_order_value || 0)}
                editable={!isFormRunning}
                onChangeText={t => setFormData({ ...formData, min_order_value: Number(t) })}
                keyboardType="numeric"
                className={`border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900 ${isFormRunning ? 'bg-gray-100 text-gray-500 opacity-70' : ''}`}
              />
            </View>

            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-2">Điều kiện số người tối thiểu</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <TouchableOpacity
                  disabled={isFormRunning}
                  onPress={() => setFormData({ ...formData, min_guest_count: 1 })}
                  className={`mr-2 px-4 py-2 rounded-full border ${formData.min_guest_count === 1 ? 'bg-orange-100 border-orange-500' : 'bg-white border-gray-300'} ${isFormRunning ? 'opacity-50' : ''}`}
                >
                  <Text className={`font-lexend text-sm ${formData.min_guest_count === 1 ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>Không yêu cầu</Text>
                </TouchableOpacity>
                {tableCapacities.map(cap => (
                  <TouchableOpacity
                    key={cap}
                    disabled={isFormRunning}
                    onPress={() => setFormData({ ...formData, min_guest_count: cap })}
                    className={`mr-2 px-4 py-2 rounded-full border ${formData.min_guest_count === cap ? 'bg-orange-100 border-orange-500' : 'bg-white border-gray-300'} ${isFormRunning ? 'opacity-50' : ''}`}
                  >
                    <Text className={`font-lexend text-sm ${formData.min_guest_count === cap ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>Từ {cap} người</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Số lượt dùng tối đa</Text>
                <TextInput
                  value={String(formData.usage_limit || 0)}
                  onChangeText={t => setFormData({ ...formData, usage_limit: Number(t) })}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
                />
              </View>
              <View className="flex-1" />
            </View>

            <View className="mb-4">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</Text>
              <TouchableOpacity
                onPress={handleShowStartPicker}
                activeOpacity={isFormRunning ? 1 : 0.2}
                className={`border border-gray-300 rounded-lg px-4 py-3 flex-row justify-between items-center ${isFormRunning ? 'bg-gray-100 opacity-70' : ''}`}
              >
                <Text className={`font-lexend ${isFormRunning ? 'text-gray-500' : 'text-gray-900'}`}>{new Date(formData.valid_from!).toLocaleString('vi-VN')}</Text>
                <FontAwesome name="calendar" size={16} color="#9ca3af" />
              </TouchableOpacity>
              {Platform.OS === 'ios' && showStartPicker && !isFormRunning && (
                <DateTimePicker
                  value={new Date(formData.valid_from)}
                  mode="datetime"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowStartPicker(false);
                    if (selectedDate) setFormData({ ...formData, valid_from: selectedDate.toISOString() });
                  }}
                />
              )}
            </View>

            <View className="mb-6">
              <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</Text>
              <TouchableOpacity
                onPress={handleShowEndPicker}
                className="border border-gray-300 rounded-lg px-4 py-3 flex-row justify-between items-center"
              >
                <Text className="font-lexend text-gray-900">{new Date(formData.valid_until!).toLocaleString('vi-VN')}</Text>
                <FontAwesome name="calendar" size={16} color="#9ca3af" />
              </TouchableOpacity>
              {Platform.OS === 'ios' && showEndPicker && (
                <DateTimePicker
                  value={new Date(formData.valid_until)}
                  mode="datetime"
                  display="default"
                  minimumDate={new Date(formData.valid_from)}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowEndPicker(false);
                    if (selectedDate) setFormData({ ...formData, valid_until: selectedDate.toISOString() });
                  }}
                />
              )}
            </View>

            <TouchableOpacity 
              onPress={() => setFormData({ ...formData, is_public: !formData.is_public })}
              className="flex-row items-center mb-4"
            >
              <FontAwesome name={formData.is_public ? 'check-square-o' : 'square-o'} size={24} color={formData.is_public ? '#ea580c' : '#9ca3af'} />
              <Text className="font-lexend text-sm text-gray-900 ml-3 font-medium">Hiển thị công khai trên App (Voucher lưu tự động)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className="flex-row items-center mb-8"
            >
              <FontAwesome name={formData.is_active ? 'toggle-on' : 'toggle-off'} size={24} color={formData.is_active ? '#16a34a' : '#9ca3af'} />
              <Text className="font-lexend text-sm text-gray-900 ml-3 font-medium">Kích hoạt voucher (Active)</Text>
            </TouchableOpacity>

          </ScrollView>
          <View className="p-5 border-t border-gray-100 bg-white">
            <TouchableOpacity 
              onPress={formData._id ? handleSaveEdit : handleSaveAdd} 
              className="py-4 bg-orange-600 rounded-xl items-center shadow-sm"
            >
              <Text className="font-lexend font-bold text-white text-lg">{formData._id ? 'Lưu Thay Đổi' : 'Tạo Voucher'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Branch Select Modal */}
        <Modal visible={showBranchSelect} transparent animationType="fade">
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-2xl p-5 max-h-[80%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="font-lexend font-bold text-lg text-gray-900">Chọn Chi Nhánh</Text>
                <TouchableOpacity onPress={() => setShowBranchSelect(false)} className="p-2">
                  <FontAwesome name="times" size={16} color="#4b5563" />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                <TouchableOpacity 
                  onPress={() => {
                    setFormData({ ...formData, branch_id: '' });
                    setShowBranchSelect(false);
                  }}
                  className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${formData.branch_id === '' ? 'bg-orange-50 px-2 rounded-lg border-b-0' : ''}`}
                >
                  <Text className={`font-lexend ${formData.branch_id === '' ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
                    Toàn hệ thống (Global)
                  </Text>
                  {formData.branch_id === '' && <FontAwesome name="check" size={14} color="#ea580c" />}
                </TouchableOpacity>

                {branches.map(branch => (
                  <TouchableOpacity 
                    key={branch._id}
                    onPress={() => {
                      setFormData({ ...formData, branch_id: branch._id });
                      setShowBranchSelect(false);
                    }}
                    className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${formData.branch_id === branch._id ? 'bg-orange-50 px-2 rounded-lg border-b-0' : ''}`}
                  >
                    <Text className={`font-lexend ${formData.branch_id === branch._id ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
                      {branch.name}
                    </Text>
                    {formData.branch_id === branch._id && <FontAwesome name="check" size={14} color="#ea580c" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  );
}
