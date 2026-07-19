import { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { BookingService } from './booking.service';
import { useAuthStore } from '@/hooks/useAuthStore';

// All statuses from bookingController.js state machine
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  HOLDING:                  { bg: 'bg-yellow-100',  text: 'text-yellow-700',  label: 'Đang giữ' },
  PENDING_PAYMENT:          { bg: 'bg-orange-100',  text: 'text-orange-700',  label: 'Chờ thanh toán' },
  PENDING_DEPOSIT:          { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Chờ đặt cọc' },
  CONFIRMED:                { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Đã xác nhận' },
  IN_USE:                   { bg: 'bg-green-100',   text: 'text-green-700',   label: 'Đang dùng' },
  COMPLETED:                { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hoàn thành' },
  CANCELLED:                { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Đã hủy' },
  CANCELLED_TIMEOUT:        { bg: 'bg-red-100',     text: 'text-red-600',     label: 'Hết hạn' },
  CANCELLED_REFUND_PENDING: { bg: 'bg-purple-100',  text: 'text-purple-700',  label: 'Chờ hoàn tiền' },
  REFUND_COMPLETED:         { bg: 'bg-teal-100',    text: 'text-teal-700',    label: 'Đã hoàn tiền' },
  NO_SHOW:                  { bg: 'bg-gray-200',    text: 'text-gray-600',    label: 'Không đến' },
};

export function MyBookingsFeature() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await BookingService.getMyBookings();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.log('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHold = async (bookingId: string) => {
    Alert.alert(
      'Hủy đặt bàn',
      'Bạn có chắc muốn hủy đặt bàn này?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Hủy đặt bàn',
          style: 'destructive',
          onPress: async () => {
            try {
              await BookingService.releaseHold(bookingId);
              Alert.alert('Thành công', 'Đã hủy đặt bàn.');
              fetchBookings();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy');
            }
          }
        }
      ]
    );
  };

  const renderBooking = ({ item }: { item: any }) => {
    const statusInfo = STATUS_COLORS[item.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: item.status };
    const canCancel = ['HOLDING', 'PENDING_DEPOSIT', 'PENDING_PAYMENT'].includes(item.status);

    return (
      <TouchableOpacity 
        className="bg-white rounded-md mb-4 p-4 border border-gray-100 shadow-sm"
        activeOpacity={0.7}
        onPress={() => router.push(`/booking/detail/${item._id}`)}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <Text className="font-lexend font-bold text-lg text-text">
              {item.branch_id?.name || 'SpotOn Branch'}
            </Text>
            <Text className="font-lexend text-muted text-sm mt-1">
              {new Date(item.reservation_date).toLocaleDateString('vi-VN')} • {item.arrival_time}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-md ${statusInfo.bg}`}>
            <Text className={`text-xs font-lexend font-bold ${statusInfo.text}`}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Assigned tables */}
        {item.assigned_tables && item.assigned_tables.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-2">
            {item.assigned_tables.map((t: any, idx: number) => (
              <View key={idx} className="bg-gray-100 px-2 py-0.5 rounded">
                <Text className="font-lexend text-xs text-gray-600">
                  {t.zone_name} - {t.table_number}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
          <Text className="font-lexend text-text">{item.guest_count} khách</Text>
          {item.payment_info?.deposit_amount ? (
            <Text className="font-lexend font-semibold text-primary">
              Cọc: {item.payment_info.deposit_amount.toLocaleString('vi-VN')} VND
            </Text>
          ) : null}
        </View>

        {/* Pre-ordered items count */}
        {item.order_items && item.order_items.length > 0 && (
          <Text className="font-lexend text-xs text-muted mt-2">
            🍽️ {item.order_items.length} món đặt trước
          </Text>
        )}

        {/* Cancel button for holding/pending bookings */}
        {canCancel && (
          <TouchableOpacity
            className="mt-3 py-2 bg-red-50 rounded-md items-center border border-red-200"
            onPress={() => handleCancelHold(item._id)}
          >
            <Text className="font-lexend font-semibold text-red-600 text-sm">Hủy đặt bàn</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      {loading ? (
        <ActivityIndicator size="large" color="#b45309" className="mt-10" />
      ) : bookings.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="font-lexend text-lg text-muted">Chưa có lịch đặt bàn</Text>
          <Text className="font-lexend text-sm text-muted mt-1">Đặt bàn ngay để xem tại đây!</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item._id}
          renderItem={renderBooking}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
