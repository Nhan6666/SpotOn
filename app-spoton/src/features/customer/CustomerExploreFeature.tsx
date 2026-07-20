import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerService } from './customer.service';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Branch } from '@/types/branch.types';

export function CustomerExploreFeature() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
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

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    branches.forEach(b => {
      const city = typeof b.address === 'object' ? (b.address as any).city : null;
      if (city) citySet.add(city);
    });
    return Array.from(citySet);
  }, [branches]);

  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      // 1. Search Query
      if (searchQuery && !branch.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 2. Status Filter
      if (selectedStatus && branch.status !== selectedStatus) {
        return false;
      }
      // 3. City Filter
      const branchCity = typeof branch.address === 'object' ? (branch.address as any).city : null;
      if (selectedCity && branchCity !== selectedCity) {
        return false;
      }
      return true;
    });
  }, [branches, searchQuery, selectedStatus, selectedCity]);

  const getStatusVariant = (status: string) => {
    if (status === 'OPEN') return 'success';
    if (status === 'FULL') return 'warning';
    return 'error';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'OPEN') return 'Đang mở';
    if (status === 'FULL') return 'Kín bàn';
    if (status === 'MAINTENANCE') return 'Bảo trì';
    return 'Đóng cửa';
  };

  const renderBranch = ({ item }: { item: Branch }) => (
    <TouchableOpacity 
      className="bg-white rounded-2xl mb-5 overflow-hidden shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
      onPress={() => router.push(`/branch/${item._id}`)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800' }}
        className="w-full h-48 bg-gray-200"
      />
      <View className="absolute top-3 right-3">
        <Badge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />
      </View>
      <View className="p-4">
        <Text className="font-lexend font-bold text-xl text-text mb-1">{item.name}</Text>
        <View className="flex-row items-center mb-2">
          <FontAwesome name="map-marker" size={14} color={Colors.muted} style={{ width: 16 }} />
          <Text className="font-lexend text-muted text-sm ml-1 flex-1" numberOfLines={2}>
            {typeof item.address === 'object' 
              ? (item.address as any).full || `${(item.address as any).street || ''}, ${(item.address as any).district || ''}, ${(item.address as any).city || ''}` 
              : item.address}
          </Text>
        </View>
        <View className="flex-row items-center">
          <FontAwesome name="clock-o" size={14} color={Colors.primary} style={{ width: 16 }} />
          <Text className="font-lexend text-primary font-semibold text-sm ml-1">
            {item.open_time} - {item.close_time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background pt-12">
      <View className="px-4 pb-4 bg-white border-b border-gray-100 z-10">
        <Text className="font-lexend font-bold text-2xl text-text mb-3">Khám phá Chi nhánh</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-3 border border-gray-100">
          <FontAwesome name="search" size={16} color={Colors.muted} />
          <TextInput 
            className="flex-1 ml-2 font-lexend text-text"
            placeholder="Tìm theo tên chi nhánh..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.muted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={16} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View>
          <FlatList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: 'all', type: 'status', label: 'Tất cả trạng thái', value: null },
              { id: 'open', type: 'status', label: 'Đang mở', value: 'OPEN' },
              { id: 'full', type: 'status', label: 'Kín bàn', value: 'FULL' },
              ...cities.map(c => ({ id: `city_${c}`, type: 'city', label: c, value: c }))
            ]}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const isSelected = item.type === 'status' 
                ? selectedStatus === item.value 
                : selectedCity === item.value;
                
              return (
                <TouchableOpacity 
                  onPress={() => {
                    if (item.type === 'status') setSelectedStatus(item.value);
                    else setSelectedCity(isSelected ? null : item.value);
                  }}
                  className={`px-4 py-2 rounded-full mr-2 border ${
                    isSelected ? 'bg-amber-700 border-amber-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`font-lexend font-semibold text-sm ${
                    isSelected ? 'text-white' : 'text-text'
                  }`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBranches}
          keyExtractor={item => item._id}
          renderItem={renderBranch}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState 
              icon="building-o"
              title="Không tìm thấy chi nhánh" 
              message="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn."
              actionLabel="Xóa bộ lọc"
              onAction={() => {
                setSearchQuery('');
                setSelectedStatus(null);
                setSelectedCity(null);
              }}
            />
          }
        />
      )}
    </View>
  );
}
