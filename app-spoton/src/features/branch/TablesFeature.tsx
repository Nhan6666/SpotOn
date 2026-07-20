import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { BranchService } from './branch.service';
import { useAuthStore } from '@/stores/useAuthStore';
import apiClient from '@/lib/http';
import { WalkInModal } from './components/WalkInModal';
import { BookingService } from '../booking/booking.service';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export function TablesFeature() {
  const [branch, setBranch] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<'Lunch' | 'Dinner'>('Dinner');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  const [walkInModalVisible, setWalkInModalVisible] = useState(false);
  const [selectedWalkInTable, setSelectedWalkInTable] = useState<any>(null);

  useEffect(() => {
    fetchBranchData();

    // Setup Socket
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.10.100.205:5000/api/v1';
    const newSocket = io(apiUrl.replace('/api/v1', ''));
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && branch?._id) {
      socket.emit('join_branch', branch._id);
      
      socket.on('table_status_changed', (data) => {
        setZones(prevZones => {
          return prevZones.map(zone => ({
            ...zone,
            tables: zone.tables.map((table: any) => 
              data.table_ids.includes(table._id) ? { ...table, status: data.action } : table
            )
          }));
        });
      });
    }
  }, [socket, branch]);

  const fetchBranchData = async () => {
    try {
      const data = await BranchService.getMyBranch(); 
      if (data.success && data.data) {
        setBranch(data.data);
        setZones(data.data.zones || []);
        if (data.data.zones && data.data.zones.length > 0) {
          setActiveZone(data.data.zones[0].name);
        }
        await fetchBookings(data.data._id);
      }
    } catch (error) {
      console.log('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branch?._id) {
      fetchBookings(branch._id);
    }
  }, [selectedDate, branch, activeShift]);

  const fetchBookings = async (branchId: string) => {
    try {
      const res = await BookingService.getAllBookings({ branch_id: branchId });
      if (res.success) {
        const targetDate = selectedDate.toLocaleDateString('vi-VN');
        const activeBookings = res.data.filter((b: any) => 
          ['HOLDING', 'PENDING_DEPOSIT', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_USE'].includes(b.status) &&
          new Date(b.reservation_date).toLocaleDateString('vi-VN') === targetDate &&
          b.shift === activeShift.toUpperCase()
        );
        setBookings(activeBookings);
      }
    } catch (error) {
      console.log('Error fetching bookings for table map:', error);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'EMPTY': return { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', label: 'TRỐNG' };
      case 'HOLDING': return { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', label: 'GIỮ CHỖ' };
      case 'LOCKED': return { bg: 'bg-gray-100', border: 'border-gray-800', text: 'text-gray-800', label: 'BẢO TRÌ' };
      case 'RESERVED': return { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', label: 'ĐÃ ĐẶT' };
      case 'OCCUPIED': 
      case 'IN_USE': return { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700', label: 'ĐANG DÙNG' };
      case 'CLEANING': return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', label: 'DỌN DẸP' };
      default: return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', label: status };
    }
  };

  const getComputedTableStatus = (table: any) => {
    const tableBookings = bookings.filter((b: any) => b.table_ids?.includes(table._id));
    
    if (tableBookings.length > 0) {
      if (tableBookings.some((b: any) => b.status === 'IN_USE')) return 'IN_USE';
      if (tableBookings.some((b: any) => b.status === 'CLEANING')) return 'CLEANING';
      if (tableBookings.some((b: any) => b.status === 'CONFIRMED')) return 'RESERVED';
      if (tableBookings.some((b: any) => ['PENDING_PAYMENT', 'PENDING_DEPOSIT'].includes(b.status))) return 'LOCKED';
      if (tableBookings.some((b: any) => b.status === 'HOLDING')) return 'HOLDING';
    }

    const todayStr = new Date().toLocaleDateString('vi-VN');
    const selectedDateStr = selectedDate.toLocaleDateString('vi-VN');

    if (todayStr === selectedDateStr) {
      return (activeShift === 'Lunch' ? table.status_lunch : table.status_dinner) || table.status || 'EMPTY';
    }

    return 'EMPTY';
  };

  const handleTablePress = (table: any) => {
    if (!branch) return;
    
    const status = getComputedTableStatus(table);
    
    // Role-based actions
    if (status === 'EMPTY') {
      setSelectedWalkInTable(table);
      setWalkInModalVisible(true);
    } else if (status === 'RESERVED' || status === 'HOLDING') {
      Alert.alert(
        "Check-in Khách?",
        `Đánh dấu bàn ${table.table_number} thành ĐANG PHỤC VỤ?`,
        [
          { text: "Hủy", style: "cancel" },
          { 
            text: "Check-in", 
            onPress: async () => {
              try {
                // Find active booking for this table
                const res = await BookingService.getAllBookings({ branch_id: branch._id });
                const activeBooking = res.data.find((b: any) => 
                  (b.status === 'CONFIRMED' || b.status === 'RESERVED' || b.status === 'HOLDING') 
                  && b.table_ids?.includes(table._id)
                );
                
                if (activeBooking) {
                  await BookingService.checkInBooking(activeBooking._id);
                  Alert.alert('Thành công', 'Check-in khách thành công.');
                  fetchBranchData(); // refresh or rely on socket
                } else {
                  Alert.alert('Lỗi', 'Không tìm thấy đơn đặt bàn nào cho bàn này.');
                }
              } catch (e: any) {
                Alert.alert('Lỗi', e.response?.data?.message || 'Không thể check-in');
              }
            }
          }
        ]
      );
    } else if (status === 'IN_USE' || status === 'OCCUPIED') {
      Alert.alert(
        "Hành động",
        `Bàn ${table.table_number} đang ở trạng thái ${status}.`,
        [
          { text: "Hủy", style: "cancel" },
          { 
            text: "Xem đơn / Thêm món", 
            onPress: async () => {
              try {
                const res = await BookingService.getAllBookings({ branch_id: branch._id });
                const activeBooking = res.data.find((b: any) => 
                  b.status === 'IN_USE' && b.table_ids?.includes(table._id)
                );
                if (activeBooking) {
                  router.push(`/booking/detail/${activeBooking._id}`);
                } else {
                  Alert.alert('Lỗi', 'Không tìm thấy đơn đặt bàn nào cho bàn này.');
                }
              } catch (e) {
                Alert.alert('Lỗi', 'Không thể lấy thông tin chi tiết');
              }
            } 
          },
          ...(user?.role === 'MANAGER' ? [{
            text: "Thanh toán (Hoàn thành)",
            onPress: async () => {
              try {
                // Find active booking for this table ID
                const res = await BookingService.getAllBookings({ branch_id: branch._id });
                const activeBooking = res.data.find((b: any) => 
                  b.status === 'IN_USE' && b.table_ids?.includes(table._id)
                );
                
                if (activeBooking) {
                  await apiClient.patch(`/bookings/${activeBooking._id}/status`, { status: 'COMPLETED' });
                  Alert.alert('Thành công', 'Thanh toán thành công. Bàn đã chuyển sang dọn dẹp.');
                } else {
                  Alert.alert('Lỗi', 'Không tìm thấy đơn đặt bàn nào cho bàn này.');
                }
              } catch (e: any) {
                Alert.alert('Lỗi', e.response?.data?.message || 'Không thể thanh toán');
              }
            }
          }] : []),
          { 
            text: "Đánh dấu Đang dọn dẹp", 
            style: "destructive",
            onPress: async () => {
              try {
                await BranchService.updateTableStatus(branch._id, table._id, 'CLEANING');
              } catch (e: any) {
                Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
              }
            }
          }
        ]
      );
    } else if (status === 'CLEANING') {
      Alert.alert(
        "Đã dọn xong?",
        `Đánh dấu bàn ${table.table_number} thành BÀN TRỐNG?`,
        [
          { text: "Hủy", style: "cancel" },
          { 
            text: "Đồng ý, Bàn trống", 
            onPress: async () => {
              try {
                await BranchService.updateTableStatus(branch._id, table._id, 'EMPTY');
              } catch (e: any) {
                Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
              }
            }
          }
        ]
      );
    }
  };

  const currentZone = zones.find(z => z.name === activeZone);

  const handleWalkInSubmit = async (data: any) => {
    try {
      if (!selectedWalkInTable) return;
      await BookingService.createWalkIn({
        table_ids: [selectedWalkInTable._id],
        guest_count: data.guest_count,
        walk_in_name: data.walk_in_name,
        walk_in_phone: data.walk_in_phone
      });
      setWalkInModalVisible(false);
      setSelectedWalkInTable(null);
      Alert.alert('Thành công', 'Đã tạo đơn Walk-in thành công');
      fetchBranchData(); // Refresh or rely on socket
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể tạo đơn');
    }
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* 1. Header & Filters */}
      <View className="bg-white px-4 pt-4 pb-3 shadow-sm z-10 border-b border-gray-100">
        <Text className="font-lexend font-bold text-xl text-text mb-1">Quản lý Đặt bàn & Sơ đồ</Text>
        <Text className="font-lexend text-xs text-gray-500 mb-3">Theo dõi trạng thái bàn theo thời gian thực (Real-time).</Text>
        
        <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 p-2">
          <View className="flex-1 border-r border-gray-200 px-2 flex-row justify-between items-center">
            <View>
              <Text className="font-lexend text-[10px] text-gray-500 mb-1">Ngày</Text>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => changeDate(-1)} className="px-2 py-1 mr-1 bg-white rounded border border-gray-200">
                  <FontAwesome name="chevron-left" size={10} color="#6b7280" />
                </TouchableOpacity>
                <Text className="font-lexend font-bold text-sm text-text mx-1">{selectedDate.toLocaleDateString('vi-VN')}</Text>
                <TouchableOpacity onPress={() => changeDate(1)} className="px-2 py-1 ml-1 bg-white rounded border border-gray-200">
                  <FontAwesome name="chevron-right" size={10} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View className="flex-1 px-3 flex-row justify-between items-center">
            <View>
              <Text className="font-lexend text-[10px] text-gray-500 mb-1">Ca phục vụ</Text>
              <TouchableOpacity onPress={() => setActiveShift(activeShift === 'Lunch' ? 'Dinner' : 'Lunch')} className="flex-row items-center">
                <Text className="font-lexend font-bold text-sm text-text mr-2">Ca {activeShift === 'Lunch' ? 'Trưa' : 'Tối'}</Text>
                <FontAwesome name="chevron-down" size={10} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 2. Danh sách đặt bàn (Top Section on Mobile) */}
        <View className="px-4 pt-4 pb-2">
          <Text className="font-lexend font-bold text-base text-text mb-3">Danh sách đặt bàn ({bookings.length})</Text>
          
          {bookings.length === 0 ? (
            <View className="bg-white p-6 rounded-xl border border-gray-200 items-center">
              <Text className="font-lexend text-gray-500 text-sm">Chưa có đơn đặt bàn nào trong ca này.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 pb-2">
              {bookings.map((booking: any) => (
                <TouchableOpacity 
                  key={booking._id} 
                  className="bg-white rounded-xl border border-gray-200 p-3 mr-3 shadow-sm w-64"
                  onPress={() => router.push(`/booking/detail/${booking._id}`)}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="font-lexend font-bold text-text text-sm mb-1" numberOfLines={1}>
                        {booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai'}
                      </Text>
                      <Text className="font-lexend text-xs text-gray-500">SĐT: {booking.customer_id?.phone || booking.walk_in_phone || 'N/A'}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded ${booking.status === 'IN_USE' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Text className={`font-lexend font-bold text-[8px] ${booking.status === 'IN_USE' ? 'text-green-700' : 'text-blue-700'}`}>
                        {booking.status === 'IN_USE' ? 'ĐANG DÙNG' : booking.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
                    <View>
                      <Text className="font-lexend text-[10px] text-gray-500">Thời gian</Text>
                      <Text className="font-lexend font-bold text-sm text-text">{booking.arrival_time}</Text>
                    </View>
                    <View>
                      <Text className="font-lexend text-[10px] text-gray-500">Số khách</Text>
                      <Text className="font-lexend font-bold text-sm text-text">{booking.guest_count} người</Text>
                    </View>
                    <View>
                      <Text className="font-lexend text-[10px] text-gray-500">Bàn</Text>
                      <Text className="font-lexend font-bold text-sm text-blue-600">
                        {booking.assigned_tables?.length > 0 ? booking.assigned_tables.map((t:any) => t.table_number).join(', ') : 'Chưa xếp'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 3. Sơ đồ bàn (Bottom Section on Mobile) */}
        <View className="bg-white m-4 p-4 rounded-xl border border-gray-200 shadow-sm">
          {/* Legend */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row items-center gap-4">
              {[
                { key: 'EMPTY', label: 'Trống', color: 'bg-green-400' },
                { key: 'HOLDING', label: 'Giữ chỗ', color: 'bg-yellow-400' },
                { key: 'RESERVED', label: 'Đã đặt', color: 'bg-blue-400' },
                { key: 'IN_USE', label: 'Đang dùng', color: 'bg-red-400' },
                { key: 'CLEANING', label: 'Dọn dẹp', color: 'bg-orange-400' },
                { key: 'LOCKED', label: 'Bảo trì', color: 'bg-gray-800' }
              ].map(leg => (
                <View key={leg.key} className="flex-row items-center">
                  <View className={`w-3 h-3 rounded ${leg.color} mr-1.5 opacity-80`} />
                  <Text className="font-lexend text-xs text-gray-600">{leg.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Zones Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-100 mb-4 pb-2">
            {zones.map((zone) => (
              <TouchableOpacity 
                key={zone.name}
                className={`mr-6 pb-2 border-b-2 ${activeZone === zone.name ? 'border-[#14532d]' : 'border-transparent'}`}
                onPress={() => setActiveZone(zone.name)}
              >
                <Text className={`font-lexend font-bold text-sm ${activeZone === zone.name ? 'text-[#14532d]' : 'text-gray-500'}`}>
                  {zone.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Table Grid */}
          {loading ? (
            <ActivityIndicator size="large" color="#14532d" className="my-10" />
          ) : (
            <View className="bg-gray-50 rounded-xl p-2 flex-row flex-wrap justify-center border border-gray-100 border-dashed min-h-[300px]">
              {currentZone?.tables?.map((table: any) => {
                const computedStatus = getComputedTableStatus(table);
                const colors = getTableColor(computedStatus);
                return (
                  <TouchableOpacity 
                    key={table._id || table.table_number}
                    onPress={() => handleTablePress(table)}
                    className={`m-2 w-[40%] rounded-xl items-center justify-center py-4 border-2 ${colors.bg} ${colors.border} shadow-sm`}
                  >
                    <Text className={`font-lexend font-bold text-xl mb-1 ${colors.text}`}>
                      {table.table_number}
                    </Text>
                    <Text className={`font-lexend text-[10px] mb-2 ${colors.text}`}>
                      {table.capacity} chỗ
                    </Text>
                    <View className="bg-white/80 px-2 py-1 rounded shadow-sm">
                      <Text className={`font-lexend font-bold text-[8px] uppercase ${colors.text}`}>
                        {colors.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {selectedWalkInTable && (
        <WalkInModal
          visible={walkInModalVisible}
          onClose={() => {
            setWalkInModalVisible(false);
            setSelectedWalkInTable(null);
          }}
          onSubmit={handleWalkInSubmit}
          tableName={selectedWalkInTable.table_number}
        />
      )}
    </View>
  );
}
