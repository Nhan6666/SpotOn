import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerService } from '@/features/customer/customer.service';

export function MenuFeature() {
  const router = useRouter();
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const data = await CustomerService.getPublicMenu('default');
      if (data.success) {
        setMenu(data.data || []);
      }
    } catch (error) {
      console.log('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-amber-700 px-4 pt-14 pb-4 rounded-b-2xl flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
        >
          <Text className="text-white text-xl">←</Text>
        </TouchableOpacity>
        <Text className="font-lexend font-bold text-2xl text-white">Thực đơn SpotOn</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#b45309" />
        </View>
      ) : menu.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="font-lexend text-muted text-center text-lg">Chưa có món ăn nào trong thực đơn.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {menu.map((category: any, idx: number) => (
            <View key={category._id || idx} className="mb-6">
              <Text className="font-lexend font-bold text-xl text-primary mb-3">
                {category.category || category.name || 'Category'}
              </Text>
              {(category.items || []).map((item: any, itemIdx: number) => (
                <TouchableOpacity 
                  key={item._id || itemIdx} 
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
                    className="w-24 h-24 bg-gray-200"
                  />
                  <View className="p-3 flex-1 justify-center">
                    <Text className="font-lexend font-bold text-text text-base" numberOfLines={1}>{item.name}</Text>
                    {item.description ? (
                      <Text className="font-lexend text-muted text-xs mt-1" numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text className="font-lexend text-primary font-bold text-sm mt-2">
                      {item.price?.toLocaleString() || '0'}đ
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View className="h-10" />
        </ScrollView>
      )}
    </View>
  );
}
