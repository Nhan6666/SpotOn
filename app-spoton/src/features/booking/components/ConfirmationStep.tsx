import { View, Text, ScrollView, TextInput } from 'react-native';
import { InfoRow } from './InfoRow';

interface ConfirmationStepProps {
  state: any;
  actions: any;
}

export function ConfirmationStep({ state, actions }: ConfirmationStepProps) {
  const { branch, selectedDate, selectedTime, guests, note, cart, holdTimeLeft, selectedTableIds, zones, isAuthenticated, user } = state;
  const { getPreOrderTotal, setNote } = actions;

  const m = Math.floor(holdTimeLeft / 60);
  const s = holdTimeLeft % 60;
  const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const allTables = zones.flatMap((z: any) => z.tables || []);
  const selectedTableNames = allTables.filter((t: any) => selectedTableIds.includes(t._id)).map((t: any) => t.table_number).join(', ');

  return (
    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
      <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex-row justify-between items-center shadow-sm">
        <View className="flex-row items-center">
          <Text className="text-orange-500 mr-2 text-lg">⏱️</Text>
          <Text className="font-lexend text-orange-800 text-sm">Thời gian giữ bàn còn lại</Text>
        </View>
        <Text className="font-lexend font-bold text-orange-600 text-lg">{timeStr}</Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <Text className="font-lexend font-bold text-lg mb-4">Tóm tắt đặt bàn</Text>
        <InfoRow label="Chi nhánh" value={branch?.name || ''} />
        <InfoRow label="Ngày" value={selectedDate} />
        <InfoRow label="Giờ" value={selectedTime} />
        <InfoRow label="Số khách" value={`${guests} khách`} />
        <InfoRow label="Số bàn" value={`${selectedTableIds.length} bàn`} />
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-4">
        <Text className="font-lexend font-bold text-lg mb-4">Thông tin khách hàng</Text>
        <View className="mb-3">
          <Text className="font-lexend text-gray-700 text-sm mb-1">Họ tên người đặt <Text className="text-red-500">*</Text></Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-lexend text-gray-800"
            placeholder="Nhập tên của bạn"
            value={state.walkInName}
            onChangeText={actions.setWalkInName}
          />
        </View>
        <View className="mb-3">
          <Text className="font-lexend text-gray-700 text-sm mb-1">Số điện thoại <Text className="text-red-500">*</Text></Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-lexend text-gray-800"
            placeholder="Ví dụ: 0912345678"
            keyboardType="phone-pad"
            value={state.walkInPhone}
            onChangeText={actions.setWalkInPhone}
          />
        </View>
        {cart.length > 0 && (
          <View className="mt-4 pt-4 border-t border-gray-100">
            <Text className="font-lexend font-bold text-text mb-2">Món đặt trước ({cart.reduce((a: any, b: any) => a+b.quantity, 0)} món)</Text>
            {cart.map((i: any) => (
              <View key={i.item._id} className="flex-row justify-between mb-1">
                <Text className="font-lexend text-muted text-sm">{i.quantity}x {i.item.name}</Text>
                <Text className="font-lexend text-muted text-sm">{(i.item.price * i.quantity).toLocaleString('vi-VN')}đ</Text>
              </View>
            ))}
            <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-50">
              <Text className="font-lexend font-bold">Tổng món</Text>
              <Text className="font-lexend font-bold text-primary">{getPreOrderTotal().toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        )}
        {note ? <Text className="font-lexend text-muted text-sm mt-4">Ghi chú: {note}</Text> : null}
      </View>
    </ScrollView>
  );
}
