import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/hooks/useAuthStore';
import apiClient from '@/lib/axios';
import { BranchService } from '../branch/branch.service';

export function BranchManageFeature() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [branch, setBranch] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const branchId = user?.branch_id;

  const fetchData = useCallback(async () => {
    try {
      const branchRes = await BranchService.getMyBranch();
      if (branchRes.success && branchRes.data) {
        setBranch(branchRes.data);
        const currentBranchId = branchRes.data._id;
        const bookingsRes = await apiClient.get('/bookings', { params: { branch_id: currentBranchId } });
        if (bookingsRes.data.success) {
          setBookings(bookingsRes.data.data || []);
        }
      }
    } catch (error) {
      console.log('Error fetching manager data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBookingAction = async (bookingId: string, status: string) => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status });
      Alert.alert('Thành công', 'Cập nhật trạng thái thành công');
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật');
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
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="font-lexend font-bold text-xl text-text mb-2">Chưa chỉ định chi nhánh</Text>
        <Text className="font-lexend text-muted text-center">Tài khoản của bạn cần được chỉ định quản lý một chi nhánh.</Text>
      </View>
    );
  }

  const addressText = typeof branch?.address === 'object'
    ? branch.address?.full || `${branch.address?.street || ''}, ${branch.address?.district || ''}, ${branch.address?.city || ''}`
    : branch?.address || '';

  // Count tables by status
  const allTables: any[] = [];
  (branch?.zones || []).forEach((zone: any) => {
    (zone.tables || []).forEach((table: any) => allTables.push(table));
  });
  const available = allTables.filter(t => t.status === 'EMPTY').length;
  const occupied = allTables.filter(t => t.status === 'OCCUPIED').length;

  const activeBookings = bookings.filter(b => 
    ['HOLDING', 'PENDING_PAYMENT', 'PENDING_DEPOSIT', 'CONFIRMED', 'IN_USE'].includes(b.status)
  );

  const statusMap: Record<string, string> = {
    HOLDING: 'Đang giữ',
    PENDING_PAYMENT: 'Chờ thanh toán',
    PENDING_DEPOSIT: 'Chờ đặt cọc',
    CONFIRMED: 'Đã xác nhận',
    IN_USE: 'Đang phục vụ',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
  };

  return (
    <ScrollView 
      className="flex-1 bg-[#F9FAFB]"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={['#b45309']} />}
    >
      <View className="px-4 pt-6 pb-2">
        <Text className="font-lexend font-bold text-2xl text-text">Chi nhánh: {branch?.name || 'SpotOn'}</Text>
        <Text className="font-lexend text-gray-500 text-xs mt-1">Quản lý thông tin và các giới hạn vận hành của chi nhánh.</Text>
      </View>

      {/* Hồ sơ chi nhánh */}
      <View className="px-4 pt-2 pb-4">
        <View className="bg-white rounded-2xl p-5 border border-yellow-100 shadow-sm">
          <View className="flex-row items-center mb-5">
            <View className="w-10 h-10 bg-yellow-50 rounded-xl items-center justify-center mr-3">
              <FontAwesome name="building-o" size={18} color="#ca8a04" />
            </View>
            <View className="flex-1">
              <Text className="font-lexend font-bold text-base text-text">Hồ sơ chi nhánh</Text>
              <Text className="font-lexend text-xs text-gray-500">Thông tin cơ bản của chi nhánh bạn quản lý</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between mb-4">
            <View className="flex-1 mr-2">
              <Text className="font-lexend text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Tên chi nhánh</Text>
              <Text className="font-lexend font-semibold text-sm text-text">{branch?.name}</Text>
            </View>
            <View className="flex-1 ml-2">
              <Text className="font-lexend text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Hotline</Text>
              <Text className="font-lexend font-semibold text-sm text-orange-600">
                <FontAwesome name="phone" size={12} /> {branch?.hotline || 'Chưa cập nhật'}
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Địa chỉ</Text>
            <View className="flex-row items-start">
              <FontAwesome name="map-marker" size={12} color="#f59e0b" style={{ marginTop: 2, marginRight: 6 }} />
              <Text className="font-lexend font-medium text-sm text-text flex-1 leading-5">{addressText}</Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-lexend text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Quản lý trực tiếp</Text>
            <View className="flex-row items-center">
              <FontAwesome name="user-circle-o" size={12} color="#f59e0b" style={{ marginRight: 6 }} />
              <Text className="font-lexend font-medium text-sm text-text">
                {branch?.manager_id?.full_name || 'Chưa phân công'}
              </Text>
            </View>
          </View>
          
          <View>
            <Text className="font-lexend text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Tiện ích chi nhánh</Text>
            {branch?.amenities && branch.amenities.length > 0 ? (
              <View className="flex-row flex-wrap mt-1">
                {branch.amenities.map((amenity: any, idx: number) => (
                  <View key={idx} className="bg-gray-100 rounded px-2 py-1 mr-2 mb-2">
                    <Text className="font-lexend text-xs text-gray-600">{amenity.name || amenity}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="font-lexend italic text-xs text-gray-400">Không có tiện ích nào</Text>
            )}
          </View>
        </View>
      </View>

      {/* Operational Rules (Ca phục vụ) */}
      <View className="px-4 pb-4">
        <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <Text className="font-lexend font-bold text-base text-text mb-1">Operational Rules</Text>
          <Text className="font-lexend font-bold text-sm text-text mb-1">Service Periods (Ca phục vụ)</Text>
          <Text className="font-lexend text-xs text-gray-500 mb-4 leading-5">Thời gian mở cửa và nhận khách cho từng ca. Các mốc thời gian này được tải mặc định từ hệ thống.</Text>

          {/* Ca Trưa */}
          <View className="mb-5">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
              <Text className="font-lexend font-bold text-text text-sm">Ca Trưa (Lunch)</Text>
            </View>
            
            <View className="flex-row mb-3 gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Giờ mở cửa</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.lunch?.start || '08:00'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Đóng cửa</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.lunch?.end || '14:00'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Nhận khách cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.lunch?.last_booking || '13:00'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Order cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.lunch?.last_order || '13:30'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
            </View>
          </View>

          {/* Ca Tối */}
          <View>
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="font-lexend font-bold text-text text-sm">Ca Tối (Dinner)</Text>
            </View>
            
            <View className="flex-row mb-3 gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Giờ mở cửa</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.dinner?.start || '17:00'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Đóng cửa</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.dinner?.end || '22:00'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Nhận khách cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.dinner?.last_booking || '21:00'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Order cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-2 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-lexend text-sm text-text">{branch?.service_periods?.dinner?.last_order || '21:30'}</Text>
                  <FontAwesome name="clock-o" size={14} color="#9ca3af" />
                </View>
              </View>
            </View>
          </View>

        </View>
      </View>

      {/* Stats Cards */}
      <View className="flex-row px-4 py-4 gap-3">
        <View className="flex-1 bg-white rounded-md p-4 border border-gray-100">
          <Text className="font-lexend text-muted text-xs">Tổng số bàn</Text>
          <Text className="font-lexend font-bold text-2xl text-text">{allTables.length}</Text>
        </View>
        <View className="flex-1 bg-green-50 rounded-md p-4 border border-green-100">
          <Text className="font-lexend text-green-600 text-xs">Bàn trống</Text>
          <Text className="font-lexend font-bold text-2xl text-green-700">{available}</Text>
        </View>
        <View className="flex-1 bg-red-50 rounded-md p-4 border border-red-100">
          <Text className="font-lexend text-red-600 text-xs">Đang phục vụ</Text>
          <Text className="font-lexend font-bold text-2xl text-red-700">{occupied}</Text>
        </View>
      </View>

      {/* Grid Menu cho các chức năng quản lý */}
      <View className="px-4 pb-4">
        <Text className="font-lexend font-bold text-lg text-text mb-3">Chức năng quản lý</Text>
        <View className="flex-row flex-wrap justify-between">
          {[
            { name: 'Thực đơn', icon: 'book', route: '/(tabs)/menu-manage' },
            { name: 'Check-in (Kanban)', icon: 'columns', route: '/(tabs)/kanban' },
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

      {/* Active Bookings */}
      <View className="px-4 pb-4">
        <Text className="font-lexend font-bold text-lg text-text mb-3">
          Đơn đặt bàn đang hoạt động ({activeBookings.length})
        </Text>
        
        {activeBookings.length === 0 ? (
          <View className="bg-white rounded-md p-6 border border-gray-100 items-center">
            <Text className="font-lexend text-muted">Không có đơn đặt bàn nào</Text>
          </View>
        ) : (
          activeBookings.map((booking) => (
            <View key={booking._id} className="bg-white rounded-md p-4 mb-3 border border-gray-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-lexend font-bold text-text">
                  {booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai'}
                </Text>
                <View className={`px-2 py-1 rounded-full ${
                  booking.status === 'CONFIRMED' ? 'bg-blue-100' :
                  booking.status === 'IN_USE' ? 'bg-green-100' :
                  booking.status === 'HOLDING' ? 'bg-yellow-100' :
                  booking.status === 'PENDING_DEPOSIT' ? 'bg-amber-100' :
                  booking.status === 'PENDING_PAYMENT' ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <Text className={`text-[10px] font-lexend font-bold ${
                    booking.status === 'CONFIRMED' ? 'text-blue-700' :
                    booking.status === 'IN_USE' ? 'text-green-700' :
                    booking.status === 'HOLDING' ? 'text-yellow-700' :
                    booking.status === 'PENDING_DEPOSIT' ? 'text-amber-700' :
                    booking.status === 'PENDING_PAYMENT' ? 'text-orange-700' : 'text-gray-500'
                  }`}>
                    {statusMap[booking.status] || booking.status}
                  </Text>
                </View>
              </View>
              <Text className="font-lexend text-muted text-sm">
                Số khách: {booking.guest_count} • {new Date(booking.reservation_date).toLocaleDateString('vi-VN')} {booking.arrival_time}
              </Text>
              
              {['HOLDING', 'PENDING_DEPOSIT', 'PENDING_PAYMENT'].includes(booking.status) && (
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    className="flex-1 bg-blue-600 py-2 rounded-md items-center"
                    onPress={() => handleBookingAction(booking._id, 'CONFIRMED')}
                  >
                    <Text className="font-lexend text-white font-bold text-sm">Xác nhận</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-red-500 py-2 rounded-md items-center"
                    onPress={() => handleBookingAction(booking._id, 'CANCELLED')}
                  >
                    <Text className="font-lexend text-white font-bold text-sm">Hủy</Text>
                  </TouchableOpacity>
                </View>
              )}
              {booking.status === 'CONFIRMED' && (
                <TouchableOpacity
                  className="mt-3 bg-green-600 py-2 rounded-md items-center"
                  onPress={() => handleBookingAction(booking._id, 'IN_USE')}
                >
                  <Text className="font-lexend text-white font-bold text-sm">Nhận bàn</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
