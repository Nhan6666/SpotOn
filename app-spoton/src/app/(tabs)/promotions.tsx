import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/axios';

export default function PromotionsScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, EXPIRED

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/vouchers');
      if (res.data.success) {
        setVouchers(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  // Filter vouchers
  const filteredVouchers = vouchers.filter((voucher) => {
    const now = new Date();
    const validUntil = new Date(voucher.valid_until);
    const isExpired = now > validUntil;
    const isActive = voucher.is_active && !isExpired;
    
    // Search by code or name
    const matchesSearch = 
      voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      voucher.name.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Filter by status
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && isActive) || 
      (statusFilter === 'EXPIRED' && (!voucher.is_active || isExpired));

    return matchesSearch && matchesStatus;
  });

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="bg-white pt-4 pb-4 px-4 shadow-sm z-10 border-b border-gray-100">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 rounded-full items-center justify-center">
            <FontAwesome name="arrow-left" size={16} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="font-lexend font-bold text-xl text-text">Quản lý Khuyến mãi</Text>
            <Text className="font-lexend text-xs text-gray-500">Tạo và quản lý các mã giảm giá cho nhà hàng</Text>
          </View>
        </View>

        {/* Header Actions */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <FontAwesome name="search" size={14} color="#9ca3af" />
            <TextInput
              placeholder="Tìm mã voucher..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 font-lexend text-sm text-text"
            />
          </View>
          <TouchableOpacity className="bg-[#b45309] flex-row items-center px-3 py-2.5 rounded-lg">
            <FontAwesome name="plus" size={12} color="white" />
            <Text className="font-lexend text-white font-bold text-sm ml-2">Thêm mới</Text>
          </TouchableOpacity>
        </View>
        
        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <TouchableOpacity 
            onPress={() => setStatusFilter('ALL')}
            className={`px-4 py-1.5 rounded-full mr-2 border ${statusFilter === 'ALL' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}
          >
            <Text className={`font-lexend text-xs ${statusFilter === 'ALL' ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setStatusFilter('ACTIVE')}
            className={`px-4 py-1.5 rounded-full mr-2 border ${statusFilter === 'ACTIVE' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
          >
            <Text className={`font-lexend text-xs ${statusFilter === 'ACTIVE' ? 'text-green-700 font-bold' : 'text-gray-600'}`}>Đang chạy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setStatusFilter('EXPIRED')}
            className={`px-4 py-1.5 rounded-full border ${statusFilter === 'EXPIRED' ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'}`}
          >
            <Text className={`font-lexend text-xs ${statusFilter === 'EXPIRED' ? 'text-gray-700 font-bold' : 'text-gray-600'}`}>Đã kết thúc</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {filteredVouchers.length === 0 ? (
          <View className="items-center justify-center py-20 bg-white rounded-xl border border-gray-100 mt-2">
            <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-3">
              <FontAwesome name="tag" size={24} color="#d1d5db" />
            </View>
            <Text className="font-lexend font-bold text-gray-700 text-base mb-1">Chưa có voucher nào</Text>
            <Text className="font-lexend text-gray-500 text-xs text-center px-6">Bạn chưa tạo voucher hoặc không có kết quả tìm kiếm.</Text>
          </View>
        ) : (
          filteredVouchers.map((voucher: any) => {
            const now = new Date();
            const validUntil = new Date(voucher.valid_until);
            const isExpired = now > validUntil;
            const isActive = voucher.is_active && !isExpired;

            return (
              <View 
                key={voucher._id} 
                className="bg-white rounded-xl mb-3 border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Header row (Code & Status) */}
                <View className={`flex-row justify-between items-center p-3 border-b border-gray-50 ${isActive ? 'bg-orange-50/30' : 'bg-gray-50'}`}>
                  <View className="flex-row items-center">
                    <FontAwesome name="ticket" size={14} color={isActive ? '#ea580c' : '#9ca3af'} />
                    <Text className="font-lexend font-bold text-text ml-2 tracking-wide uppercase">{voucher.code}</Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <Text className={`font-lexend font-bold text-[10px] ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                      {isActive ? 'ĐANG CHẠY' : 'KẾT THÚC'}
                    </Text>
                  </View>
                </View>

                <View className="p-3">
                  <Text className="font-lexend font-semibold text-text text-sm mb-1">{voucher.name}</Text>
                  
                  <View className="flex-row mt-2">
                    <View className="flex-1 border-r border-gray-100 pr-2">
                      <Text className="font-lexend text-[10px] text-gray-500">Giảm giá</Text>
                      <Text className="font-lexend font-bold text-orange-600 text-sm mt-0.5">
                        {voucher.discount_percentage}%
                      </Text>
                      <Text className="font-lexend text-gray-400 text-[10px]">
                        Tối đa {voucher.max_discount_amount?.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                    
                    <View className="flex-1 border-r border-gray-100 px-2">
                      <Text className="font-lexend text-[10px] text-gray-500">Lượt dùng</Text>
                      <Text className="font-lexend font-semibold text-text text-sm mt-0.5">
                        {voucher.used_count} <Text className="text-gray-400 font-normal">/ {voucher.usage_limit || '∞'}</Text>
                      </Text>
                    </View>

                    <View className="flex-1 pl-2">
                      <Text className="font-lexend text-[10px] text-gray-500">Hiệu lực</Text>
                      <Text className="font-lexend font-medium text-text text-xs mt-0.5" numberOfLines={1}>
                        Từ {new Date(voucher.valid_from).toLocaleDateString('vi-VN')}
                      </Text>
                      <Text className="font-lexend font-medium text-text text-xs" numberOfLines={1}>
                        Đến {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="mt-3 flex-row justify-end border-t border-dashed border-gray-200 pt-3">
                    <TouchableOpacity className="px-4 py-1.5 bg-gray-100 rounded-lg">
                      <Text className="font-lexend text-xs font-semibold text-gray-700">Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
