import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { BookingService } from '@/features/booking/booking.service';
import { useAuthStore } from '@/stores/useAuthStore';

export default function StatisticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      if (user?.branch_id) {
        // Lấy tất cả bookings (có thể lọc theo tháng sau này)
        const res = await BookingService.getAllBookings({ branch_id: user.branch_id });
        if (res.success) {
          const bookings = res.data || [];
          
          let totalRevenue = 0;
          let completedCount = 0;
          let cancelledCount = 0;
          let totalGuests = 0;

          bookings.forEach((b: any) => {
            if (b.status === 'COMPLETED') {
              completedCount++;
              totalRevenue += (b.final_bill_amount || 0) + (b.total_deposit_paid || 0);
              totalGuests += (b.guest_count || 0);
            } else if (b.status.startsWith('CANCELLED')) {
              cancelledCount++;
            }
          });

          setStats({
            totalRevenue,
            completedCount,
            cancelledCount,
            totalGuests,
            totalBookings: bookings.length
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      Alert.alert('Lỗi', 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-4">
        <TouchableOpacity 
          onPress={() => router.push(user?.role === 'ADMIN' ? '/admin-dashboard' : '/branch-manage')} 
          className="mr-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
        >
          <FontAwesome name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="font-lexend font-bold text-2xl text-text flex-1">Thống kê</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Doanh thu */}
        <View className="bg-orange-600 rounded-2xl p-5 mb-5 shadow-md shadow-orange-600/30">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-lexend text-white/90 text-sm">Tổng doanh thu (Hoàn thành)</Text>
            <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center">
              <FontAwesome name="money" size={14} color="#fff" />
            </View>
          </View>
          <Text className="font-lexend font-bold text-white text-3xl">
            {stats?.totalRevenue?.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        {/* Grid Stats */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm">
            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mb-2">
              <FontAwesome name="calendar-check-o" size={14} color="#3b82f6" />
            </View>
            <Text className="font-lexend text-gray-500 text-xs mb-1">Đơn hoàn thành</Text>
            <Text className="font-lexend font-bold text-xl text-text">{stats?.completedCount}</Text>
          </View>
          
          <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm">
            <View className="w-8 h-8 bg-red-50 rounded-full items-center justify-center mb-2">
              <FontAwesome name="times-circle" size={14} color="#ef4444" />
            </View>
            <Text className="font-lexend text-gray-500 text-xs mb-1">Đơn bị hủy</Text>
            <Text className="font-lexend font-bold text-xl text-text">{stats?.cancelledCount}</Text>
          </View>

          <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm">
            <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center mb-2">
              <FontAwesome name="users" size={14} color="#22c55e" />
            </View>
            <Text className="font-lexend text-gray-500 text-xs mb-1">Lượt khách phục vụ</Text>
            <Text className="font-lexend font-bold text-xl text-text">{stats?.totalGuests}</Text>
          </View>
          
          <View className="w-[48%] bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm">
            <View className="w-8 h-8 bg-purple-50 rounded-full items-center justify-center mb-2">
              <FontAwesome name="list-alt" size={14} color="#a855f7" />
            </View>
            <Text className="font-lexend text-gray-500 text-xs mb-1">Tổng đơn phát sinh</Text>
            <Text className="font-lexend font-bold text-xl text-text">{stats?.totalBookings}</Text>
          </View>
        </View>
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
