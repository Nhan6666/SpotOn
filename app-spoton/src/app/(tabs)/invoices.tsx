import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/axios';

export default function InvoicesScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, COMPLETED, PENDING_REFUND
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/manager/bookings/completed');
      if (res.data.success) {
        setInvoices(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching manager invoices:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = (id: string) => {
    Alert.alert('Hoàn tiền', 'Chức năng đang được phát triển.');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F9FAFB] justify-center items-center">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  // Filter logic
  const filteredInvoices = invoices.filter(inv => {
    const searchMatch = 
      inv.invoice_code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.customer_id?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv._id.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'COMPLETED') return inv.status === 'COMPLETED' && searchMatch;
    if (activeTab === 'PENDING_REFUND') return inv.has_refund_request && searchMatch;
    return searchMatch; // ALL
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.final_bill_amount || 0), 0);
  
  // Calculate tab counts
  const allCount = invoices.length;
  const completedCount = invoices.filter(i => i.status === 'COMPLETED').length;
  const refundCount = invoices.filter(i => i.has_refund_request).length;

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="bg-white pt-4 pb-4 px-4 shadow-sm z-10 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 w-8 h-8 rounded-full items-center justify-center">
              <FontAwesome name="arrow-left" size={16} color="#374151" />
            </TouchableOpacity>
            <View>
              <View className="flex-row items-center">
                <FontAwesome name="file-text-o" size={16} color="#4f46e5" style={{ marginRight: 6 }} />
                <Text className="font-lexend font-bold text-xl text-text">Lịch sử Checkout & Đối soát</Text>
              </View>
              <Text className="font-lexend text-xs text-gray-500 mt-0.5">Quản lý hóa đơn đã thanh toán và các bàn đã nhà chờ đối soát</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 self-start">
            <Text className="font-lexend text-xs text-gray-700 mr-2">Chọn ngày: <Text className="font-bold">{new Date().toLocaleDateString('vi-VN')}</Text></Text>
            <FontAwesome name="calendar" size={12} color="#4b5563" />
          </View>
        </View>

        {/* Tabs & Search */}
        <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 p-1 mb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <TouchableOpacity 
              onPress={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg ${activeTab === 'ALL' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-lexend text-xs ${activeTab === 'ALL' ? 'font-bold text-gray-800' : 'text-gray-500'}`}>Tất cả ({allCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg ${activeTab === 'COMPLETED' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-lexend text-xs ${activeTab === 'COMPLETED' ? 'font-bold text-gray-800' : 'text-gray-500'}`}>Đã thanh toán ({completedCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('PENDING_REFUND')}
              className={`px-3 py-1.5 rounded-lg ${activeTab === 'PENDING_REFUND' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-lexend text-xs ${activeTab === 'PENDING_REFUND' ? 'font-bold text-red-600' : 'text-gray-500'}`}>Yêu cầu hoàn tiền ({refundCount})</Text>
            </TouchableOpacity>
          </ScrollView>

          <View className="w-1/3 flex-row items-center bg-white border border-gray-200 rounded-lg px-2 py-1 ml-2">
            <FontAwesome name="search" size={10} color="#9ca3af" />
            <TextInput
              placeholder="Tìm theo mã đơn..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-1.5 font-lexend text-xs text-text h-6"
            />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-4 px-2">
          <Text className="font-lexend font-bold text-sm text-text">Danh sách hóa đơn</Text>
          <Text className="font-lexend font-bold text-[#ea580c] text-sm">Tổng thu: {totalAmount.toLocaleString('vi-VN')}đ</Text>
        </View>

        {filteredInvoices.length === 0 ? (
          <View className="items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
            <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-3">
              <FontAwesome name="file-text-o" size={24} color="#d1d5db" />
            </View>
            <Text className="font-lexend font-bold text-gray-700 text-base mb-1">Không có hóa đơn nào</Text>
          </View>
        ) : (
          filteredInvoices.map((invoice: any) => (
            <View key={invoice._id} className="bg-white rounded-xl mb-3 border border-gray-100 shadow-sm overflow-hidden">
              <View className="p-3 border-b border-gray-50 flex-row justify-between items-center bg-gray-50">
                <Text className="font-lexend font-bold text-xs text-gray-700 tracking-wider">MÃ ĐƠN: {invoice.invoice_code || invoice._id.substring(0,6).toUpperCase()}</Text>
                <View className="flex-row items-center">
                  <Text className="font-lexend text-[10px] text-gray-500 mr-2">{new Date(invoice.reservation_date).toLocaleDateString('vi-VN')} • {invoice.arrival_time}</Text>
                </View>
              </View>
              
              <View className="p-3">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="font-lexend font-bold text-sm text-text mb-0.5">
                      {invoice.customer_id?.full_name || invoice.walk_in_name || 'Khách vãng lai'}
                    </Text>
                    {invoice.assigned_tables && invoice.assigned_tables.length > 0 ? (
                      <Text className="font-lexend text-xs text-blue-600 font-medium">
                        Bàn: {invoice.assigned_tables.map((t: any) => t.table_number).join(', ')}
                      </Text>
                    ) : (
                      <Text className="font-lexend text-xs text-gray-400">N/A</Text>
                    )}
                  </View>
                  
                  <View className="items-end">
                    <View className={`px-2 py-1 rounded-full mb-1 flex-row items-center ${invoice.status === 'COMPLETED' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      <FontAwesome name="check-circle" size={10} color={invoice.status === 'COMPLETED' ? '#15803d' : '#c2410c'} style={{ marginRight: 4 }} />
                      <Text className={`font-lexend font-bold text-[10px] ${invoice.status === 'COMPLETED' ? 'text-green-700' : 'text-orange-700'}`}>
                        {invoice.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ xử lý'}
                      </Text>
                    </View>
                    <Text className="font-lexend font-bold text-base text-text">
                      {invoice.final_bill_amount?.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>

                {invoice.has_refund_request && (
                  <View className="mt-2 pt-3 border-t border-dashed border-gray-200 flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <FontAwesome name="exclamation-circle" size={12} color="#dc2626" style={{ marginRight: 6 }} />
                      <Text className="font-lexend text-xs text-red-600 font-medium">Yêu cầu hoàn tiền</Text>
                    </View>
                    <TouchableOpacity 
                      className="border border-red-500 bg-red-50 px-3 py-1.5 rounded flex-row items-center"
                      onPress={() => handleRefund(invoice._id)}
                    >
                      <FontAwesome name="undo" size={10} color="#dc2626" style={{ marginRight: 4 }} />
                      <Text className="font-lexend font-bold text-xs text-red-600">Hoàn tiền</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
