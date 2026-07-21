import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '@/lib/http';
import { useAuthStore } from '@/stores/useAuthStore';
import { CheckoutModal } from './components/CheckoutModal';
import { RefundModal } from './components/RefundModal';
import DateTimePicker from '@react-native-community/datetimepicker';

export function ManagerInvoicesFeature() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLETED' | 'PENDING_SETTLEMENT' | 'REFUND_PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState<any>(null);

  const onChangeDate = (event: any, selectedDateValue?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDateValue) {
      setSelectedDate(selectedDateValue.toISOString().split('T')[0]);
    }
  };
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<any>(null);

  const fetchInvoices = useCallback(async () => {
    if (!user?.branch_id) return;
    try {
      setIsLoading(true);
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const res = await apiClient.get(`/bookings?branch_id=${user.branch_id}&start_date=${targetDate.toISOString()}&end_date=${nextDate.toISOString()}&include_refund_pending=true`);
      
      const resData = res.data?.data || res.data || [];
      const filtered = Array.isArray(resData) ? resData.filter((b: any) => [
        'COMPLETED', 
        'PENDING_SETTLEMENT', 
        'CANCELLED_REFUND_PENDING',
        'REFUND_COMPLETED',
        'CANCELLED'
      ].includes(b.status)) : [];
      
      setInvoices(filtered);
    } catch (error) {
      console.log('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branch_id, selectedDate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (activeTab === 'COMPLETED' && !['COMPLETED', 'REFUND_COMPLETED', 'CANCELLED'].includes(inv.status)) return false;
      if (activeTab === 'PENDING_SETTLEMENT' && inv.status !== 'PENDING_SETTLEMENT') return false;
      if (activeTab === 'REFUND_PENDING' && inv.status !== 'CANCELLED_REFUND_PENDING') return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (inv.customer_id?.full_name || inv.walk_in_name || '').toLowerCase().includes(q);
        const phoneMatch = (inv.customer_id?.phone || inv.walk_in_phone || '').toLowerCase().includes(q);
        const idMatch = inv._id.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !idMatch) return false;
      }
      return true;
    });
  }, [invoices, activeTab, searchQuery]);

  const stats = {
    total: invoices.length,
    completed: invoices.filter(i => ['COMPLETED', 'REFUND_COMPLETED', 'CANCELLED'].includes(i.status)).length,
    pending: invoices.filter(i => i.status === 'PENDING_SETTLEMENT').length,
    refundPending: invoices.filter(i => i.status === 'CANCELLED_REFUND_PENDING').length,
  };

  const calculateAmountToPay = (invoice: any) => {
    const items = invoice.order_items || [];
    const calculatedTotal = items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0);
    const totalBill = calculatedTotal > 0 ? calculatedTotal : (invoice.pre_order_total_amount || 0);
    const depositPaid = invoice.total_deposit_paid || 0;
    return {
      totalBill,
      amountToPay: Math.max(0, totalBill - depositPaid)
    };
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white pt-4 pb-3 shadow-sm z-10 border-b border-gray-200">
        <View className="px-4 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={() => router.push(user?.role === 'ADMIN' ? '/admin-dashboard' : '/branch-manage')} 
              className="mr-3 w-8 h-8 items-center justify-center"
            >
              <FontAwesome name="arrow-left" size={16} color="#374151" />
            </TouchableOpacity>
            <View>
              <View className="flex-row items-center">
                <FontAwesome name="file-text-o" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                <Text className="font-lexend font-bold text-xl text-gray-900">Đối soát hóa đơn</Text>
              </View>
              <Text className="font-lexend text-xs text-gray-500 mt-0.5">Lịch sử Checkout & Yêu cầu hoàn tiền</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View className="px-4 mb-3 flex-row gap-2">
          <TouchableOpacity 
            className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex-1"
            onPress={() => setShowDatePicker(true)}
          >
            <FontAwesome name="calendar" size={12} color="#6b7280" style={{ marginRight: 6 }} />
            <Text className="font-lexend text-xs font-bold text-gray-700">{selectedDate}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={new Date(selectedDate)}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}

          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex-[2]">
            <FontAwesome name="search" size={12} color="#6b7280" />
            <TextInput
              placeholder="Tìm theo mã đơn, tên..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 font-lexend text-xs h-6 p-0"
            />
          </View>
        </View>

        {/* Tabs */}
        <View className="px-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              onPress={() => setActiveTab('ALL')}
              className={`px-3 py-2 rounded-lg mx-1 ${activeTab === 'ALL' ? 'bg-gray-900' : 'bg-gray-100'}`}
            >
              <Text className={`font-lexend font-bold text-xs ${activeTab === 'ALL' ? 'text-white' : 'text-gray-500'}`}>Tất cả ({stats.total})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('COMPLETED')}
              className={`px-3 py-2 rounded-lg mx-1 ${activeTab === 'COMPLETED' ? 'bg-blue-600' : 'bg-gray-100'}`}
            >
              <Text className={`font-lexend font-bold text-xs ${activeTab === 'COMPLETED' ? 'text-white' : 'text-gray-500'}`}>Đã thanh toán ({stats.completed})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('PENDING_SETTLEMENT')}
              className={`px-3 py-2 rounded-lg mx-1 ${activeTab === 'PENDING_SETTLEMENT' ? 'bg-amber-600' : 'bg-gray-100'}`}
            >
              <Text className={`font-lexend font-bold text-xs ${activeTab === 'PENDING_SETTLEMENT' ? 'text-white' : 'text-gray-500'}`}>Chờ đối soát ({stats.pending})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('REFUND_PENDING')}
              className={`px-3 py-2 rounded-lg mx-1 ${activeTab === 'REFUND_PENDING' ? 'bg-red-600' : 'bg-gray-100'}`}
            >
              <Text className={`font-lexend font-bold text-xs ${activeTab === 'REFUND_PENDING' ? 'text-white' : 'text-gray-500'}`}>Hoàn tiền ({stats.refundPending})</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
        ) : filteredInvoices.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
              <FontAwesome name="file-text-o" size={24} color="#9ca3af" />
            </View>
            <Text className="font-lexend font-bold text-gray-700 text-base">Không có hóa đơn nào</Text>
            <Text className="font-lexend text-gray-500 text-xs mt-1">Thử đổi ngày hoặc điều kiện tìm kiếm.</Text>
          </View>
        ) : (
          filteredInvoices.map((invoice: any) => {
            const customerName = invoice.customer_id?.full_name || invoice.walk_in_name || 'Khách vãng lai';
            const tableNames = invoice.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A';
            const { totalBill, amountToPay } = calculateAmountToPay(invoice);

            return (
              <View key={invoice._id} className="bg-white rounded-xl mb-3 border border-gray-200 shadow-sm overflow-hidden">
                <View className="p-3 border-b border-gray-50 flex-row justify-between items-center bg-gray-50">
                  <Text className="font-mono text-xs font-bold text-gray-500">#{invoice._id.slice(-6).toUpperCase()}</Text>
                  <Text className="font-lexend text-[10px] text-gray-500">{invoice.arrival_time}</Text>
                </View>
                
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="font-lexend font-bold text-sm text-gray-900 mb-0.5">{customerName}</Text>
                      <Text className="font-lexend text-xs text-gray-500 mb-1">
                        {invoice.customer_id?.phone || invoice.customer_id?.phone_number || invoice.walk_in_phone || '---'}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <View className="bg-gray-100 px-2 py-0.5 rounded mr-2">
                          <Text className="font-lexend text-[10px] font-bold text-gray-700">Bàn: {tableNames}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View className="items-end">
                      {invoice.status === 'COMPLETED' ? (
                        <View className="flex-row items-center bg-green-50 px-2 py-1 rounded mb-1">
                          <FontAwesome name="check-circle" size={10} color="#16a34a" style={{ marginRight: 4 }} />
                          <Text className="font-lexend font-bold text-[10px] text-green-700">Đã thanh toán</Text>
                        </View>
                      ) : invoice.status === 'REFUND_COMPLETED' ? (
                        <View className="flex-row items-center bg-purple-50 px-2 py-1 rounded mb-1">
                          <FontAwesome name="undo" size={10} color="#9333ea" style={{ marginRight: 4 }} />
                          <Text className="font-lexend font-bold text-[10px] text-purple-700">Đã hoàn tiền</Text>
                        </View>
                      ) : invoice.status === 'CANCELLED_REFUND_PENDING' ? (
                        <View className="flex-row items-center bg-red-50 px-2 py-1 rounded mb-1">
                          <FontAwesome name="undo" size={10} color="#dc2626" style={{ marginRight: 4 }} />
                          <Text className="font-lexend font-bold text-[10px] text-red-700">Y/c hoàn tiền</Text>
                        </View>
                      ) : invoice.status === 'CANCELLED' ? (
                        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded mb-1">
                          <FontAwesome name="times-circle" size={10} color="#4b5563" style={{ marginRight: 4 }} />
                          <Text className="font-lexend font-bold text-[10px] text-gray-700">Đã hủy</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded mb-1">
                          <FontAwesome name="clock-o" size={10} color="#d97706" style={{ marginRight: 4 }} />
                          <Text className="font-lexend font-bold text-[10px] text-amber-700">Chờ đối soát</Text>
                        </View>
                      )}
                      
                      {invoice.status === 'COMPLETED' ? (
                        <Text className="font-lexend font-bold text-base text-gray-900">
                          {invoice.final_bill_amount?.toLocaleString()}đ
                        </Text>
                      ) : invoice.status === 'REFUND_COMPLETED' ? (
                        <Text className="font-lexend font-bold text-base text-blue-600">
                          {invoice.refund_info?.refund_amount?.toLocaleString()}đ
                        </Text>
                      ) : invoice.status === 'CANCELLED' ? (
                        <Text className="font-lexend font-bold text-base text-gray-500 line-through">
                          {amountToPay.toLocaleString()}đ
                        </Text>
                      ) : (
                        <Text className="font-lexend font-bold text-base text-blue-600">
                          {amountToPay.toLocaleString()}đ
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="mt-2 pt-3 border-t border-dashed border-gray-200 flex-row justify-end gap-2">
                    {invoice.status === 'PENDING_SETTLEMENT' && (
                      <TouchableOpacity 
                        className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
                        onPress={() => setSelectedBookingForCheckout(invoice)}
                      >
                        <Text className="font-lexend font-bold text-xs text-white">Thanh toán</Text>
                        <FontAwesome name="arrow-right" size={10} color="white" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    )}

                    {invoice.status === 'CANCELLED_REFUND_PENDING' && (
                      <TouchableOpacity 
                        className="bg-red-600 px-4 py-2 rounded-lg flex-row items-center"
                        onPress={() => setSelectedBookingForRefund(invoice)}
                      >
                        <Text className="font-lexend font-bold text-xs text-white">Xử lý hoàn tiền</Text>
                        <FontAwesome name="arrow-right" size={10} color="white" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    )}

                    {invoice.status === 'COMPLETED' && (
                      <TouchableOpacity 
                        className="border border-red-200 bg-red-50 px-3 py-2 rounded-lg flex-row items-center"
                        onPress={() => setSelectedBookingForRefund(invoice)}
                      >
                        <FontAwesome name="undo" size={10} color="#dc2626" style={{ marginRight: 4 }} />
                        <Text className="font-lexend font-bold text-xs text-red-600">Hoàn tiền</Text>
                      </TouchableOpacity>
                    )}

                    {invoice.status === 'REFUND_COMPLETED' && (
                      <TouchableOpacity 
                        className="border border-purple-200 bg-purple-50 px-3 py-2 rounded-lg flex-row items-center"
                        onPress={() => setSelectedBookingForRefund(invoice)}
                      >
                        <FontAwesome name="eye" size={10} color="#9333ea" style={{ marginRight: 4 }} />
                        <Text className="font-lexend font-bold text-xs text-purple-600">Xem chi tiết</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View className="h-20" />
      </ScrollView>

      {/* Modals */}
      {selectedBookingForCheckout && (
        <CheckoutModal 
          visible={!!selectedBookingForCheckout}
          booking={selectedBookingForCheckout}
          onClose={() => setSelectedBookingForCheckout(null)}
          onSuccess={() => {
            setSelectedBookingForCheckout(null);
            fetchInvoices();
          }}
        />
      )}

      {selectedBookingForRefund && (
        <RefundModal 
          visible={!!selectedBookingForRefund}
          booking={selectedBookingForRefund}
          onClose={() => setSelectedBookingForRefund(null)}
          onSuccess={() => {
            setSelectedBookingForRefund(null);
            fetchInvoices();
          }}
        />
      )}
    </View>
  );
}
