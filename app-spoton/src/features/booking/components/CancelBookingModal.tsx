import { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface CancelBookingModalProps {
  visible: boolean;
  onClose: () => void;
  booking: any;
  onConfirm: (data: any) => Promise<void>;
}

export function CancelBookingModal({ visible, onClose, booking, onConfirm }: CancelBookingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [reason, setReason] = useState('');

  // Calculate refund
  const now = new Date();
  const arrivalDate = new Date(booking?.reservation_date || new Date());
  const [hours, minutes] = (booking?.arrival_time || '00:00').split(':').map(Number);
  arrivalDate.setHours(hours, minutes, 0, 0);

  const diffMs = arrivalDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  let refundPercentage = 0;
  if (diffHours >= 12) refundPercentage = 100;
  else if (diffHours >= 6) refundPercentage = 50;
  else refundPercentage = 0;

  const depositPaid = booking?.total_deposit_paid || 0;
  const refundAmount = (depositPaid * refundPercentage) / 100;

  // Reset state when opened
  useEffect(() => {
    if (visible) {
      setStep(1);
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      setReason('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (refundAmount > 0) {
      if (!bankName || !accountNumber || !accountHolder) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin ngân hàng.');
        return;
      }
    }
    
    setLoading(true);
    await onConfirm({
      bank_name: bankName,
      bank_account_number: accountNumber,
      account_holder_name: accountHolder,
      cancellation_reason: reason
    });
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center px-4">
        <View className="bg-white rounded-xl overflow-hidden max-h-[90%]">
          {/* Header */}
          <View className="bg-red-600 p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <FontAwesome name="warning" size={20} color="white" />
              <View className="ml-3">
                <Text className="font-lexend font-bold text-white text-lg">Xác nhận Hủy Bàn</Text>
                <Text className="font-lexend text-white/80 text-xs">Mã đơn: {booking?._id?.slice(-6).toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {step === 1 ? (
            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Policy Box */}
              <View className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-4">
                <Text className="font-lexend font-bold text-orange-800 mb-2">Chính sách hủy bàn & Hoàn cọc</Text>
                <Text className="font-lexend text-sm text-orange-900 mb-1">• Hủy trước <Text className="font-bold">12 tiếng</Text>: Hoàn 100% cọc</Text>
                <Text className="font-lexend text-sm text-orange-900 mb-1">• Hủy từ <Text className="font-bold">6 - 12 tiếng</Text>: Hoàn 50% cọc</Text>
                <Text className="font-lexend text-sm text-orange-900">• Hủy dưới <Text className="font-bold">6 tiếng</Text>: Không hoàn cọc</Text>
              </View>

              <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <View className="flex-row justify-between mb-3">
                  <Text className="font-lexend text-gray-500">Giờ đến dự kiến:</Text>
                  <Text className="font-lexend font-bold text-text">
                    {booking?.arrival_time} - {new Date(booking?.reservation_date || new Date()).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="font-lexend text-gray-500">Thời gian hủy trước:</Text>
                  <Text className="font-lexend font-bold text-blue-600">
                    {Math.max(0, diffHours).toFixed(1)} tiếng
                  </Text>
                </View>
                <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200">
                  <Text className="font-lexend text-gray-500">Tiền cọc đã thanh toán:</Text>
                  <Text className="font-lexend font-bold text-text">
                    {depositPaid.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-1">
                  <Text className="font-lexend font-bold text-text text-base">Tiền được hoàn lại:</Text>
                  <View className="items-end">
                    <Text className={`font-lexend font-bold text-lg ${refundAmount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {refundAmount.toLocaleString('vi-VN')}đ
                    </Text>
                    <Text className="font-lexend text-xs text-gray-500">({refundPercentage}%)</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity 
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-md items-center"
                  onPress={onClose}
                >
                  <Text className="font-lexend font-bold text-gray-700">Giữ lại bàn</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-[1.5] bg-red-600 py-3 rounded-md items-center"
                  onPress={() => refundAmount > 0 ? setStep(2) : handleSubmit()}
                >
                  <Text className="font-lexend font-bold text-white">
                    {refundAmount > 0 ? 'Tiếp tục điền Form' : 'Xác nhận Hủy Bàn'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              <View className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex-row items-start">
                <FontAwesome name="check-circle" size={16} color="#2563eb" className="mt-0.5" />
                <Text className="font-lexend text-sm text-blue-900 ml-2 flex-1">
                  Bạn sẽ được hoàn <Text className="font-bold">{refundAmount.toLocaleString('vi-VN')}đ</Text>. Vui lòng cung cấp chính xác thông tin tài khoản ngân hàng để chúng tôi chuyển khoản.
                </Text>
              </View>

              <Text className="font-lexend font-bold text-gray-700 mb-1 mt-2">Ngân hàng *</Text>
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                placeholder="VD: Vietcombank, MB Bank, Techcombank..."
                className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-lexend mb-3"
              />

              <Text className="font-lexend font-bold text-gray-700 mb-1">Số tài khoản *</Text>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Nhập số tài khoản ngân hàng"
                keyboardType="numeric"
                className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-lexend mb-3"
              />

              <Text className="font-lexend font-bold text-gray-700 mb-1">Tên chủ tài khoản *</Text>
              <TextInput
                value={accountHolder}
                onChangeText={setAccountHolder}
                placeholder="VD: NGUYEN VAN A"
                autoCapitalize="characters"
                className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-lexend mb-3"
              />

              <Text className="font-lexend font-bold text-gray-700 mb-1">Lý do hủy bàn</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Nhập lý do hủy (tùy chọn)..."
                multiline
                numberOfLines={3}
                className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-lexend mb-4"
                style={{ textAlignVertical: 'top' }}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity 
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-md items-center"
                  onPress={() => setStep(1)}
                  disabled={loading}
                >
                  <Text className="font-lexend font-bold text-gray-700">Quay lại</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-[1.5] bg-red-600 py-3 rounded-md items-center flex-row justify-center gap-2"
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading && <ActivityIndicator color="white" size="small" />}
                  <Text className="font-lexend font-bold text-white">Xác nhận hủy & Hoàn tiền</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
