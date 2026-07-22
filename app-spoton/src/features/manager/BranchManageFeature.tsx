import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Switch, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import apiClient from '@/lib/http';
import { BranchService } from '../branch/branch.service';

export function BranchManageFeature() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [pickerConfig, setPickerConfig] = useState<{ show: boolean, period: 'lunch' | 'dinner', field: string, value: Date } | null>(null);

  const parseTimeString = (timeStr: string) => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours || '0', 10), parseInt(minutes || '0', 10), 0, 0);
    return date;
  };

  const openPicker = (period: 'lunch' | 'dinner', field: string) => {
    const timeStr = formData?.[period]?.[field];
    setPickerConfig({
      show: true,
      period,
      field,
      value: parseTimeString(timeStr)
    });
  };

  const handlePickerChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !selectedDate) {
      setPickerConfig(null);
      return;
    }
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    if (pickerConfig) {
      handleTimeChange(pickerConfig.period, pickerConfig.field, timeStr);
    }
    setPickerConfig(null);
  };

  const branchId = user?.branch_id;

  const fetchData = useCallback(async () => {
    try {
      const [branchRes, amenitiesRes] = await Promise.all([
        BranchService.getMyBranch(),
        apiClient.get('/amenities')
      ]);

      if (amenitiesRes.data?.success) {
        setAmenitiesList(amenitiesRes.data.data);
      }

      if (branchRes.success && branchRes.data) {
        setBranch(branchRes.data);
        const initialPeriods = branchRes.data.service_periods || {
          lunch: { start: '08:00', end: '14:00', last_booking: '13:00', last_order: '13:30' },
          dinner: { start: '17:00', end: '22:00', last_booking: '21:00', last_order: '21:30' }
        };
        const initial = {
          ...initialPeriods,
          status: branchRes.data.status || 'OPEN',
          overload_threshold: branchRes.data.overload_threshold?.toString() || '85',
          amenities: branchRes.data.amenities?.map((a: any) => typeof a === 'object' && a !== null ? a._id.toString() : a.toString()) || [],
        };
        setFormData(initial);
        setInitialFormData(initial);
        const currentBranchId = branchRes.data._id;
        // Removed bookings fetch
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

  const handleTimeChange = (period: 'lunch' | 'dinner', field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [period]: {
        ...(prev?.[period] || {}),
        [field]: value
      }
    }));
  };

  const toggleAmenity = (id: string) => {
    setFormData((prev: any) => {
      const current = prev.amenities || [];
      if (current.includes(id)) {
        return { ...prev, amenities: current.filter((a: string) => a !== id) };
      } else {
        return { ...prev, amenities: [...current, id] };
      }
    });
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await BranchService.updateBranch(branch._id, {
        service_periods: { lunch: formData.lunch, dinner: formData.dinner },
        status: formData.status,
        overload_threshold: Number(formData.overload_threshold) || 85,
        amenities: formData.amenities
      });
      if (res.success) {
        Alert.alert('Thành công', 'Cập nhật thành công');
        fetchData();
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setIsSaving(false);
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



  return (
    <ScrollView 
      className="flex-1 bg-[#F9FAFB]"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={['#b45309']} />}
    >
      <View className="px-4 pt-6 pb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="font-lexend font-bold text-2xl text-text">Bảng điều khiển</Text>
          <TouchableOpacity 
            onPress={() => router.push('/')}
            className="bg-orange-50 w-10 h-10 rounded-full items-center justify-center border border-orange-100"
          >
            <FontAwesome name="home" size={20} color="#ea580c" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-2">
          <View className="flex-1 pr-4">
            <Text className="font-lexend font-bold text-lg text-text">Chi nhánh: {branch?.name || 'SpotOn'}</Text>
            <Text className="font-lexend text-gray-500 text-xs mt-1">Quản lý thông tin và các giới hạn vận hành.</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/manager/map-editor')}
            className="flex-row items-center bg-orange-600 px-3 py-2 rounded-lg shadow-sm"
          >
            <FontAwesome name="map" size={14} color="#fff" />
            <Text className="font-lexend font-bold text-xs text-white ml-2">Sửa sơ đồ</Text>
          </TouchableOpacity>
        </View>
        
        {/* Lối tắt (Quick Links) */}
        <View className="flex-row flex-wrap justify-between mt-2">
          <TouchableOpacity 
            onPress={() => router.push('/statistics')}
            className="w-[48%] bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex-row items-center mb-2"
          >
            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-2">
              <FontAwesome name="line-chart" size={14} color="#3b82f6" />
            </View>
            <Text className="font-lexend font-bold text-xs text-gray-700">Thống kê</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/invoices')}
            className="w-[48%] bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex-row items-center mb-2"
          >
            <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center mr-2">
              <FontAwesome name="file-text-o" size={14} color="#22c55e" />
            </View>
            <Text className="font-lexend font-bold text-xs text-gray-700">Hóa đơn</Text>
          </TouchableOpacity>
        </View>
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
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-lexend text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tiện ích chi nhánh</Text>
              <Text className="font-lexend text-[10px] text-gray-400 italic">Nhấn để chọn/bỏ chọn</Text>
            </View>
            {amenitiesList && amenitiesList.length > 0 ? (
              <View className="flex-row flex-wrap mt-1">
                {amenitiesList.map((amenity: any) => {
                  const isSelected = formData?.amenities?.includes(amenity._id);
                  return (
                    <TouchableOpacity
                      key={amenity._id}
                      onPress={() => toggleAmenity(amenity._id)}
                      className={`rounded-lg px-3 py-1.5 mr-2 mb-2 border ${
                        isSelected 
                          ? 'bg-amber-50 border-amber-500' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text 
                        className={`font-lexend text-xs ${
                          isSelected ? 'text-amber-700 font-bold' : 'text-gray-600'
                        }`}
                      >
                        {amenity.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text className="font-lexend italic text-xs text-gray-400">Không có tiện ích nào trong hệ thống</Text>
            )}
          </View>
        </View>
      </View>

      {/* Giới hạn vận hành */}
      <View className="px-4 pb-4">
        <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <Text className="font-lexend font-bold text-base text-text mb-1">Giới hạn vận hành (Operation Limits)</Text>
          <Text className="font-lexend text-xs text-gray-500 mb-4 leading-5">Thiết lập các ngưỡng giới hạn để hệ thống tự động chống quá tải (Overbooking).</Text>
          
          <View className="bg-[#f8f9fa] rounded-xl p-4 border border-gray-100 mb-1">
            <Text className="font-lexend font-bold text-sm text-gray-700 mb-2">Ngưỡng quá tải chung (%)</Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-1 mb-2 h-10">
              <TextInput
                className="flex-1 font-lexend text-sm text-text h-full p-0 m-0"
                keyboardType="numeric"
                value={formData?.overload_threshold?.toString() || ''}
                onChangeText={(val) => setFormData({ ...formData, overload_threshold: val })}
              />
              <Text className="font-lexend font-bold text-gray-500 text-base">%</Text>
            </View>
            <Text className="font-lexend text-xs text-gray-500">Hệ thống sẽ báo "Hết bàn" khi sức chứa đạt ngưỡng này.</Text>
          </View>
        </View>
      </View>

      {/* Trạng thái phục vụ ban đầu */}
      <View className="px-4 pb-4">
        <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <Text className="font-lexend font-bold text-base text-text mb-1">Trạng thái phục vụ ban đầu</Text>
          <Text className="font-lexend text-xs text-gray-500 mb-4 leading-5">Thiết lập trạng thái hiển thị của chi nhánh với khách hàng.</Text>
          
          <View className="bg-white border border-gray-200 rounded-xl p-3 flex-row items-center">
            <Switch
              trackColor={{ false: "#d1d5db", true: "#ea580c" }}
              thumbColor={"#fff"}
              ios_backgroundColor="#d1d5db"
              onValueChange={(val) => setFormData({ ...formData, status: val ? 'OPEN' : 'CLOSED' })}
              value={formData?.status === 'OPEN'}
            />
            <Text className="font-lexend font-bold text-sm text-text ml-3">
              {formData?.status === 'OPEN' ? 'Đang mở / Nhận đặt bàn' : 'Đóng cửa / Ngừng nhận khách'}
            </Text>
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
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('lunch', 'start')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.lunch?.start || '08:00'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#ea580c" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Đóng cửa</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('lunch', 'end')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.lunch?.end || '14:00'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#ea580c" />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Nhận khách cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('lunch', 'last_booking')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.lunch?.last_booking || '13:00'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#ea580c" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Order cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('lunch', 'last_order')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.lunch?.last_order || '13:30'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#ea580c" />
                </View>
              </View>
            </View>
          </View>

          {/* Ca Tối */}
          <View className="mb-5">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="font-lexend font-bold text-text text-sm">Ca Tối (Dinner)</Text>
            </View>
            
            <View className="flex-row mb-3 gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Giờ mở cửa</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('dinner', 'start')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.dinner?.start || '17:00'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#3b82f6" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Đóng cửa</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('dinner', 'end')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.dinner?.end || '22:00'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#3b82f6" />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Nhận khách cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('dinner', 'last_booking')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.dinner?.last_booking || '21:00'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#3b82f6" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-[10px] text-gray-500 mb-1">Order cuối</Text>
                <View className="border border-gray-200 rounded-lg px-3 py-1 flex-row justify-between items-center bg-white">
                  <TouchableOpacity 
                    className="flex-1 h-8 justify-center"
                    onPress={() => openPicker('dinner', 'last_order')}
                  >
                    <Text className="font-lexend text-sm text-text">
                      {formData?.dinner?.last_order || '21:30'}
                    </Text>
                  </TouchableOpacity>
                  <FontAwesome name="clock-o" size={14} color="#3b82f6" />
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            className={`rounded-xl py-3 items-center ${(!hasChanges || isSaving) ? 'bg-gray-300' : 'bg-orange-600'}`}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={`font-lexend font-bold text-sm ${(!hasChanges || isSaving) ? 'text-gray-500' : 'text-white'}`}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>

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


      {pickerConfig && pickerConfig.show && (
        <DateTimePicker
          value={pickerConfig.value}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={handlePickerChange}
        />
      )}
    </ScrollView>
  );
}
