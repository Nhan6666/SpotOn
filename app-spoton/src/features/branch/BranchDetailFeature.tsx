import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { CustomerService } from '@/features/customer/customer.service';
import { useAuthStore } from '@/hooks/useAuthStore';

interface BranchDetailProps {
  id: string;
}

export function BranchDetailFeature({ id }: BranchDetailProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [branch, setBranch] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    fetchBranch();
  }, [id]);

  const fetchBranch = async () => {
    try {
      const data = await CustomerService.getBranchById(id);
      if (data.success) {
        setBranch(data.data);
      }
    } catch (error) {
      console.log('Error fetching branch:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    setMenuLoading(true);
    try {
      const data = await CustomerService.getPublicMenu(id);
      if (data.success) {
        setMenu(data.data || []);
      }
    } catch (error) {
      console.log('Error fetching menu:', error);
    } finally {
      setMenuLoading(false);
      setShowMenu(true);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  if (!branch) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="font-lexend text-muted">Branch not found</Text>
      </View>
    );
  }

  const addressText = typeof branch.address === 'object'
    ? branch.address?.full || `${branch.address?.street || ''}, ${branch.address?.district || ''}, ${branch.address?.city || ''}`
    : branch.address || '';

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="relative">
        <Image 
          source={{ uri: branch.images?.[0] || 'https://via.placeholder.com/800x400?text=SpotOn' }}
          className="w-full h-64 bg-gray-200"
        />
        {/* Floating back button */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-12 left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
        >
          <Text className="text-text text-xl">←</Text>
        </TouchableOpacity>
      </View>
      <View className="p-4">
        <Text className="font-lexend font-bold text-3xl text-text mb-2">{branch.name}</Text>
        <Text className="font-lexend text-muted mb-4">{addressText}</Text>
        
        <View className="bg-white rounded-md p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="font-lexend font-bold text-lg mb-2">Thông tin</Text>
          <View className="flex-row justify-between py-2 border-b border-gray-50">
            <Text className="font-lexend text-text">Giờ mở cửa</Text>
            <Text className="font-lexend font-semibold">{branch.open_time || '09:00'} - {branch.close_time || '22:00'}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-50">
            <Text className="font-lexend text-text">Hotline</Text>
            <Text className="font-lexend font-semibold">{branch.hotline || 'N/A'}</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="font-lexend text-text">Trạng thái</Text>
            <Text className={`font-lexend font-semibold ${
              branch.status === 'OPEN' ? 'text-green-600' : 
              branch.status === 'FULL' ? 'text-orange-600' : 'text-red-500'
            }`}>
              {branch.status === 'OPEN' ? 'Đang mở' : 
               branch.status === 'FULL' ? 'Đầy chỗ' : 'Đóng cửa'}
            </Text>
          </View>
        </View>

        {/* Branch FULL warning (from project.md) */}
        {branch.status === 'FULL' && (
          <View className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
            <Text className="font-lexend font-semibold text-orange-700 text-sm">
              ⚠️ Chi nhánh này hiện đã đầy. Có thể không đặt bàn được.
            </Text>
          </View>
        )}

        {branch.status === 'CLOSED' && (
          <View className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <Text className="font-lexend font-semibold text-red-700 text-sm">
              🔒 Chi nhánh này hiện đã đóng cửa.
            </Text>
          </View>
        )}

        <View className="gap-4 mb-6">
          {branch.status !== 'CLOSED' && (
            <Button 
              title={branch.status === 'FULL' ? 'Chi nhánh đầy — Liên hệ' : 'Đặt bàn'}
              onPress={() => {
                if (branch.status === 'FULL') {
                  Alert.alert('Chi nhánh đầy', 'Chi nhánh hiện đã quá tải. Vui lòng thử chi nhánh khác hoặc quay lại sau.');
                  return;
                }
                if (!isAuthenticated) {
                  Alert.alert(
                    'Yêu cầu đăng nhập',
                    'Bạn cần đăng nhập để đặt bàn.',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') },
                    ]
                  );
                } else {
                  router.push(`/booking/${id}`);
                }
              }}
            />
          )}
          <Button 
            title={showMenu ? 'Ẩn thực đơn' : 'Xem thực đơn'}
            variant="outline"
            onPress={() => {
              if (showMenu) {
                setShowMenu(false);
              } else {
                fetchMenu();
              }
            }}
          />
        </View>

        {/* MENU SECTION */}
        {showMenu && (
          <View className="mb-6">
            <Text className="font-lexend font-bold text-xl text-text mb-4">Menu</Text>
            {menuLoading ? (
              <ActivityIndicator size="small" color="#b45309" />
            ) : menu.length === 0 ? (
              <Text className="font-lexend text-muted text-center py-4">No menu items available</Text>
            ) : (
              menu.map((category: any, idx: number) => (
                <View key={category._id || idx} className="mb-4">
                  <Text className="font-lexend font-bold text-lg text-primary mb-2">
                    {category.category || category.name || 'Category'}
                  </Text>
                  {(category.items || []).map((item: any, itemIdx: number) => (
                    <View key={item._id || itemIdx} className="flex-row justify-between items-center bg-white rounded-md p-3 mb-2 border border-gray-100">
                      <View className="flex-1 pr-3">
                        <Text className="font-lexend font-semibold text-text">{item.name}</Text>
                        {item.description && (
                          <Text className="font-lexend text-muted text-xs mt-1" numberOfLines={2}>{item.description}</Text>
                        )}
                      </View>
                      <Text className="font-lexend font-bold text-primary">
                        {item.price?.toLocaleString() || '0'}đ
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
