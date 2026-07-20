import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { BookingService } from '@/features/booking/booking.service';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      if (user?.branch_id) {
        const res = await BookingService.getAllBookings({ branch_id: user.branch_id });
        if (res.success) {
          const bookings = res.data || [];
          const txList: any[] = [];
          
          bookings.forEach((b: any) => {
            // 1. Giao dịch thanh toán cọc
            if (b.total_deposit_paid > 0) {
              txList.push({
                id: `${b._id}_deposit`,
                booking_id: b._id,
                type: 'DEPOSIT',
                amount: b.total_deposit_paid,
                date: b.payment_info?.paid_at || b.created_at,
                method: b.payment_info?.method || 'VNPAY',
                customer: b.customer_id?.full_name || b.walk_in_name || 'Khách vãng lai'
              });
            }

            // 2. Giao dịch thanh toán hóa đơn cuối (khi COMPLETED)
            if (b.status === 'COMPLETED' && b.final_bill_amount > 0) {
              txList.push({
                id: `${b._id}_final`,
                booking_id: b._id,
                type: 'FINAL_BILL',
                amount: b.final_bill_amount,
                date: b.updated_at,
                method: 'CASH/CARD',
                customer: b.customer_id?.full_name || b.walk_in_name || 'Khách vãng lai'
              });
            }

            // 3. Giao dịch hoàn tiền (khi REFUND_COMPLETED)
            if (b.status === 'REFUND_COMPLETED' && b.refund_info?.refund_amount > 0) {
              txList.push({
                id: `${b._id}_refund`,
                booking_id: b._id,
                type: 'REFUND',
                amount: b.refund_info.refund_amount,
                date: b.refund_info.refund_completed_at || b.updated_at,
                method: 'BANK_TRANSFER',
                customer: b.customer_id?.full_name || 'Khách hàng'
              });
            }
          });

          // Sort by date descending
          txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(txList);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử giao dịch');
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

  const getTxDetails = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return { label: 'Nhận cọc bàn', icon: 'arrow-down', color: 'text-green-600', bg: 'bg-green-100', iconColor: '#16a34a' };
      case 'FINAL_BILL': return { label: 'Thu hóa đơn', icon: 'arrow-down', color: 'text-green-600', bg: 'bg-green-100', iconColor: '#16a34a' };
      case 'REFUND': return { label: 'Hoàn tiền hủy bàn', icon: 'arrow-up', color: 'text-red-600', bg: 'bg-red-100', iconColor: '#dc2626' };
      default: return { label: 'Giao dịch', icon: 'exchange', color: 'text-gray-600', bg: 'bg-gray-100', iconColor: '#4b5563' };
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
          <FontAwesome name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text className="font-lexend font-bold text-2xl text-text flex-1">Lịch sử giao dịch</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {transactions.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="font-lexend text-muted">Chưa có giao dịch nào.</Text>
          </View>
        ) : (
          transactions.map((tx: any) => {
            const details = getTxDetails(tx.type);
            return (
              <TouchableOpacity 
                key={tx.id} 
                className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center"
                onPress={() => router.push(`/booking/detail/${tx.booking_id}`)}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${details.bg}`}>
                  <FontAwesome name={details.icon as any} size={16} color={details.iconColor} />
                </View>
                
                <View className="flex-1">
                  <Text className="font-lexend font-bold text-text text-base mb-0.5">
                    {details.label}
                  </Text>
                  <Text className="font-lexend text-xs text-muted">
                    Khách: {tx.customer}
                  </Text>
                  <Text className="font-lexend text-[10px] text-gray-400 mt-0.5">
                    {new Date(tx.date).toLocaleString('vi-VN')}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className={`font-lexend font-bold text-base ${details.color}`}>
                    {tx.type === 'REFUND' ? '-' : '+'}{tx.amount?.toLocaleString('vi-VN')}đ
                  </Text>
                  <View className="bg-gray-100 px-2 py-0.5 rounded mt-1">
                    <Text className="font-lexend text-[10px] text-gray-600 font-bold">{tx.method}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
