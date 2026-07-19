import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerService } from '../customer/customer.service';

export function HomeFeature() {
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchRes, bestRes] = await Promise.all([
        CustomerService.getBranches(),
        CustomerService.getBestSellers()
      ]);
      if (branchRes.success) setBranches(branchRes.data || []);
      if (bestRes.success) setBestSellers(bestRes.data || []);
    } catch (error) {
      console.log('Error fetching home data:', error);
    } 
    finally { setLoading(false); }
  };

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <View className="bg-amber-700 px-6 pt-14 pb-8 rounded-b-3xl">
        <Text className="font-lexend font-bold text-3xl text-white mb-1">SpotOn</Text>
        <Text className="font-lexend text-amber-200 text-base">Đặt bàn thông minh • Trải nghiệm trọn vẹn</Text>
        <View className="flex-row mt-6 gap-3">
          <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
            <Text className="font-lexend font-bold text-2xl text-white">{branches.length}</Text>
            <Text className="font-lexend text-amber-100 text-xs">Chi nhánh</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
            <Text className="font-lexend font-bold text-2xl text-white">24/7</Text>
            <Text className="font-lexend text-amber-100 text-xs">Đặt bàn online</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
            <Text className="font-lexend font-bold text-2xl text-white">⭐</Text>
            <Text className="font-lexend text-amber-100 text-xs">Top đánh giá</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-4 py-6">
        <Text className="font-lexend font-bold text-lg text-text mb-3">Khám phá</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity 
            className="flex-1 bg-white rounded-xl p-4 items-center border border-gray-100 shadow-sm"
            onPress={() => router.push('/(tabs)/branches')}
          >
            <Text className="text-2xl mb-1">📍</Text>
            <Text className="font-lexend font-semibold text-text text-sm">Xem chi nhánh</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-white rounded-xl p-4 items-center border border-gray-100 shadow-sm"
            onPress={() => router.push('/menu')}
          >
            <Text className="text-2xl mb-1">🍽️</Text>
            <Text className="font-lexend font-semibold text-text text-sm">Xem thực đơn</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-white rounded-xl p-4 items-center border border-gray-100 shadow-sm"
            onPress={() => router.push('/(tabs)/branches')}
          >
            <Text className="text-2xl mb-1">📅</Text>
            <Text className="font-lexend font-semibold text-text text-sm">Đặt bàn</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View className="px-4 pb-4">
        <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <Text className="font-lexend font-bold text-lg text-text mb-2">Về SpotOn</Text>
          <Text className="font-lexend text-muted text-sm leading-5">
            SpotOn là hệ thống đặt bàn và quản lý nhà hàng thông minh. Cho phép bạn đặt bàn trực tuyến, 
            chọn bàn theo sơ đồ, đặt trước món ăn và thanh toán cọc tiện lợi qua VNPay.
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {['Đặt bàn chính xác', 'Đặt trước món ăn', 'Thanh toán VNPay', 'Xem sơ đồ bàn'].map(tag => (
              <View key={tag} className="bg-amber-50 px-3 py-1 rounded-full">
                <Text className="font-lexend text-amber-700 text-xs font-semibold">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Best Sellers */}
      <View className="px-4 pb-6">
        <Text className="font-lexend font-bold text-lg text-text mb-3">Món Best Seller</Text>
        {loading ? (
          <ActivityIndicator color="#b45309" />
        ) : bestSellers.length === 0 ? (
          <Text className="font-lexend text-muted text-center py-4">Chưa có món nào</Text>
        ) : (
          bestSellers.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              className="bg-white rounded-xl mb-3 overflow-hidden border border-gray-100 shadow-sm flex-row"
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
            >
              <Image 
                source={{ uri: item.image || 'https://via.placeholder.com/150x150?text=MonAn' }}
                className="w-28 h-28 bg-gray-200"
              />
              <View className="p-3 flex-1 justify-center">
                <Text className="font-lexend font-bold text-text text-lg" numberOfLines={1}>{item.name}</Text>
                {item.description ? (
                  <Text className="font-lexend text-muted text-xs mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text className="font-lexend text-primary font-bold text-base mt-2">
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
