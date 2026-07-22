import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { BookingService } from '@/features/booking/booking.service';
import { useAuthStore } from '@/stores/useAuthStore';

export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

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

  const filteredTransactions = transactions.filter((tx: any) => {
    const txDate = new Date(tx.date);
    return txDate.getFullYear() === selectedDate.getFullYear() &&
           txDate.getMonth() === selectedDate.getMonth() &&
           txDate.getDate() === selectedDate.getDate();
  });

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
        <Text className="font-lexend font-bold text-2xl text-text flex-1">Lịch sử giao dịch</Text>
      </View>

      {/* Date Picker */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center border border-gray-200 rounded-lg bg-white p-2 shadow-sm">
          <View className="flex-1 flex-row justify-between items-center">
            <View>
              <Text className="font-lexend text-[10px] text-gray-500 mb-1">Chọn ngày xem lịch sử</Text>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => changeDate(-1)} className="px-3 py-1.5 mr-2 bg-gray-50 rounded border border-gray-200">
                  <FontAwesome name="chevron-left" size={12} color="#6b7280" />
                </TouchableOpacity>
                <Text className="font-lexend font-bold text-sm text-text mx-2">{selectedDate.toLocaleDateString('vi-VN')}</Text>
                <TouchableOpacity onPress={() => changeDate(1)} className="px-3 py-1.5 ml-2 bg-gray-50 rounded border border-gray-200">
                  <FontAwesome name="chevron-right" size={12} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity onPress={() => setSelectedDate(new Date())} className="px-3 py-2 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0]">
              <Text className="font-lexend font-bold text-xs text-[#166534]">Hôm nay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="flex-row px-4 mb-4 space-x-2">
        <View className="flex-1 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <Text className="font-lexend text-[10px] text-gray-500 font-bold mb-1 uppercase">Tổng thu</Text>
          <Text className="font-lexend font-bold text-sm text-gray-900">
            {filteredTransactions.filter(t => t.type === 'DEPOSIT' || t.type === 'FINAL_BILL').reduce((acc, t) => acc + t.amount, 0).toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-3 border border-gray-100 shadow-sm ml-2">
          <Text className="font-lexend text-[10px] text-red-500 font-bold mb-1 uppercase">Hoàn tiền</Text>
          <Text className="font-lexend font-bold text-sm text-red-600">
            -{filteredTransactions.filter(t => t.type === 'REFUND').reduce((acc, t) => acc + t.amount, 0).toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100 shadow-sm ml-2">
          <Text className="font-lexend text-[10px] text-green-700 font-bold mb-1 uppercase">Thuần</Text>
          <Text className="font-lexend font-bold text-sm text-green-700">
            {(filteredTransactions.filter(t => t.type === 'DEPOSIT' || t.type === 'FINAL_BILL').reduce((acc, t) => acc + t.amount, 0) - filteredTransactions.filter(t => t.type === 'REFUND').reduce((acc, t) => acc + t.amount, 0)).toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="font-lexend text-muted">Chưa có giao dịch nào trong ngày này.</Text>
          </View>
        ) : (
          filteredTransactions.map((tx: any) => {
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
