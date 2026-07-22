import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerService } from './customer.service';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { EmptyState } from '@/components/ui/EmptyState';

export function CustomerWalletFeature() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await CustomerService.getMyWallet();
      if (res.success) {
        setVouchers(res.data || []);
      }
    } catch (error) {
      console.log('Error fetching wallet:', error);
      Alert.alert('Lỗi', 'Không thể tải ví voucher');
    } finally {
      setLoading(false);
    }
  };

  const renderVoucher = ({ item }: { item: any }) => {
    const voucher = item.voucher_id || item;
    const isUsed = item.is_used;

    return (
      <View 
        className={`bg-white rounded-2xl mb-4 p-4 shadow-sm border ${isUsed ? 'border-gray-200 opacity-60' : 'border-orange-100'}`}
        style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05 }}
      >
        <View className="flex-row items-center">
          <View className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${isUsed ? 'bg-gray-100' : 'bg-orange-50'}`}>
            <FontAwesome name="ticket" size={24} color={isUsed ? "#9ca3af" : "#ea580c"} />
          </View>
          <View className="flex-1">
            <Text className="font-lexend font-bold text-lg text-text mb-1">{voucher.code}</Text>
            <Text className="font-lexend text-muted text-xs mb-2">{voucher.description}</Text>
            <View className="flex-row items-center">
              <Text className={`font-lexend font-bold text-sm ${isUsed ? 'text-gray-500' : 'text-orange-600'}`}>
                Giảm {voucher.discount_type === 'PERCENT' ? `${voucher.discount_value}%` : `${(voucher.discount_value || 0).toLocaleString()}đ`}
              </Text>
              {voucher.min_order_value > 0 && (
                <Text className="font-lexend text-gray-400 text-xs ml-2">
                  (Đơn từ {(voucher.min_order_value).toLocaleString()}đ)
                </Text>
              )}
            </View>
          </View>
        </View>
        
        {isUsed && (
          <View className="absolute top-2 right-2 px-2 py-1 bg-gray-100 rounded-md">
            <Text className="font-lexend text-gray-500 text-[10px] uppercase">Đã sử dụng</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="bg-amber-700 px-4 pt-14 pb-4 rounded-b-2xl flex-row items-center shadow-sm z-10">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
        >
          <FontAwesome name="angle-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="font-lexend font-bold text-xl text-white">Ví Voucher của tôi</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vouchers}
          keyExtractor={(item, idx) => item._id || idx.toString()}
          renderItem={renderVoucher}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState 
              icon="ticket"
              title="Ví voucher trống" 
              message="Bạn chưa lưu mã giảm giá nào. Hãy lấy mã từ trang chủ nhé!"
              actionLabel="Khám phá ngay"
              onAction={() => router.push('/')}
            />
          }
        />
      )}
    </View>
  );
}
