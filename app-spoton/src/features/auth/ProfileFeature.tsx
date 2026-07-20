import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';

export function ProfileFeature() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đăng xuất", 
          style: "destructive",
          onPress: async () => {
            await logout();
            setTimeout(() => {
              router.replace('/');
            }, 100);
          }
        }
      ]
    );
  };

  // GUEST MODE: Show login/register buttons
  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-gray-300 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-3xl font-lexend font-bold">?</Text>
          </View>
          <Text className="font-lexend font-bold text-2xl text-text">Chào mừng đến SpotOn</Text>
          <Text className="font-lexend text-muted mt-2 text-center">
            Đăng nhập để đặt bàn, theo dõi lịch đặt và nhiều hơn.
          </Text>
        </View>

        <View className="gap-4">
          <Button 
            title="Đăng nhập"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button 
            title="Tạo tài khoản"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      </View>
    );
  }

  // LOGGED IN: Show profile info
  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4 shadow-sm">
          <Text className="text-white text-3xl font-lexend font-bold">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text className="font-lexend font-bold text-2xl text-text">{user.full_name}</Text>
        <Text className="font-lexend text-muted">{user.email}</Text>
        <View className="mt-2 px-3 py-1 bg-amber-100 rounded-full">
          <Text className="text-primary font-lexend font-bold text-xs uppercase">{user.role}</Text>
        </View>
      </View>

      <View className="bg-white rounded-md p-4 shadow-sm border border-gray-100 mb-6">
        <View className="flex-row justify-between py-3 border-b border-gray-50">
          <Text className="font-lexend text-text">Số điện thoại</Text>
          <Text className="font-lexend text-muted">{user.phone || 'Chưa cung cấp'}</Text>
        </View>
        
        {user.role === 'CUSTOMER' && (
          <>
            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="font-lexend text-text">Dị ứng</Text>
              <Text className="font-lexend text-muted">{user.profile_allergies || 'Không có'}</Text>
            </View>
            <TouchableOpacity className="py-3">
              <Text className="font-lexend text-primary">Sửa thông tin</Text>
            </TouchableOpacity>
          </>
        )}

        {(user.role === 'WAITER' || user.role === 'MANAGER' || user.role === 'KITCHEN') && user.branch_id && (
          <View className="flex-row justify-between py-3">
            <Text className="font-lexend text-text">Chi nhánh</Text>
            <Text className="font-lexend text-muted">{user.branch_id}</Text>
          </View>
        )}
      </View>

      {(user.role === 'MANAGER' || user.role === 'ADMIN') && (
        <View className="mb-6">
          <Text className="font-lexend font-bold text-lg text-text mb-3">Chức năng quản lý</Text>
          <View className="flex-row flex-wrap justify-between">
            {[
              { name: 'Thực đơn', icon: 'book', route: '/(tabs)/menu-manage' },
              { name: 'Đối soát hóa đơn', icon: 'file-text-o', route: '/(tabs)/invoices' },
              { name: 'Lịch sử giao dịch', icon: 'history', route: '/(tabs)/transactions' },
              { name: 'Thống kê', icon: 'bar-chart', route: '/(tabs)/statistics' },
              { name: 'Khuyến mãi', icon: 'gift', route: '/(tabs)/promotions' },
            ].map((menu, index) => (
              <TouchableOpacity 
                key={index}
                className="w-[31%] bg-white rounded-lg p-3 mb-3 items-center border border-gray-100 shadow-sm"
                onPress={() => router.push(menu.route as any)}
              >
                <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center mb-2">
                  <FontAwesome name={menu.icon as any} size={18} color="#ea580c" />
                </View>
                <Text className="font-lexend text-xs text-center text-text">{menu.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Button 
        title="Đăng xuất"
        variant="danger"
        onPress={handleLogout}
      />
    </View>
  );
}
