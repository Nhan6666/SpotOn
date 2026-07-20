import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerService } from './customer.service';

export function CustomerExploreFeature() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await CustomerService.getBranches();
      if (data.success) {
        setBranches(data.data);
      }
    } catch (error) {
      console.log('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBranch = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="bg-white rounded-md mb-4 overflow-hidden border border-gray-100 shadow-sm"
      onPress={() => router.push(`/branch/${item._id}`)}
    >
      <Image 
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/400x200?text=SpotOn+Branch' }}
        className="w-full h-40 bg-gray-200"
      />
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-lexend font-bold text-lg text-text">{item.name}</Text>
          <View className={`px-2 py-1 rounded-full ${item.status === 'OPEN' ? 'bg-green-100' : item.status === 'FULL' ? 'bg-amber-100' : 'bg-red-100'}`}>
            <Text className={`text-xs font-lexend font-bold ${item.status === 'OPEN' ? 'text-green-700' : item.status === 'FULL' ? 'text-amber-700' : 'text-red-700'}`}>
              {item.status === 'OPEN' ? 'Đang mở' : item.status === 'FULL' ? 'Đầy' : 'Đóng cửa'}
            </Text>
          </View>
        </View>
        <Text className="font-lexend text-muted text-sm" numberOfLines={2}>{typeof item.address === 'object' ? item.address?.full || `${item.address?.street || ''}, ${item.address?.district || ''}, ${item.address?.city || ''}` : item.address}</Text>
        <View className="flex-row items-center mt-3">
          <Text className="font-lexend text-primary font-semibold text-sm">
            {item.open_time} - {item.close_time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-6 pb-2">
        <Text className="font-lexend font-bold text-3xl text-text">Chi nhánh</Text>
        <Text className="font-lexend text-muted mt-1">Chọn chi nhánh và đặt bàn ngay</Text>
      </View>
      
      <FlatList
        data={branches}
        keyExtractor={item => item._id}
        renderItem={renderBranch}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
