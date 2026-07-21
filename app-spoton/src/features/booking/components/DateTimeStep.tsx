import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';

interface DateTimeStepProps {
  state: any;
  actions: any;
}

export function DateTimeStep({ state, actions }: DateTimeStepProps) {
  const { dateOptions, timeOptions, selectedDateIdx, selectedTimeIdx, guests, note } = state;
  const { setSelectedDateIdx, setSelectedTimeIdx, setGuests, setNote } = actions;

  return (
    <ScrollView className="flex-1 p-4">
      {/* Date Selector */}
      <Text className="font-lexend font-bold text-base mb-2">Chọn ngày</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {dateOptions.map((d: any, i: number) => (
          <TouchableOpacity key={d.value} onPress={() => { setSelectedDateIdx(i); setSelectedTimeIdx(-1); }}
            className={`px-4 py-3 mr-2 rounded-xl border ${selectedDateIdx === i ? 'bg-amber-700 border-amber-700' : 'bg-white border-gray-200'}`}>
            <Text className={`font-lexend font-semibold text-sm ${selectedDateIdx === i ? 'text-white' : 'text-text'}`}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time Selector */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-lexend font-bold text-base">Chọn giờ</Text>
        <Text className="font-lexend text-[10px] text-orange-700 bg-orange-100 px-2 py-1 rounded-md overflow-hidden">
          * Đặt trước tối thiểu 2 tiếng
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {timeOptions.map((t: any, i: number) => (
          <TouchableOpacity key={t.value} onPress={() => !t.disabled && setSelectedTimeIdx(i)} disabled={t.disabled}
            className={`px-3 py-2 rounded-lg border ${
              t.disabled ? 'bg-gray-100 border-gray-100 opacity-40' :
              selectedTimeIdx === i ? 'bg-amber-700 border-amber-700' : 'bg-white border-gray-200'
            }`}>
            <Text className={`font-lexend text-sm font-semibold ${
              t.disabled ? 'text-gray-400' :
              selectedTimeIdx === i ? 'text-white' : 'text-text'
            }`}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Guests */}
      <Text className="font-lexend font-bold text-base mb-2">Số khách</Text>
      <View className="flex-row items-center bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <TouchableOpacity onPress={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Text className="font-lexend font-bold text-lg">-</Text>
        </TouchableOpacity>
        <Text className="font-lexend font-bold text-xl mx-6">{guests}</Text>
        <TouchableOpacity onPress={() => setGuests(Math.min(20, guests + 1))} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Text className="font-lexend font-bold text-lg">+</Text>
        </TouchableOpacity>
      </View>

      <Input label="Ghi chú (tùy chọn)" value={note} onChangeText={setNote} placeholder="Dị ứng, ghế trẻ em, v.v." />
    </ScrollView>
  );
}
