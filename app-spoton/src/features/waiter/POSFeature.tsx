import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, ScrollView } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';
import apiClient from '@/lib/http';
import { FontAwesome } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { MobileOrderMenuModal } from '@/features/ordering/MobileOrderMenuModal';
import DateTimePicker from '@react-native-community/datetimepicker';

export function POSFeature() {
  const { user } = useAuthStore();
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedShift, setSelectedShift] = useState<'LUNCH' | 'DINNER'>(
    new Date().getHours() < 15 ? 'LUNCH' : 'DINNER'
  );
  
  // Zones State
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  
  // Menu & Ordering state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Open Table State
  const [showOpenTableModal, setShowOpenTableModal] = useState(false);
  const [openTargetTable, setOpenTargetTable] = useState<any>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [openingTable, setOpeningTable] = useState(false);

  // Action Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTable, setActionTable] = useState<any>(null);

  const branchId = user?.branch_id;

  const fetchActiveTables = useCallback(async () => {
    if (!branchId) return setLoading(false);
    try {
      // Fetch Zones
      const branchRes = await apiClient.get(`/branches/${branchId}`);
      if (branchRes.data?.success) {
        const fetchedZones = branchRes.data.data.zones || [];
        setZones(fetchedZones);
        
        // Auto-select first zone if none selected or invalid
        if (fetchedZones.length > 0) {
          setSelectedZone(current => {
            if (!current || !fetchedZones.some((z: any) => z.name === current)) {
              return fetchedZones[0].name;
            }
            return current;
          });
        }
      }

      // Fetch Bookings for selected date
      const isToday = new Date().toDateString() === selectedDate.toDateString();
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const res = await BookingService.getAllBookings({ 
        branch_id: branchId,
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString()
      });
      if (res.success) {
        const relevantBookings = (res.data || []).filter((b: any) => {
          let matchesDate = false;
          if (isToday) {
            matchesDate = b.status === 'IN_USE' || b.status === 'CONFIRMED';
          } else {
            matchesDate = b.status === 'CONFIRMED';
          }
          if (!matchesDate) return false;
          
          if (b.shift !== selectedShift) {
            return false;
          }
          return true;
        });
        setActiveBookings(relevantBookings);
      }
    } catch (error) {
      console.log('Error fetching POS tables:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId, selectedDate, selectedShift]);

  useEffect(() => {
    fetchActiveTables();
    const interval = setInterval(fetchActiveTables, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveTables]);

  const handleTablePress = (booking: any) => {
    setSelectedBooking(booking);
    setShowOrderModal(true);
  };

  const submitOpenTable = async () => {
    if (!openTargetTable) return;
    setOpeningTable(true);
    try {
      const res = await apiClient.post('/reception/walk-in', {
        table_ids: [openTargetTable._id],
        assigned_tables: [{ table_number: openTargetTable.table_number, zone_name: openTargetTable.zone_name }],
        guest_count: guestCount,
        note: 'Khách Walk-in (Mở bởi Waiter trên App)'
      });
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã mở bàn mới!');
        setShowOpenTableModal(false);
        fetchActiveTables(); // Refresh
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể mở bàn.');
    } finally {
      setOpeningTable(false);
    }
  };

  const handleUpdateTableStatus = async (tableId: string, status: string) => {
    if (!branchId) return;
    try {
      const res = await apiClient.patch(`/branches/${branchId}/tables/${tableId}/status`, { status });
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã cập nhật trạng thái bàn!');
        setShowActionModal(false);
        fetchActiveTables();
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái.');
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await BookingService.checkInBooking(bookingId);
      if (res.success) {
        Alert.alert('Thành công', 'Đã nhận bàn thành công. Khách có thể bắt đầu gọi món.');
        fetchActiveTables();
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể nhận bàn.');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi nhận bàn.');
    }
  };

  // Flatten all tables from zones and attach zone_name
  const allTables = zones.reduce((acc, zone) => {
    const tablesInZone = (zone.tables || []).map((t: any) => ({ ...t, zone_name: zone.name }));
    return [...acc, ...tablesInZone];
  }, []);

  // Map active bookings by table id and table number
  const activeTableMap = activeBookings.reduce((acc, booking) => {
    (booking.table_ids || []).forEach((tid: string) => {
      acc[tid] = booking;
    });
    (booking.assigned_tables || []).forEach((t: any) => {
      if (t.table_number) acc[t.table_number] = booking;
    });
    return acc;
  }, {} as Record<string, any>);

  const filteredTables = allTables.filter((t: any) => {
    return t.zone_name === selectedZone;
  });

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const onChangeDate = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-5 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="font-lexend font-bold text-xl text-gray-900 mb-1">POS Phục Vụ</Text>
          <Text className="font-lexend text-xs text-gray-500 font-medium">
            Mở bàn mới hoặc gọi thêm món
          </Text>
        </View>
        <TouchableOpacity onPress={() => fetchActiveTables()} className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 items-center justify-center">
          <FontAwesome name="refresh" size={16} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Date & Shift Selector */}
      <View className="bg-white border-b border-gray-100 py-3 px-5">
        <TouchableOpacity 
          className="flex-row items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 mb-3"
          onPress={() => setShowDatePicker(true)}
        >
          <View className="flex-row items-center">
            <FontAwesome name="calendar" size={16} color="#2563eb" />
            <Text className="font-lexend text-gray-800 ml-3 font-medium capitalize">
              {formatDate(selectedDate)}
            </Text>
          </View>
          <FontAwesome name="angle-down" size={16} color="#9ca3af" />
        </TouchableOpacity>
        
        <View className="flex-row">
          {['LUNCH', 'DINNER'].map((shift) => (
            <TouchableOpacity
              key={shift}
              onPress={() => setSelectedShift(shift as any)}
              className={`flex-1 py-2 items-center rounded-lg border ${
                selectedShift === shift 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'bg-white border-gray-200'
              } ${shift !== 'LUNCH' ? 'ml-2' : ''}`}
            >
              <Text className={`font-lexend text-xs font-medium ${
                selectedShift === shift ? 'text-white' : 'text-gray-600'
              }`}>
                {shift === 'LUNCH' ? 'Ca Sáng' : 'Ca Tối'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}
      </View>

      {/* Zone Filters */}
      {zones.length > 0 && (
        <View className="bg-white border-b border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-5 py-3">
            {zones.map(zone => (
              <TouchableOpacity
                key={zone._id}
                onPress={() => setSelectedZone(zone.name)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  selectedZone === zone.name ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text className={`font-lexend font-medium text-sm ${
                  selectedZone === zone.name ? 'text-white' : 'text-gray-600'
                }`}>
                  {zone.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView horizontal bounces={false} className="flex-1 bg-gray-50 border-t border-gray-200">
        <ScrollView bounces={false} contentContainerStyle={{ minWidth: 1000, minHeight: 800 }}>
          <View style={{ width: 1200, height: 1000, position: 'relative', padding: 20 }}>
            {filteredTables.map((item: any) => {
              const activeBooking = activeTableMap[item._id] || activeTableMap[item.table_number];
              const isOccupied = (!!activeBooking && activeBooking.status === 'IN_USE') || (!activeBooking && item.status === 'OCCUPIED');
              const isReserved = !!activeBooking && activeBooking.status === 'CONFIRMED';
              const isEmpty = (!activeBooking && (item.status === 'EMPTY' || !item.status));
              const isCleaning = !activeBooking && item.status === 'CLEANING';
              const isMaintenance = !activeBooking && item.status === 'MAINTENANCE';
              
              const left = item.x || 0;
              const top = item.y || 0;
              const width = item.width || 80;
              const height = item.height || 80;
              const isCircle = item.shape === 'CIRCLE';

              return (
                <TouchableOpacity
                  key={item._id}
                  style={{ position: 'absolute', left, top, width, height, borderRadius: isCircle ? width/2 : 12 }}
                  className={`border-2 shadow-sm items-center justify-center overflow-hidden ${
                    isEmpty ? 'bg-white border-green-400' :
                    isOccupied ? 'bg-blue-50 border-blue-400' :
                    isReserved ? 'bg-purple-50 border-purple-400' :
                    isCleaning ? 'bg-amber-50 border-amber-400' :
                    isMaintenance ? 'bg-red-50 border-red-400' :
                    'bg-gray-100 border-gray-300'
                  }`}
                  onPress={() => {
                    setActionTable(item);
                    setShowActionModal(true);
                  }}
                >
                  <Text className="font-lexend font-bold text-gray-900" style={{ fontSize: width > 60 ? 16 : 12 }}>
                    {item.table_number}
                  </Text>
                  {height > 50 && (
                    <View className="flex-row items-center mt-0.5">
                      <FontAwesome name="user" size={10} color="#4b5563" />
                      <Text className="font-lexend text-[10px] text-gray-500 ml-1">
                        {(isOccupied || isReserved) && activeBooking ? activeBooking.guest_count : item.capacity}
                      </Text>
                    </View>
                  )}
                  <View className={`absolute bottom-0 left-0 right-0 py-0.5 items-center ${
                    isEmpty ? 'bg-green-100' :
                    isOccupied ? 'bg-blue-100' :
                    isReserved ? 'bg-purple-100' :
                    isCleaning ? 'bg-amber-100' :
                    isMaintenance ? 'bg-red-100' :
                    'bg-gray-200'
                  }`}>
                    <Text className={`font-lexend text-[8px] font-bold ${
                      isEmpty ? 'text-green-700' :
                      isOccupied ? 'text-blue-700' :
                      isReserved ? 'text-purple-700' :
                      isCleaning ? 'text-amber-700' :
                      isMaintenance ? 'text-red-700' :
                      'text-gray-600'
                    }`}>
                      {isEmpty ? 'SẴN SÀNG' : 
                       isOccupied ? 'CÓ KHÁCH' : 
                       isReserved ? 'ĐÃ ĐẶT' :
                       isCleaning ? 'DỌN DẸP' : 
                       isMaintenance ? 'BẢO TRÌ' : item.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {filteredTables.length === 0 && (
              <View className="absolute inset-0 justify-center items-center">
                <Text className="font-lexend text-gray-400 text-lg font-medium">Khu vực này chưa có bàn nào.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Order Modal */}
      <MobileOrderMenuModal 
        visible={showOrderModal} 
        booking={selectedBooking} 
        branchId={branchId || ''} 
        onClose={() => setShowOrderModal(false)} 
        onSubmitSuccess={() => {
          fetchActiveTables();
        }} 
      />

      {/* Open Table Modal */}
      <Modal visible={showOpenTableModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-lexend font-bold text-xl text-gray-900">
                Mở bàn {openTargetTable?.table_number}
              </Text>
              <TouchableOpacity onPress={() => setShowOpenTableModal(false)} className="p-2 bg-gray-100 rounded-full">
                <FontAwesome name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <Text className="font-lexend text-sm text-gray-600 mb-2">Số lượng khách</Text>
            <View className="flex-row items-center justify-center bg-gray-50 rounded-xl p-4 mb-8">
              <TouchableOpacity 
                onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
              >
                <FontAwesome name="minus" size={16} color="#4b5563" />
              </TouchableOpacity>
              
              <Text className="font-lexend font-bold text-3xl text-gray-900 mx-8">{guestCount}</Text>
              
              <TouchableOpacity 
                onPress={() => setGuestCount(guestCount + 1)}
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
              >
                <FontAwesome name="plus" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              className="bg-green-600 rounded-xl py-4 items-center justify-center flex-row"
              onPress={submitOpenTable}
              disabled={openingTable}
            >
              {openingTable ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="check" size={16} color="white" />
                  <Text className="font-lexend font-bold text-white text-base ml-2">Xác Nhận Mở Bàn</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Action Modal */}
      <Modal visible={showActionModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-lexend font-bold text-xl text-gray-900">
                Bàn {actionTable?.table_number}
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)} className="p-2 bg-gray-100 rounded-full">
                <FontAwesome name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            <Text className="font-lexend text-sm text-gray-500 mb-6">Bạn muốn thực hiện thao tác gì?</Text>

            {(() => {
              if (!actionTable) return null;
              
              const activeBooking = activeTableMap[actionTable._id] || activeTableMap[actionTable.table_number];
              const isReserved = !!activeBooking && activeBooking.status === 'CONFIRMED';
              const isOccupied = (!!activeBooking && activeBooking.status === 'IN_USE') || (!activeBooking && actionTable.status === 'OCCUPIED');
              const isEmpty = (!activeBooking && (actionTable.status === 'EMPTY' || !actionTable.status));
              const isCleaning = !activeBooking && actionTable.status === 'CLEANING';
              const isMaintenance = !activeBooking && actionTable.status === 'MAINTENANCE';

              return (
                <View className="w-full">
                  {isEmpty && (
                    <>
                      <TouchableOpacity 
                        className="bg-blue-600 rounded-xl py-3.5 mb-3 flex-row items-center justify-start px-5"
                        onPress={() => {
                          setShowActionModal(false);
                          setOpenTargetTable(actionTable);
                          setGuestCount(actionTable.capacity || 2);
                          setShowOpenTableModal(true);
                        }}
                      >
                        <FontAwesome name="user-plus" size={18} color="white" />
                        <Text className="font-lexend font-bold text-white text-base ml-4">Mở bàn cho khách vãng lai</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="bg-amber-50 border border-amber-200 rounded-xl py-3.5 mb-3 flex-row items-center justify-start px-5"
                        onPress={() => handleUpdateTableStatus(actionTable._id, 'CLEANING')}
                      >
                        <FontAwesome name="eraser" size={18} color="#b45309" />
                        <Text className="font-lexend font-bold text-amber-700 text-base ml-4">Đánh dấu Đang dọn dẹp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="bg-red-50 border border-red-200 rounded-xl py-3.5 flex-row items-center justify-start px-5"
                        onPress={() => handleUpdateTableStatus(actionTable._id, 'MAINTENANCE')}
                      >
                        <FontAwesome name="wrench" size={18} color="#b91c1c" />
                        <Text className="font-lexend font-bold text-red-700 text-base ml-4">Đánh dấu Đang bảo trì</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {(isCleaning || isMaintenance) && (
                    <TouchableOpacity 
                      className="bg-green-600 rounded-xl py-3.5 flex-row items-center justify-start px-5"
                      onPress={() => handleUpdateTableStatus(actionTable._id, 'EMPTY')}
                    >
                      <FontAwesome name="check-circle" size={18} color="white" />
                      <Text className="font-lexend font-bold text-white text-base ml-4">Đánh dấu Bàn Trống</Text>
                    </TouchableOpacity>
                  )}

                  {(isOccupied || isReserved) && (
                    <TouchableOpacity 
                      className="bg-indigo-600 rounded-xl py-3.5 mb-4 flex-row items-center justify-start px-5"
                      onPress={() => {
                        if (activeBooking) {
                          setShowActionModal(false);
                          handleTablePress(activeBooking);
                        } else {
                          Alert.alert('Thông báo', 'Không tìm thấy Booking đang hoạt động.');
                        }
                      }}
                    >
                      <FontAwesome name="cutlery" size={18} color="white" />
                      <Text className="font-lexend font-bold text-white text-base ml-4">Gọi món bổ sung</Text>
                    </TouchableOpacity>
                  )}

                  {activeBooking && (
                    <View className="p-4 bg-gray-50 border border-gray-200 rounded-xl items-center mb-2">
                      <View className="flex-row items-center mb-3">
                        <FontAwesome name="qrcode" size={18} color="#2563eb" />
                        <Text className="font-lexend font-bold text-gray-700 ml-2">Menu Self-Ordering (Khách tự gọi)</Text>
                      </View>
                      <View className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-4">
                        <QRCode
                          value={`http://spoton.vn/ipad/table/${actionTable._id}`}
                          size={140}
                        />
                      </View>
                      <Text className="font-lexend text-xs text-gray-500 mb-2 font-medium">Dùng mã PIN nội bộ để mở khóa</Text>
                      <View className="bg-gray-100 px-4 py-2 rounded-lg w-full">
                        <Text className="font-lexend text-sm text-gray-800 font-bold text-center">
                          {activeBooking.ipad_pin || '(Hỏi Quản lý chi nhánh)'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })()}
            
            <TouchableOpacity 
              className="mt-4 border border-gray-200 rounded-xl py-3.5 items-center"
              onPress={() => setShowActionModal(false)}
            >
              <Text className="font-lexend font-bold text-gray-700 text-base">Hủy / Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
