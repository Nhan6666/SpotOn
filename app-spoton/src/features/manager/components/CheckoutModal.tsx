import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BookingService } from '@/features/booking/booking.service';
import apiClient from '@/lib/http';

interface CheckoutModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ visible, booking, onClose, onSuccess }: CheckoutModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking) return null;

  const customerName = booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai';
  const tableNames = booking.assigned_tables?.length > 0 
    ? booking.assigned_tables.map((t: any) => t.table_number).join(', ') 
    : 'Chưa xếp';

  const items = booking.order_items || [];
  const calculatedTotal = items.reduce((acc: number, item: any) => acc + (item.price_at_time * item.quantity), 0);
  const totalBill = calculatedTotal > 0 ? calculatedTotal : (booking.pre_order_total_amount || 0);
  const depositPaid = booking.total_deposit_paid || 0;
  
  const voucherDiscount = booking.voucher_discount_amount || 0;
  
  const adjustments = booking.bill_adjustments || [];
  const adjustmentsTotal = adjustments.reduce((sum: number, adj: any) => sum + adj.amount, 0);

  const amountToPay = Math.max(0, totalBill - depositPaid - voucherDiscount - adjustmentsTotal);

  const handleCheckout = async () => {
    Alert.alert(
      "Xác nhận",
      `Xác nhận khách đã thanh toán đủ ${amountToPay.toLocaleString('vi-VN')}đ?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đã Thanh Toán",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // This endpoint is from FE's implementation: /reception/bookings/:id/checkout
              // Or BookingService.checkoutBooking
              await BookingService.checkoutBooking(booking._id);
              Alert.alert("Thành công", "Thanh toán thành công và đã nhả bàn.");
              onSuccess();
            } catch (err: any) {
              Alert.alert('Lỗi Checkout', err.message || 'Không thể checkout lúc này.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center p-4">
        <View className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl max-h-[85%]">
          {/* Header */}
          <View className="bg-blue-600 px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="bg-white/20 p-2 rounded-xl mr-3">
                <FontAwesome name="file-text-o" size={20} color="white" />
              </View>
              <View className="flex-1 pr-2">
                <Text className="font-lexend font-bold text-lg text-white">Chốt Hóa Đơn</Text>
                <Text className="font-lexend text-xs text-blue-100" numberOfLines={1}>{customerName} - Bàn {tableNames}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <FontAwesome name="times" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {/* Items */}
            <View className="mb-5">
              <Text className="font-lexend font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3">Chi tiết gọi món</Text>
              {items.length === 0 ? (
                <View className="bg-gray-50 p-4 rounded-lg items-center">
                  <Text className="font-lexend text-gray-500 text-xs italic">Không có món ăn nào được lưu.</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {items.map((item: any, idx: number) => (
                    <View key={idx} className="flex-row justify-between items-start">
                      <View className="flex-row flex-1 pr-2">
                        <Text className="font-lexend font-bold text-gray-700 text-sm mr-2">{item.quantity}x</Text>
                        <View className="flex-1">
                          <Text className="font-lexend font-medium text-gray-900 text-sm">{item.name}</Text>
                          <View className="self-start mt-0.5">
                            <Text className={`font-lexend font-bold text-[8px] px-1.5 py-0.5 rounded ${item.type === 'PRE_ORDER' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {item.type === 'PRE_ORDER' ? 'PRE-ORDER' : 'GỌI THÊM'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text className="font-lexend font-medium text-gray-900 text-sm">
                        {(item.price_at_time * item.quantity).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Adjustments */}
            {adjustments.length > 0 && (
              <View className="mb-5 space-y-2">
                <Text className="font-lexend font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2">Điều chỉnh hóa đơn</Text>
                {adjustments.map((adj: any) => (
                  <View key={adj._id} className="flex-row justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <View className="flex-1 pr-2">
                      <Text className="font-lexend font-bold text-amber-900 text-xs">⚠️ {adj.reason}</Text>
                      <Text className="font-lexend text-[10px] text-amber-700 mt-1">Loại: {adj.type}</Text>
                    </View>
                    <Text className="font-lexend font-bold text-amber-700 text-sm">- {adj.amount.toLocaleString('vi-VN')}đ</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Summary */}
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-2 mb-2">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="font-lexend text-gray-600 text-xs font-medium">Tổng tiền món:</Text>
                <Text className="font-lexend font-bold text-gray-900 text-sm">{totalBill.toLocaleString('vi-VN')}đ</Text>
              </View>
              
              {voucherDiscount > 0 && (
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="font-lexend text-green-700 text-xs font-medium">Khuyến mãi (Voucher):</Text>
                  <Text className="font-lexend font-bold text-green-700 text-sm">- {voucherDiscount.toLocaleString('vi-VN')}đ</Text>
                </View>
              )}
              
              {adjustmentsTotal > 0 && (
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="font-lexend text-amber-700 text-xs font-medium">Giảm giá phát sinh:</Text>
                  <Text className="font-lexend font-bold text-amber-700 text-sm">- {adjustmentsTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
              )}
              
              {depositPaid > 0 && (
                <View className="flex-row justify-between items-center mb-3 border-b border-gray-200 pb-3">
                  <Text className="font-lexend text-blue-700 text-xs font-medium">Tiền cọc đã thu:</Text>
                  <Text className="font-lexend font-bold text-blue-700 text-sm">- {depositPaid.toLocaleString('vi-VN')}đ</Text>
                </View>
              )}
              
              <View className="flex-row justify-between items-center pt-2">
                <Text className="font-lexend font-bold text-gray-900 text-sm">Cần thanh toán:</Text>
                <Text className="font-lexend font-bold text-blue-700 text-xl">{amountToPay.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-4 bg-gray-50 border-t border-gray-100 flex-row gap-3">
            <TouchableOpacity 
              onPress={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white border border-gray-300 py-3 rounded-xl items-center"
            >
              <Text className="font-lexend font-bold text-gray-700 text-sm">Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleCheckout}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 py-3 rounded-xl items-center flex-row justify-center"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="font-lexend font-bold text-white text-sm">Xác nhận Thanh Toán</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
