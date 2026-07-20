import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BookingService } from './booking.service';
import { useAuthStore } from '@/hooks/useAuthStore';
import { CancelBookingModal } from './components/CancelBookingModal';

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

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <View className="flex-row justify-between mb-3">
      <Text className="text-gray-500 font-lexend">{label}</Text>
      <Text className="font-semibold font-lexend text-text">{value}</Text>
    </View>
  );
}

export function BookingDetailFeature({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await BookingService.getBookingById(id);
      if (res.success) {
        setBooking(res.data);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải chi tiết đặt bàn');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (user?.role === 'CUSTOMER' && ['CONFIRMED', 'PENDING_PAYMENT'].includes(booking?.status)) {
      setCancelModalVisible(true);
    } else {
      // Legacy cancel for Manager or HOLDING state
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
                await BookingService.releaseHold(id);
                Alert.alert('Thành công', 'Đã hủy đặt bàn.');
                router.back();
              } catch (error: any) {
                Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy');
              }
            }
          }
        ]
      );
    }
  };

  const handleConfirmCancel = async (cancelData: any) => {
    try {
      await BookingService.cancelBooking(id, cancelData);
      Alert.alert('Thành công', 'Đã gửi yêu cầu hủy đặt bàn.');
      setCancelModalVisible(false);
      fetchBooking(); // Refresh
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy đơn');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  if (!booking) return null;

  const statusInfo = STATUS_COLORS[booking.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: booking.status };
  const canCancel = ['HOLDING', 'PENDING_DEPOSIT', 'PENDING_PAYMENT'].includes(booking.status);

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4 pb-10" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
          <Text className="text-xl">←</Text>
        </TouchableOpacity>
        <Text className="font-lexend font-bold text-2xl text-text flex-1">Chi tiết đặt bàn</Text>
      </View>

      <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
          <Text className="font-lexend font-bold text-lg text-text">Trạng thái</Text>
          <View className={`px-3 py-1.5 rounded-md ${statusInfo.bg}`}>
            <Text className={`text-sm font-lexend font-bold ${statusInfo.text}`}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <InfoRow label="Chi nhánh" value={booking.branch_id?.name || 'SpotOn Branch'} />
        <InfoRow label="Ngày" value={new Date(booking.reservation_date).toLocaleDateString('vi-VN')} />
        <InfoRow label="Giờ đến" value={booking.arrival_time} />
        <InfoRow label="Số khách" value={`${booking.guest_count} khách`} />
        
        {booking.assigned_tables && booking.assigned_tables.length > 0 && (
          <InfoRow 
            label="Bàn đã chọn" 
            value={booking.assigned_tables.map((t: any) => `${t.zone_name} - ${t.table_number}`).join(', ')} 
          />
        )}
        
        {booking.note ? <InfoRow label="Ghi chú" value={booking.note} /> : null}
      </View>

      {booking.order_items && booking.order_items.length > 0 && (
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <Text className="font-lexend font-bold text-lg text-text mb-4">Món đặt trước ({booking.order_items.length})</Text>
          {booking.order_items.map((item: any, idx: number) => (
            <View key={idx} className="flex-row justify-between mb-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0 last:mb-0">
              <View className="flex-1 mr-2">
                <Text className="font-lexend font-semibold text-text">{item.quantity}x {item.name}</Text>
              </View>
              <Text className="font-lexend text-primary font-semibold">
                {(item.price_at_time * item.quantity).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
            <Text className="font-lexend font-bold">Tổng tiền món</Text>
            <Text className="font-lexend font-bold text-primary">
              {booking.pre_order_total_amount?.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>
      )}

      {(booking.total_deposit_paid > 0 || booking.table_deposit_amount > 0) && (
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <Text className="font-lexend font-bold text-lg text-text mb-4">Thông tin thanh toán</Text>
          <InfoRow label="Tiền cọc bàn" value={`${booking.table_deposit_amount?.toLocaleString('vi-VN')}đ`} />
          <InfoRow label="Tiền cọc món ăn" value={`${booking.pre_order_deposit_amount?.toLocaleString('vi-VN')}đ`} />
          {booking.voucher_discount_amount > 0 && (
            <InfoRow label="Giảm giá Voucher" value={`-${booking.voucher_discount_amount.toLocaleString('vi-VN')}đ`} />
          )}
          <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
            <Text className="font-lexend font-bold text-lg">Đã thanh toán cọc</Text>
            <Text className="font-lexend font-bold text-lg text-green-600">
              {booking.total_deposit_paid?.toLocaleString('vi-VN')}đ
            </Text>
          </View>
          {booking.payment_info?.transaction_id && (
            <Text className="font-lexend text-xs text-muted text-center mt-3">
              Mã giao dịch: {booking.payment_info.transaction_id}
            </Text>
          )}
        </View>
      )}

      {canCancel && (
        <TouchableOpacity
          className="py-3 bg-red-50 rounded-xl items-center border border-red-200 mb-6"
          onPress={handleCancelClick}
        >
          <Text className="font-lexend font-bold text-red-600 text-base">Hủy đặt bàn</Text>
        </TouchableOpacity>
      )}

      {isCancelModalVisible && (
        <CancelBookingModal
          visible={isCancelModalVisible}
          onClose={() => setCancelModalVisible(false)}
          booking={booking}
          onConfirm={handleConfirmCancel}
        />
      )}
    </ScrollView>
  );
}
