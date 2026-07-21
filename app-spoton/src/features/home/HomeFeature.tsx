import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { CustomerService } from '../customer/customer.service';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Branch } from '@/types/branch.types';

export function HomeFeature() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchRes, bestRes, voucherRes] = await Promise.all([
        CustomerService.getBranches(),
        CustomerService.getBestSellers(),
        CustomerService.getPublicVouchers()
      ]);
      if (branchRes.success) setBranches(branchRes.data || []);
      if (bestRes.success) setBestSellers(bestRes.data || []);
      if (voucherRes.success) setVouchers(voucherRes.data || []);
    } catch (error) {
      console.log('Error fetching home data:', error);
    } 
    finally { setLoading(false); }
  };

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000' }}
        className="px-6 pt-16 pb-10 rounded-b-[40px] shadow-sm overflow-hidden"
        imageStyle={{ borderRadius: 40 }}
      >
        <View className="absolute inset-0 bg-black/60 rounded-b-[40px]" />
        <View className="relative z-10">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="font-lexend text-amber-300 text-sm font-semibold tracking-wider uppercase mb-1">Chào mừng đến với</Text>
              <Text className="font-lexend font-bold text-4xl text-white tracking-tight">SpotOn</Text>
            </View>
            <View className="flex-row gap-3">
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <TouchableOpacity 
                  onPress={() => router.push(user?.role === 'ADMIN' ? '/admin-dashboard' : '/branch-manage')}
                  className="w-12 h-12 bg-white/20 rounded-full items-center justify-center border border-white/30 backdrop-blur-sm"
                >
                  <FontAwesome name="dashboard" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text className="font-lexend text-gray-200 text-base leading-6 mt-1 mb-8">
            Hệ thống đặt bàn thông minh hàng đầu. Tận hưởng bữa tiệc trọn vẹn không lo chờ đợi.
          </Text>
          
          {/* Stats */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/10 rounded-2xl p-4 items-center border border-white/20 backdrop-blur-md">
              <Text className="font-lexend font-bold text-2xl text-white mb-1">{branches.length}</Text>
              <Text className="font-lexend text-gray-300 text-xs text-center">Chi nhánh</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-2xl p-4 items-center border border-white/20 backdrop-blur-md">
              <Text className="font-lexend font-bold text-2xl text-white mb-1">24/7</Text>
              <Text className="font-lexend text-gray-300 text-xs text-center">Đặt bàn</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-2xl p-4 items-center border border-white/20 backdrop-blur-md">
              <Text className="font-lexend font-bold text-2xl text-white mb-1">⭐</Text>
              <Text className="font-lexend text-gray-300 text-xs text-center">Top rate</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Quick Actions */}
      <View className="px-4 py-8">
        <Text className="font-lexend font-bold text-xl text-text mb-4">Khám phá ngay</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity 
            className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 shadow-md"
            style={{ shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }}
            onPress={() => router.push('/(tabs)/branches')}
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-3">
              <FontAwesome name="map-marker" size={24} color="#3b82f6" />
            </View>
            <Text className="font-lexend font-semibold text-text text-sm">Tìm Chi nhánh</Text>
            <Text className="font-lexend text-gray-500 text-[10px] mt-1">Gần bạn nhất</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100 shadow-md"
            style={{ shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }}
            onPress={() => router.push('/(tabs)/menu')}
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 bg-amber-50 rounded-full items-center justify-center mb-3">
              <FontAwesome name="book" size={24} color={Colors.primary} />
            </View>
            <Text className="font-lexend font-semibold text-text text-sm">Xem Thực đơn</Text>
            <Text className="font-lexend text-gray-500 text-[10px] mt-1">Đặt món trước</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recommended Branches */}
      <View className="px-4 pb-8">
        <View className="flex-row justify-between items-end mb-4">
          <Text className="font-lexend font-bold text-xl text-text">Chi nhánh nổi bật</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/branches')}>
            <Text className="font-lexend text-primary font-semibold text-sm">Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            {branches.slice(0, 3).map((branch) => (
              <TouchableOpacity 
                key={branch._id} 
                className="bg-white rounded-2xl mr-4 overflow-hidden shadow-sm border border-gray-50"
                style={{ width: 280, elevation: 2 }}
                onPress={() => router.push(`/branch/${branch._id}`)}
                activeOpacity={0.9}
              >
                <Image 
                  source={{ uri: branch.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80' }}
                  className="w-full h-36 bg-gray-200"
                />
                <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                  <Text className="font-lexend text-white text-xs font-bold">
                    {branch.status === 'OPEN' ? 'Đang mở' : 'Đóng cửa'}
                  </Text>
                </View>
                <View className="p-4">
                  <Text className="font-lexend font-bold text-lg text-text mb-1" numberOfLines={1}>{branch.name}</Text>
                  <View className="flex-row items-center mb-2">
                    <FontAwesome name="map-marker" size={12} color={Colors.muted} />
                    <Text className="font-lexend text-muted text-xs ml-1 flex-1" numberOfLines={1}>
                      {typeof branch.address === 'object' ? (branch.address as any).city : branch.address}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="bg-amber-50 py-2 rounded-lg items-center mt-1"
                    onPress={() => router.push(`/branch/${branch._id}`)}
                  >
                    <Text className="font-lexend font-bold text-primary text-xs">ĐẶT BÀN NGAY</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Ưu đãi hấp dẫn */}
      {vouchers && vouchers.length > 0 && (
        <View className="px-4 pb-8">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="font-lexend font-bold text-xl text-text">Ưu đãi nổi bật</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            {vouchers.map((voucher) => (
              <View 
                key={voucher._id} 
                className="bg-orange-50 rounded-2xl p-4 mr-4 shadow-sm border border-orange-100 flex-row items-center"
                style={{ width: 260 }}
              >
                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-3 border border-orange-200">
                  <FontAwesome name="ticket" size={20} color="#ea580c" />
                </View>
                <View className="flex-1">
                  <Text className="font-lexend font-bold text-orange-900 text-sm mb-1" numberOfLines={1}>{voucher.code}</Text>
                  <Text className="font-lexend text-orange-700 text-xs" numberOfLines={2}>{voucher.description}</Text>
                  <Text className="font-lexend font-bold text-orange-600 text-xs mt-1">
                    Giảm {voucher.discount_type === 'PERCENT' ? `${voucher.discount_value || 0}%` : `${(voucher.discount_value || 0).toLocaleString()}đ`}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Best Sellers */}
      <View className="px-4 pb-12">
        <Text className="font-lexend font-bold text-xl text-text mb-4">Món Best Seller</Text>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : bestSellers.length === 0 ? (
          <Text className="font-lexend text-muted text-center py-4">Chưa có món nào</Text>
        ) : (
          bestSellers.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-50 shadow-sm flex-row"
              style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05 }}
              onPress={() => router.push({
                pathname: '/item/[id]',
                params: { 
                  id: item._id,
                  name: item.name, 
                  description: item.description, 
                  price: item.price, 
                  image: item.image 
                }
              })}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80' }}
                className="w-32 h-32 bg-gray-200"
              />
              <View className="p-4 flex-1 justify-center">
                <Text className="font-lexend font-bold text-text text-lg mb-1" numberOfLines={2}>{item.name}</Text>
                {item.description ? (
                  <Text className="font-lexend text-muted text-xs mb-2" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text className="font-lexend text-primary font-bold text-base mt-auto">
                  {item.price?.toLocaleString() || '0'}đ
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
