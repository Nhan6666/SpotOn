import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { BranchService } from '../branch/branch.service';
import apiClient from '@/lib/axios';

export function ManagerDashboardFeature() {
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, waitlist: 0, tableOccupancy: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch branch info
      const branchRes = await BranchService.getMyBranch();
      if (branchRes.success && branchRes.data) {
        setBranch(branchRes.data);
      }
      
      // Normally we would call a stats endpoint:
      // const statsRes = await apiClient.get('/dashboard/stats');
      // For now, mock realistic stats calculation based on orders/bookings:
      setStats({
        revenue: 12500000,
        bookings: 42,
        waitlist: 8,
        tableOccupancy: 75
      });
    } catch (error) {
      console.log('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: 'is_accepting_walk_ins' | 'is_overloaded') => {
    if (!branch) return;
    
    const newValue = !branch[field];
    setBranch({ ...branch, [field]: newValue }); // optimistic update
    
    try {
      // Assuming a generic update endpoint or specific toggles
      // PATCH /api/v1/branches/:id/settings
      await apiClient.patch(`/branches/${branch._id}`, {
        [field]: newValue
      });
    } catch (error) {
      // rollback
      setBranch({ ...branch, [field]: !newValue });
      Alert.alert('Lỗi', 'Không thể cập nhật thiết lập chi nhánh');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-6">
      <Text className="font-lexend font-bold text-3xl text-text mb-6">Tổng quan</Text>
      
      <View className="flex-row flex-wrap justify-between">
        <View className="w-[48%] bg-white rounded-md p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="font-lexend text-muted mb-2">Doanh thu hôm nay</Text>
          <Text className="font-lexend font-bold text-xl text-primary">{stats.revenue.toLocaleString()}đ</Text>
          <Text className="font-lexend text-xs text-green-500 mt-1">+15% so với hôm qua</Text>
        </View>
        
        <View className="w-[48%] bg-white rounded-md p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="font-lexend text-muted mb-2">Đơn đặt bàn</Text>
          <Text className="font-lexend font-bold text-xl text-text">{stats.bookings}</Text>
          <Text className="font-lexend text-xs text-muted mt-1">12 đang chờ</Text>
        </View>

        <View className="w-[48%] bg-white rounded-md p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="font-lexend text-muted mb-2">Khách chờ</Text>
          <Text className="font-lexend font-bold text-xl text-amber-500">{stats.waitlist}</Text>
          <Text className="font-lexend text-xs text-muted mt-1">Đang xếp hàng</Text>
        </View>

        <View className="w-[48%] bg-white rounded-md p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="font-lexend text-muted mb-2">Công suất bàn</Text>
          <Text className="font-lexend font-bold text-xl text-text">{stats.tableOccupancy}%</Text>
          <Text className="font-lexend text-xs text-red-500 mt-1">Gần kín chỗ</Text>
        </View>
      </View>

      <View className="bg-white rounded-md p-4 mt-2 shadow-sm border border-gray-100">
        <Text className="font-lexend font-bold text-lg text-text mb-4">Trạng thái chi nhánh</Text>
        
        <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
          <View>
            <Text className="font-lexend text-text text-base">Nhận khách vãng lai</Text>
            <Text className="font-lexend text-muted text-xs">Cho phép khách đến không cần đặt trước</Text>
          </View>
          <Switch 
            value={branch?.is_accepting_walk_ins ?? true} 
            onValueChange={() => handleToggle('is_accepting_walk_ins')}
            trackColor={{ false: "#d1d5db", true: "#ea580c" }}
          />
        </View>
        
        <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
          <View>
            <Text className="font-lexend text-text text-base">Cảnh báo quá tải</Text>
            <Text className="font-lexend text-muted text-xs">Đánh dấu chi nhánh đã hết bàn</Text>
          </View>
          <Switch 
            value={branch?.is_overloaded ?? false} 
            onValueChange={() => handleToggle('is_overloaded')}
            trackColor={{ false: "#d1d5db", true: "#ef4444" }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
