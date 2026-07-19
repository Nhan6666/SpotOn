import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useBookingCartStore } from '@/hooks/useBookingCartStore';

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id, name, description, price, image } = useLocalSearchParams();
  const { addPreselectedItem } = useBookingCartStore();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="relative">
        <Image 
          source={{ uri: (image as string) || 'https://via.placeholder.com/800x400?text=MonAn' }}
          className="w-full h-72 bg-gray-200"
        />
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-12 left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
        >
          <Text className="text-text text-xl">←</Text>
        </TouchableOpacity>
      </View>
      
      <View className="p-5">
        <Text className="font-lexend font-bold text-3xl text-text mb-2">{name}</Text>
        <Text className="font-lexend font-bold text-2xl text-primary mb-4">
          {Number(price || 0).toLocaleString()}đ
        </Text>
        
        {description ? (
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <Text className="font-lexend font-bold text-lg mb-2">Mô tả món ăn</Text>
            <Text className="font-lexend text-muted leading-6">{description}</Text>
          </View>
        ) : null}

        <View className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <Text className="font-lexend font-semibold text-orange-800 mb-1">💡 Đặt bàn ngay hôm nay!</Text>
          <Text className="font-lexend text-orange-700 text-sm">
            Món ăn này có mặt tại hệ thống các chi nhánh của SpotOn. Hãy chọn chi nhánh gần bạn nhất để thưởng thức.
          </Text>
        </View>

        <Button 
          title="Chọn chi nhánh để đặt bàn"
          onPress={() => {
            if (id) {
              addPreselectedItem(id as string, 1);
            }
            router.push('/(tabs)/branches');
          }}
        />
      </View>
    </ScrollView>
  );
}
