import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useBookingFlow } from './useBookingFlow';
import { DateTimeStep } from './components/DateTimeStep';
import { TableSelectionStep } from './components/TableSelectionStep';
import { PreOrderStep } from './components/PreOrderStep';
import { ConfirmationStep } from './components/ConfirmationStep';
import { PaymentStep } from './components/PaymentStep';

interface BookingFlowProps {
  id: string; // branch_id
}

export function BookingFlowFeature({ id }: BookingFlowProps) {
  const { state, actions } = useBookingFlow(id);
  
  const { step, initLoading, loading, branch, canPreOrder } = state;
  const { setStep, checkAvailabilityAndContinue, handleHoldAndContinue, handleConfirmBooking, handleProcessPayment, router } = actions;

  if (initLoading) {
    return <View className="flex-1 justify-center items-center bg-background"><ActivityIndicator size="large" color="#b45309" /></View>;
  }

  if (branch?.status === 'CLOSED') {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="font-lexend font-bold text-xl text-text mb-2">Chi nhánh đã đóng cửa</Text>
        <Text className="font-lexend text-muted text-center mb-4">Vui lòng chọn chi nhánh khác hoặc quay lại sau.</Text>
        <Button title="Quay lại" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  if (branch?.status === 'FULL') {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="font-lexend font-bold text-xl text-text mb-2">Chi nhánh đã đầy</Text>
        <Text className="font-lexend text-muted text-center mb-4">Hiện tại chi nhánh không còn chỗ. Vui lòng thử lại sau.</Text>
        <Button title="Quay lại" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const totalSteps = canPreOrder ? 5 : 4;
  const stepLabels = ['Chọn ngày giờ', 'Chọn bàn', ...(canPreOrder ? ['Đặt trước món'] : []), 'Xác nhận', 'Thanh toán'];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-2 border-b border-gray-100 bg-white flex-row items-center">
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} className="mr-3">
          <Text className="text-text text-xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-lexend font-bold text-lg text-text">{branch?.name || 'Đặt bàn'}</Text>
          <Text className="font-lexend text-muted text-xs">Bước {step}/{totalSteps} — {stepLabels[step - 1]}</Text>
        </View>
      </View>

      {/* Step Renderers */}
      {step === 1 && <DateTimeStep state={state} actions={actions} />}
      {step === 2 && <TableSelectionStep state={state} actions={actions} />}
      {step === 3 && <PreOrderStep state={state} actions={actions} />}
      {step === 4 && <ConfirmationStep state={state} actions={actions} />}
      {step === 5 && <PaymentStep state={state} actions={actions} />}

      {/* Bottom Bar */}
      <View className="p-4 bg-white border-t border-gray-100">
        <Button 
          title={
            step === 1 ? 'Kiểm tra bàn trống' :
            step === 2 ? 'Giữ bàn & tiếp tục' :
            step === 3 && canPreOrder ? 'Tiếp tục' :
            step === 4 ? 'Xác nhận & Thanh toán' :
            'Thanh toán qua ' + (state.paymentMethod === 'MOMO' ? 'MoMo' : 'VNPAY')
          }
          onPress={() => {
            if (step === 1) { checkAvailabilityAndContinue(); }
            else if (step === 2) { handleHoldAndContinue(); }
            else if (step === 3 && canPreOrder) { setStep(4); }
            else if (step === 4) { handleConfirmBooking(); }
            else if (step === 5) { handleProcessPayment(); }
          }}
          loading={loading}
        />
      </View>
    </View>
  );
}
