import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerService } from '../customer/customer.service';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Branch } from '@/types/branch.types';

export function HomeFeature() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
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
      <View className="bg-amber-700 px-6 pt-16 pb-10 rounded-b-[40px] shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="font-lexend text-amber-200 text-sm font-semibold">Chào mừng đến với</Text>
            <Text className="font-lexend font-bold text-4xl text-white tracking-tight">SpotOn</Text>
          </View>
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
            <FontAwesome name="bell-o" size={20} color="#fff" />
          </View>
        </View>
        <Text className="font-lexend text-amber-100 text-base leading-6 mt-1 mb-6">
          Hệ thống đặt bàn thông minh hàng đầu. Tận hưởng bữa tiệc trọn vẹn không lo chờ đợi.
        </Text>
        
        {/* Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/10 rounded-2xl p-4 items-center border border-white/20">
            <Text className="font-lexend font-bold text-2xl text-white mb-1">{branches.length}</Text>
            <Text className="font-lexend text-amber-100 text-xs text-center">Chi nhánh</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-2xl p-4 items-center border border-white/20">
            <Text className="font-lexend font-bold text-2xl text-white mb-1">24/7</Text>
            <Text className="font-lexend text-amber-100 text-xs text-center">Đặt bàn nhanh</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-2xl p-4 items-center border border-white/20">
            <Text className="font-lexend font-bold text-2xl text-white mb-1">⭐</Text>
            <Text className="font-lexend text-amber-100 text-xs text-center">Top đánh giá</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-4 py-8">
        <Text className="font-lexend font-bold text-xl text-text mb-4">Khám phá ngay</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity 
            className="flex-1 bg-white rounded-2xl p-5 items-center shadow-sm border border-gray-50"
            style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05 }}
            onPress={() => router.push('/(tabs)/branches')}
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-3">
              <FontAwesome name="map-marker" size={24} color="#3b82f6" />
            </View>
            <Text className="font-lexend font-semibold text-text text-sm">Tìm Chi nhánh</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1 bg-white rounded-2xl p-5 items-center shadow-sm border border-gray-50"
            style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05 }}
            onPress={() => router.push('/menu')}
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 bg-amber-50 rounded-full items-center justify-center mb-3">
              <FontAwesome name="book" size={24} color={Colors.primary} />
            </View>
            <Text className="font-lexend font-semibold text-text text-sm">Xem Thực đơn</Text>
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
