import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import apiClient from '@/lib/http';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';

interface ChainStats {
  revenueToday: number;
  ordersToday: number;
  activeBranches: number;
  overloadedBranches: number;
  totalBranches: number;
}

const mockRevenueData = {
  labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  datasets: [{ data: [12.5, 15.2, 14.8, 18.5, 24.0, 32.5, 28.0] }]
};

const mockOrderData = {
  labels: ['Sáng', 'Trưa', 'Chiều', 'Tối'],
  datasets: [{ data: [45, 120, 60, 155] }]
};

const screenWidth = Dimensions.get('window').width;
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, 1)`, // gray-500
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#10b981"
  },
  propsForBackgroundLines: {
    stroke: "#f3f4f6", // gray-100
    strokeDasharray: "0" // solid lines
  }
};

const barChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  fillShadowGradient: "#3b82f6", // solid blue
  fillShadowGradientOpacity: 0.8,
  decimalPlaces: 0,
};

export function AdminDashboardFeature() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const gridItems = [
    { id: 'branches', name: 'Chi nhánh', icon: 'building', color: '#3b82f6', route: '/admin/branches' },
    { id: 'menu', name: 'Thực đơn', icon: 'book', color: '#10b981', route: '/admin/menu' },
    { id: 'accounts', name: 'Tài khoản', icon: 'users', color: '#8b5cf6', route: '/admin/accounts' },
    { id: 'vouchers', name: 'Khuyến mãi', icon: 'ticket', color: '#f59e0b', route: '/admin/vouchers' },
    { id: 'finance', name: 'Tài chính', icon: 'money', color: '#ec4899', route: '/admin/finance' },
    { id: 'settings', name: 'Hệ thống', icon: 'cog', color: '#64748b', route: '/admin/settings' },
  ];

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/stats/chain/dashboard');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching admin dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading && !stats) {
    return (
      <View className="flex-1 bg-[#F9FAFB] justify-center items-center">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ea580c"]} />
        }
      >
        {/* Header */}
        <View className="bg-white px-5 pt-6 pb-4 border-b border-gray-100 shadow-sm z-10 mb-4 flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="font-lexend font-bold text-2xl text-gray-900 mb-1">Tổng quan toàn chuỗi</Text>
            <Text className="font-lexend text-xs text-gray-500">Xin chào {user?.full_name}, hệ thống báo cáo.</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/')}
            className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center border border-orange-100 ml-2"
          >
            <FontAwesome name="home" size={20} color="#ea580c" />
          </TouchableOpacity>
        </View>

        {stats && (
          <View className="px-4">
            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between">
              
              {/* Doanh thu */}
              <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 w-[48%] relative overflow-hidden">
                <View className="absolute top-0 right-0 p-3 opacity-10">
                  <FontAwesome name="line-chart" size={40} color="#10b981" />
                </View>
                <View className="flex-row items-center mb-3 relative z-10">
                  <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mr-2">
                    <FontAwesome name="money" size={14} color="#10b981" />
                  </View>
                  <Text className="font-lexend font-medium text-gray-600 text-[10px]">Doanh thu (Hôm nay)</Text>
                </View>
                <Text className="font-lexend font-bold text-lg text-gray-900 relative z-10">
                  {formatVND(stats.revenueToday)}
                </Text>
              </View>

              {/* Số đơn */}
              <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 w-[48%] relative overflow-hidden">
                <View className="absolute top-0 right-0 p-3 opacity-10">
                  <FontAwesome name="users" size={40} color="#3b82f6" />
                </View>
                <View className="flex-row items-center mb-3 relative z-10">
                  <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-2">
                    <FontAwesome name="shopping-bag" size={14} color="#3b82f6" />
                  </View>
                  <Text className="font-lexend font-medium text-gray-600 text-[10px]">Tổng số đơn (HT)</Text>
                </View>
                <Text className="font-lexend font-bold text-xl text-gray-900 relative z-10">
                  {stats.ordersToday}
                </Text>
              </View>

              {/* Chi nhánh đang mở */}
              <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 w-[48%] relative overflow-hidden">
                <View className="absolute top-0 right-0 p-3 opacity-10">
                  <FontAwesome name="building" size={40} color="#ea580c" />
                </View>
                <View className="flex-row items-center mb-3 relative z-10">
                  <View className="w-8 h-8 rounded-lg bg-orange-50 items-center justify-center mr-2">
                    <FontAwesome name="building-o" size={14} color="#ea580c" />
                  </View>
                  <Text className="font-lexend font-medium text-gray-600 text-[10px]">Chi nhánh mở</Text>
                </View>
                <View className="flex-row items-baseline relative z-10">
                  <Text className="font-lexend font-bold text-xl text-gray-900">
                    {stats.activeBranches}
                  </Text>
                  <Text className="font-lexend text-xs text-gray-500 ml-1">/ {stats.totalBranches}</Text>
                </View>
              </View>

              {/* Cảnh báo quá tải */}
              <View className={`rounded-xl shadow-sm border p-4 mb-4 w-[48%] relative overflow-hidden ${stats.overloadedBranches > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                <View className="absolute top-0 right-0 p-3 opacity-10">
                  <FontAwesome name="exclamation-circle" size={40} color={stats.overloadedBranches > 0 ? '#ef4444' : '#9ca3af'} />
                </View>
                <View className="flex-row items-center mb-3 relative z-10">
                  <View className={`w-8 h-8 rounded-lg items-center justify-center mr-2 ${stats.overloadedBranches > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <FontAwesome name="warning" size={14} color={stats.overloadedBranches > 0 ? '#dc2626' : '#4b5563'} />
                  </View>
                  <Text className={`font-lexend font-medium text-[10px] ${stats.overloadedBranches > 0 ? 'text-red-700' : 'text-gray-600'}`}>Báo động đỏ</Text>
                </View>
                <View className="flex-row justify-between items-center relative z-10">
                  <Text className={`font-lexend font-bold text-xl ${stats.overloadedBranches > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {stats.overloadedBranches}
                  </Text>
                  {stats.overloadedBranches > 0 && (
                    <View className="bg-red-600 px-2 py-0.5 rounded-full">
                      <Text className="font-lexend text-[8px] font-bold text-white">CẦN CHÚ Ý</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>



            {/* Doanh thu Chart */}
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mr-3">
                  <FontAwesome name="line-chart" size={14} color="#10b981" />
                </View>
                <View>
                  <Text className="font-lexend font-bold text-sm text-gray-900">Doanh thu 7 ngày qua</Text>
                  <Text className="font-lexend text-[10px] text-gray-500">Dữ liệu tham khảo (Triệu VNĐ)</Text>
                </View>
              </View>
              <LineChart
                data={mockRevenueData}
                width={screenWidth - 64} // padding 4 + 4 + 16 + 16
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12, marginLeft: -16 }}
                withDots={true}
                withInnerLines={true}
                yAxisLabel=""
                yAxisSuffix="M"
                formatYLabel={(yValue: string) => parseFloat(yValue).toString()}
                fromZero={true}
              />
            </View>

            {/* Số đơn Chart */}
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3">
                  <FontAwesome name="bar-chart" size={14} color="#3b82f6" />
                </View>
                <View>
                  <Text className="font-lexend font-bold text-sm text-gray-900">Đơn hàng theo khung giờ</Text>
                  <Text className="font-lexend text-[10px] text-gray-500">Dữ liệu tham khảo</Text>
                </View>
              </View>
              <BarChart
                data={mockOrderData}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={barChartConfig}
                style={{ borderRadius: 12, marginLeft: -16 }}
                withInnerLines={true}
                showValuesOnTopOfBars={true}
                showBarTops={false}
                fromZero={true}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
