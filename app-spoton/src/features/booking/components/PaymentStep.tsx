import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';

interface PaymentStepProps {
  state: any;
  actions: any;
}

export function PaymentStep({ state, actions }: PaymentStepProps) {
  const { paymentTimeLeft, paymentDetails, paymentMethod, voucherCode, myVouchers } = state;
  const { setPaymentMethod, setVoucherCode, handleApplyVoucher } = actions;

  // Safe access to paymentDetails
  const tableDeposit = paymentDetails?.table_deposit_amount || 0;
  const preOrderDeposit = paymentDetails?.pre_order_deposit_amount || 0;
  const voucherDiscount = paymentDetails?.voucher_discount_amount || 0;
  const totalDeposit = paymentDetails?.total_deposit || 0;

  const unusedVouchers = (myVouchers || []).filter((v: any) => v.status === 'UNUSED');

  return (
    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <Text className="font-lexend font-bold text-lg mb-2">Chi tiết Tiền cọc</Text>
        
        <View className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-4 items-center">
          <Text className="font-lexend text-orange-800 text-xs mb-1">Thời gian thanh toán còn lại</Text>
          <Text className="font-lexend font-bold text-2xl text-orange-600">
            {Math.floor(paymentTimeLeft / 60).toString().padStart(2, '0')}:{(paymentTimeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="font-lexend text-gray-600">Cọc giữ bàn (Mặc định)</Text>
          <Text className="font-lexend font-semibold">{tableDeposit.toLocaleString('vi-VN')}đ</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="font-lexend text-gray-600">Cọc món (50% tiền món)</Text>
          <Text className="font-lexend font-semibold">{preOrderDeposit.toLocaleString('vi-VN')}đ</Text>
        </View>
        {voucherDiscount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="font-lexend text-green-600">Giảm giá Voucher</Text>
            <Text className="font-lexend font-semibold text-green-600">-{voucherDiscount.toLocaleString('vi-VN')}đ</Text>
          </View>
        )}

        <View className="border-t border-gray-100 mt-2 pt-3">
          <Text className="font-lexend text-sm text-gray-500 mb-2">Mã giảm giá</Text>
          
          {unusedVouchers.length > 0 && (
            <View className="mb-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                {unusedVouchers.map((v: any) => {
                  const vId = v.voucher_id;
                  if (!vId) return null;
                  const isSelected = voucherCode === vId.code;
                  return (
                    <TouchableOpacity
                      key={v._id}
                      onPress={() => setVoucherCode(vId.code)}
                      className={`mr-3 p-3 rounded-xl border ${isSelected ? 'border-primary bg-amber-50' : 'border-gray-200 bg-white'}`}
                      style={{ width: 160 }}
                    >
                      <View className="flex-row items-center mb-1">
                        <Text className="font-lexend font-bold text-primary mr-1">🎟️</Text>
                        <Text className="font-lexend font-bold text-xs text-text flex-1" numberOfLines={1}>{vId.code}</Text>
                      </View>
                      <Text className="font-lexend text-xs text-gray-600" numberOfLines={2}>
                        Giảm {vId.discount_percentage}% 
                        {vId.max_discount_amount ? ` tối đa ${vId.max_discount_amount.toLocaleString('vi-VN')}đ` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View className="flex-row items-center mb-2">
            <TextInput 
              value={voucherCode}
              onChangeText={setVoucherCode}
              placeholder="Nhập mã giảm giá..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 font-lexend text-sm mr-2"
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              onPress={handleApplyVoucher}
              className="bg-gray-600 px-4 py-2.5 rounded-lg"
            >
              <Text className="font-lexend font-bold text-white text-sm">Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="border-t border-gray-100 mt-2 pt-3">
          <Text className="font-lexend text-sm text-gray-500 mb-1">Tổng cọc cần thanh toán</Text>
          <Text className="font-lexend font-bold text-3xl text-orange-600">{totalDeposit.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-10">
        <Text className="font-lexend font-bold text-lg mb-3">Phương thức thanh toán</Text>
        
        <TouchableOpacity onPress={() => setPaymentMethod('VNPAY')} className={`flex-row items-center p-3 border rounded-xl mb-3 ${paymentMethod === 'VNPAY' ? 'border-primary bg-amber-50' : 'border-gray-200'}`}>
          <View className="w-4 h-4 rounded-full border border-primary mr-3 items-center justify-center">
            {paymentMethod === 'VNPAY' && <View className="w-2 h-2 rounded-full bg-primary" />}
          </View>
          <View className="flex-1">
            <Text className="font-lexend font-semibold text-text text-base">Thanh toán qua VNPAY</Text>
            <Text className="font-lexend text-muted text-xs">Thẻ ATM / Thẻ quốc tế / QR Code</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPaymentMethod('MOMO')} className={`flex-row items-center p-3 border rounded-xl ${paymentMethod === 'MOMO' ? 'border-primary bg-amber-50' : 'border-gray-200'}`}>
          <View className="w-4 h-4 rounded-full border border-primary mr-3 items-center justify-center">
            {paymentMethod === 'MOMO' && <View className="w-2 h-2 rounded-full bg-primary" />}
          </View>
          <View className="flex-1">
            <Text className="font-lexend font-semibold text-text text-base">Thanh toán qua MoMo</Text>
            <Text className="font-lexend text-muted text-xs">Quét mã QR / Ứng dụng MoMo</Text>
          </View>
        </TouchableOpacity>
        
        <View className="bg-blue-50 mt-4 p-3 rounded-lg border border-blue-100 flex-row">
          <Text className="text-blue-500 mr-2">🛡️</Text>
          <Text className="font-lexend text-blue-800 text-xs flex-1">
            Giao dịch được mã hóa bảo mật tuyệt đối. Trạng thái đặt bàn sẽ tự động cập nhật ngay sau khi thanh toán thành công.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
