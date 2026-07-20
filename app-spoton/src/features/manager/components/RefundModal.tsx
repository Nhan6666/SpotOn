import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';
import * as ImagePicker from 'expo-image-picker';

interface RefundModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

const REFUND_TYPES = [
  { value: 'DEPOSIT_DIFF', label: 'Chênh lệch cọc' },
  { value: 'CANCEL_POLICY', label: 'Hủy bàn (chính sách)' },
  { value: 'QUALITY_ISSUE', label: 'Than phiền chất lượng' },
  { value: 'GOODWILL', label: 'Thiện chí nhà hàng' },
  { value: 'OTHER', label: 'Khác' },
];

export function RefundModal({ visible, booking, onClose, onSuccess }: RefundModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'FORM' | 'CONFIRM'>('FORM');
  
  const [refundAmount, setRefundAmount] = useState(booking?.refund_info?.refund_amount ? String(booking.refund_info.refund_amount) : '');
  const [refundType, setRefundType] = useState(booking?.refund_info?.bank_account_number ? 'CANCEL_POLICY' : 'QUALITY_ISSUE');
  const [reason, setReason] = useState(booking?.refund_info?.bank_account_number ? 'Hoàn tiền hủy bàn theo yêu cầu của khách.' : '');
  const [proofUri, setProofUri] = useState<string | null>(null);
  
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  if (!booking) return null;

  const customerName = booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai';
  
  const alreadyRefunded = booking.status === 'REFUND_COMPLETED' ? (booking.refund_info?.refund_amount || 0) : 0;
  const maxRefundable = booking.status === 'CANCELLED_REFUND_PENDING'
    ? (booking.refund_info?.refund_amount || booking.total_deposit_paid || 0)
    : (booking.total_deposit_paid || 0) + (booking.amount_collected || 0) - alreadyRefunded;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setProofUri(result.assets[0].uri);
    }
  };

  const uploadRefundProof = async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'proof.jpg';
    const type = `image/${filename.split('.').pop()}`;
    
    formData.append('file', {
      uri,
      name: filename,
      type
    } as any);

    const res = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data?.success) {
      return res.data.data.url;
    }
    throw new Error('Upload ảnh thất bại');
  };

  const canSubmit = 
    refundAmount && 
    Number(refundAmount) > 0 && 
    Number(refundAmount) <= maxRefundable &&
    reason.trim() && 
    proofUri;

  const handleSubmitRefund = async () => {
    if (!canSubmit || !proofUri) return;

    setIsSubmitting(true);
    try {
      const uploadedUrl = await uploadRefundProof(proofUri);
      
      const typeLabel = REFUND_TYPES.find(t => t.value === refundType)?.label || '';
      const finalReason = `[${typeLabel}] ${reason}`;
      
      await apiClient.post(`/reception/bookings/${booking._id}/refund`, {
        refund_amount: Number(refundAmount),
        reason: finalReason,
        refund_proof_url: uploadedUrl
      });
      
      Alert.alert('Thành công', `Hoàn tiền ${Number(refundAmount).toLocaleString()}đ thành công!`);
      onSuccess();
    } catch (error: any) {
      Alert.alert('Lỗi hoàn tiền', error.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl w-full max-h-[90%] overflow-hidden">
          {/* Header */}
          <View className="bg-red-600 px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="bg-white/20 p-2 rounded-xl mr-3">
                <FontAwesome name="undo" size={20} color="white" />
              </View>
              <View className="flex-1 pr-2">
                <Text className="font-lexend font-bold text-lg text-white">Hoàn Tiền (Refund)</Text>
                <Text className="font-lexend text-xs text-red-100" numberOfLines={1}>{customerName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-white/10 rounded-full">
              <FontAwesome name="times" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {step === 'FORM' ? (
              <View className="pb-10">
                {/* Notice */}
                <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex-row items-start">
                  <FontAwesome name="exclamation-triangle" size={16} color="#dc2626" style={{ marginTop: 2, marginRight: 8 }} />
                  <View className="flex-1">
                    <Text className="font-lexend font-bold text-red-900 text-xs">Hành động nhạy cảm tài chính</Text>
                    <Text className="font-lexend text-red-700 text-[10px] mt-1 leading-4">
                      Sẽ được ghi log đầy đủ. Bắt buộc upload ảnh UNC/phiếu chi.
                    </Text>
                  </View>
                </View>

                {/* Amounts */}
                <View className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-lexend text-gray-600 text-xs">Cọc đã thu:</Text>
                    <Text className="font-lexend font-bold text-gray-900 text-xs">{(booking.total_deposit_paid || 0).toLocaleString()}đ</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-lexend text-gray-600 text-xs">Thu tại quầy:</Text>
                    <Text className="font-lexend font-bold text-gray-900 text-xs">{(booking.amount_collected || 0).toLocaleString()}đ</Text>
                  </View>
                  {alreadyRefunded > 0 && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="font-lexend text-red-600 text-xs">Đã hoàn trước:</Text>
                      <Text className="font-lexend font-bold text-red-600 text-xs">-{alreadyRefunded.toLocaleString()}đ</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between pt-2 border-t border-gray-200 mt-1">
                    <Text className="font-lexend font-bold text-gray-900 text-xs">Tối đa có thể hoàn:</Text>
                    <Text className="font-lexend font-bold text-red-600 text-sm">{maxRefundable.toLocaleString()}đ</Text>
                  </View>
                </View>

                {/* Customer Bank Info if exists */}
                {booking.refund_info?.bank_account_number && (
                  <View className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4">
                    <View className="flex-row items-center mb-2">
                      <FontAwesome name="check-circle" size={14} color="#1d4ed8" style={{ marginRight: 6 }} />
                      <Text className="font-lexend font-bold text-blue-900 text-xs">Thông tin nhận tiền</Text>
                    </View>
                    <Text className="font-lexend text-blue-800 text-xs mb-1"><Text className="font-bold">NH:</Text> {booking.refund_info.bank_name}</Text>
                    <Text className="font-lexend text-blue-800 text-xs mb-1"><Text className="font-bold">STK:</Text> {booking.refund_info.bank_account_number}</Text>
                    <Text className="font-lexend text-blue-800 text-xs"><Text className="font-bold">Tên:</Text> {booking.refund_info.account_holder_name}</Text>
                  </View>
                )}

                {/* Form fields */}
                <View className="mb-4">
                  <Text className="font-lexend font-bold text-gray-700 text-xs mb-2">Số tiền hoàn (đ) *</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={refundAmount}
                    onChangeText={setRefundAmount}
                    placeholder={`Tối đa ${maxRefundable.toLocaleString()}đ`}
                    className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-sm bg-white"
                  />
                  {refundAmount && Number(refundAmount) > maxRefundable && (
                    <Text className="font-lexend text-red-500 text-[10px] mt-1">Vượt quá số tiền có thể hoàn!</Text>
                  )}
                </View>

                <View className="mb-4 relative">
                  <Text className="font-lexend font-bold text-gray-700 text-xs mb-2">Loại hoàn tiền</Text>
                  <TouchableOpacity 
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white flex-row justify-between items-center"
                    onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                  >
                    <Text className="font-lexend text-sm text-gray-900">
                      {REFUND_TYPES.find(t => t.value === refundType)?.label || 'Chọn loại'}
                    </Text>
                    <FontAwesome name="chevron-down" size={10} color="#9ca3af" />
                  </TouchableOpacity>
                  
                  {showTypeDropdown && (
                    <View className="bg-white border border-gray-200 rounded-lg mt-1 overflow-hidden">
                      {REFUND_TYPES.map(t => (
                        <TouchableOpacity 
                          key={t.value} 
                          className="px-3 py-2.5 border-b border-gray-100"
                          onPress={() => {
                            setRefundType(t.value);
                            setShowTypeDropdown(false);
                          }}
                        >
                          <Text className={`font-lexend text-sm ${refundType === t.value ? 'font-bold text-red-600' : 'text-gray-700'}`}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="font-lexend font-bold text-gray-700 text-xs mb-2">Lý do chi tiết *</Text>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Mô tả lý do..."
                    className="border border-gray-300 rounded-lg px-3 py-2 font-lexend text-sm bg-white text-left"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="font-lexend font-bold text-gray-700 text-xs mb-2">Ảnh chứng từ UNC *</Text>
                  
                  {proofUri ? (
                    <View className="relative rounded-lg overflow-hidden border-2 border-green-300">
                      <Image source={{ uri: proofUri }} className="w-full h-32" resizeMode="cover" />
                      <TouchableOpacity 
                        onPress={() => setProofUri(null)}
                        className="absolute top-2 right-2 bg-red-500 w-8 h-8 rounded-full items-center justify-center shadow"
                      >
                        <FontAwesome name="times" size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      onPress={pickImage}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-5 items-center justify-center bg-gray-50"
                    >
                      <FontAwesome name="camera" size={24} color="#9ca3af" style={{ mb: 8 }} />
                      <Text className="font-lexend text-gray-600 text-xs font-medium mt-2">Bấm để chọn ảnh</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View className="pb-10 space-y-4">
                <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <Text className="font-lexend font-bold text-amber-900 text-sm mb-3">Xác nhận hoàn tiền</Text>
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-lexend text-gray-600 text-xs">Loại:</Text>
                    <Text className="font-lexend font-bold text-gray-900 text-xs">{REFUND_TYPES.find(t => t.value === refundType)?.label}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-lexend text-gray-600 text-xs">Số tiền:</Text>
                    <Text className="font-lexend font-bold text-red-600 text-lg">{Number(refundAmount).toLocaleString()}đ</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="font-lexend text-gray-600 text-xs">Lý do:</Text>
                    <Text className="font-lexend font-bold text-gray-900 text-xs flex-1 text-right ml-4" numberOfLines={2}>{reason}</Text>
                  </View>
                </View>

                {proofUri && (
                  <View className="rounded-lg overflow-hidden border border-gray-200">
                    <Image source={{ uri: proofUri }} className="w-full h-24" resizeMode="cover" />
                    <Text className="font-lexend text-[10px] text-center text-gray-500 py-1 bg-gray-50">Ảnh chứng từ đính kèm</Text>
                  </View>
                )}

                <Text className="font-lexend text-red-700 font-bold text-[10px] text-center mt-2">
                  ⚠️ Hành động KHÔNG THỂ hoàn tác!
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="p-4 bg-gray-50 border-t border-gray-200 flex-row gap-3">
            {step === 'FORM' ? (
              <>
                <TouchableOpacity 
                  onPress={onClose}
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-xl items-center"
                >
                  <Text className="font-lexend font-bold text-gray-700 text-sm">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setStep('CONFIRM')}
                  disabled={!canSubmit}
                  className={`flex-1 py-3 rounded-xl items-center ${canSubmit ? 'bg-red-600' : 'bg-red-300'}`}
                >
                  <Text className="font-lexend font-bold text-white text-sm">Xác nhận</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  onPress={() => setStep('FORM')}
                  disabled={isSubmitting}
                  className="flex-1 bg-white border border-gray-300 py-3 rounded-xl items-center"
                >
                  <Text className="font-lexend font-bold text-gray-700 text-sm">Quay lại</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSubmitRefund}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 py-3 rounded-xl items-center flex-row justify-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="font-lexend font-bold text-white text-sm">Hoàn Tiền</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
