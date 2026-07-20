import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

interface PaymentStepProps {
  state: any;
  actions: any;
}

export function PaymentStep({ state, actions }: PaymentStepProps) {
  const { paymentTimeLeft, depositAmount, paymentMethod } = state;
  const { setPaymentMethod } = actions;

  return (
    <ScrollView className="flex-1 p-4">
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 items-center">
        <Text className="font-lexend font-bold text-lg mb-2">Thanh toán cọc bảo đảm</Text>
        <Text className="font-lexend text-muted text-center text-sm mb-4">
          Theo quy định, bạn cần thanh toán cọc để xác nhận đặt bàn. Bàn sẽ được giữ cho bạn trong thời gian đếm ngược dưới đây.
        </Text>
        
        <View className="bg-orange-50 px-6 py-3 rounded-xl border border-orange-200 mb-6 w-full items-center">
          <Text className="font-lexend text-orange-800 text-sm mb-1">Thời gian giữ bàn còn lại</Text>
          <Text className="font-lexend font-bold text-3xl text-orange-600">
            {Math.floor(paymentTimeLeft / 60).toString().padStart(2, '0')}:{(paymentTimeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        <View className="w-full flex-row justify-between mb-2">
          <Text className="font-lexend text-muted">Số tiền cần thanh toán:</Text>
          <Text className="font-lexend font-bold text-primary text-lg">{depositAmount.toLocaleString('vi-VN')}đ</Text>
        </View>

        <View className="w-full mt-4">
          <Text className="font-lexend font-bold mb-3">Phương thức thanh toán</Text>
          <TouchableOpacity onPress={() => setPaymentMethod('VNPAY')} className={`flex-row items-center p-3 border rounded-xl mb-2 ${paymentMethod === 'VNPAY' ? 'border-primary bg-amber-50' : 'border-gray-200'}`}>
            <View className="w-4 h-4 rounded-full border border-primary mr-3 items-center justify-center">
              {paymentMethod === 'VNPAY' && <View className="w-2 h-2 rounded-full bg-primary" />}
            </View>
            <Text className="font-lexend font-semibold text-text">Thanh toán qua VNPAY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethod('MOMO')} className={`flex-row items-center p-3 border rounded-xl ${paymentMethod === 'MOMO' ? 'border-primary bg-amber-50' : 'border-gray-200'}`}>
            <View className="w-4 h-4 rounded-full border border-primary mr-3 items-center justify-center">
              {paymentMethod === 'MOMO' && <View className="w-2 h-2 rounded-full bg-primary" />}
            </View>
            <Text className="font-lexend font-semibold text-text">Thanh toán qua MoMo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
