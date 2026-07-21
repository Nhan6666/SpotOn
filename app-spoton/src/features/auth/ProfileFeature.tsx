import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';
import { AuthService } from './auth.service';

export function ProfileFeature() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const router = useRouter();
  const [branchName, setBranchName] = useState<string | null>(null);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: ''
  });

  useEffect(() => {
    if (user?.branch_id) {
      if (typeof user.branch_id === 'object') {
        setBranchName((user.branch_id as any).name || 'Không xác định');
      } else {
        setLoadingBranch(true);
        apiClient.get(`/branches/${user.branch_id}`)
          .then(res => {
            if (res.data?.success) {
              setBranchName(res.data.data.name);
            }
          })
          .catch(err => console.log('Error fetching branch:', err))
          .finally(() => setLoadingBranch(false));
      }
    }
  }, [user?.branch_id]);

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

  const openEditModal = () => {
    setEditForm({
      full_name: user?.full_name || '',
      phone: user?.phone || ''
    });
    setEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!editForm.full_name) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }
    try {
      setUpdating(true);
      const res = await AuthService.updateProfile({
        full_name: editForm.full_name,
        phone: editForm.phone
      });
      if (res.success) {
        Alert.alert('Thành công', 'Cập nhật thông tin thành công');
        setEditModalVisible(false);
        checkAuth(); // Refresh user info in store
      } else {
        Alert.alert('Lỗi', res.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setUpdating(false);
    }
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
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
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
        
        <TouchableOpacity className="py-3" onPress={openEditModal}>
          <Text className="font-lexend text-primary">Sửa thông tin</Text>
        </TouchableOpacity>

        {(user.role === 'WAITER' || user.role === 'MANAGER' || user.role === 'KITCHEN') && user.branch_id && (
          <View className="flex-row justify-between py-3">
            <Text className="font-lexend text-text">Chi nhánh</Text>
            {loadingBranch ? (
              <ActivityIndicator size="small" color="#b45309" />
            ) : (
              <Text className="font-lexend text-muted">{branchName || user.branch_id}</Text>
            )}
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

      {user.role === 'CUSTOMER' && (
        <View className="mb-6">
          <Text className="font-lexend font-bold text-gray-500 mb-2 uppercase text-xs">Tiện ích của bạn</Text>
          <View className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
            <TouchableOpacity 
              onPress={() => router.push('/wallet')}
              className="flex-row items-center p-4 border-b border-gray-50"
            >
              <FontAwesome name="ticket" size={16} color="#ea580c" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Ví Voucher</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/bookings')}
              className="flex-row items-center p-4"
            >
              <FontAwesome name="calendar" size={16} color="#0ea5e9" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Lịch sử đặt bàn</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {user.role === 'ADMIN' && (
        <View className="mb-6">
          <Text className="font-lexend font-bold text-gray-500 mb-2 uppercase text-xs">Quản trị hệ thống</Text>
          <View className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
            <TouchableOpacity 
              onPress={() => router.push('/admin-users')}
              className="flex-row items-center p-4 border-b border-gray-50"
            >
              <FontAwesome name="users" size={16} color="#4b5563" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Tài khoản nhân sự</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/admin-categories')}
              className="flex-row items-center p-4 border-b border-gray-50"
            >
              <FontAwesome name="tags" size={16} color="#4b5563" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Danh mục thực đơn</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/admin-map-templates')}
              className="flex-row items-center p-4 border-b border-gray-50"
            >
              <FontAwesome name="th-large" size={16} color="#4b5563" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Mẫu sơ đồ bàn</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/admin-reviews')}
              className="flex-row items-center p-4 border-b border-gray-50"
            >
              <FontAwesome name="star" size={16} color="#4b5563" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Đánh giá từ khách</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/admin-system-config')}
              className="flex-row items-center p-4 border-b border-gray-50"
            >
              <FontAwesome name="cog" size={16} color="#4b5563" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Chính sách đặt bàn</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/admin-amenities')}
              className="flex-row items-center p-4"
            >
              <FontAwesome name="wifi" size={16} color="#4b5563" style={{ width: 24 }} />
              <Text className="font-lexend text-gray-800 flex-1 ml-2">Tiện ích nhà hàng</Text>
              <FontAwesome name="angle-right" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View className="mt-2 mb-8">
        <Button 
          title="Đăng xuất"
          variant="danger"
          onPress={handleLogout}
        />
      </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-lexend font-bold text-xl text-text">Sửa thông tin</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 bg-gray-100 rounded-full">
                <FontAwesome name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="font-lexend text-sm text-gray-500 mb-2">Họ và tên *</Text>
              <TextInput 
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-lexend text-text"
                value={editForm.full_name}
                onChangeText={t => setEditForm({...editForm, full_name: t})}
                placeholder="Nhập họ tên"
              />
            </View>

            <View className="mb-6">
              <Text className="font-lexend text-sm text-gray-500 mb-2">Số điện thoại</Text>
              <TextInput 
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-lexend text-text"
                value={editForm.phone}
                onChangeText={t => setEditForm({...editForm, phone: t})}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            <Button 
              title={updating ? "Đang lưu..." : "Lưu thay đổi"}
              onPress={handleUpdateProfile}
              disabled={updating}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
