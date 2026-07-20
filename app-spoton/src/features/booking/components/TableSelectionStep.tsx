import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';

const TABLE_STATUS = {
  EMPTY:    { bg: 'bg-gray-100',   text: 'text-gray-600',  label: 'Trống' },
  HOLDING:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Đang giữ' },
  LOCKED:   { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Đã khóa' },
  RESERVED: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Đã đặt' },
  OCCUPIED: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Đang dùng' },
  CLEANING: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Đang dọn' },
} as Record<string, { bg: string; text: string; label: string }>;

interface TableSelectionStepProps {
  state: any;
  actions: any;
}

export function TableSelectionStep({ state, actions }: TableSelectionStepProps) {
  const { zones, selectedZoneIdx, selectedTableIds, bookedTableIds } = state;
  const { setSelectedZoneIdx, handleTableToggle } = actions;

  return (
    <View className="flex-1">
      <ScrollView horizontal className="px-4 py-3 border-b border-gray-100 bg-white" showsHorizontalScrollIndicator={false}>
        {zones.map((zone: any, idx: number) => (
          <TouchableOpacity key={zone._id || idx} onPress={() => setSelectedZoneIdx(idx)}
            className={`px-4 py-2 mr-2 rounded-full ${selectedZoneIdx === idx ? 'bg-amber-700' : 'bg-gray-200'}`}>
            <Text className={`font-lexend text-sm font-semibold ${selectedZoneIdx === idx ? 'text-white' : 'text-gray-600'}`}>{zone.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={(zones[selectedZoneIdx]?.tables || []) as any[]}
        keyExtractor={(item: any) => item._id}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item: table }: { item: any }) => {
          const isBooked = bookedTableIds.includes(table._id);
          const isSelected = selectedTableIds.includes(table._id);
          const isAvailable = !isBooked && (table.status === 'EMPTY' || !table.status);
          const statusInfo = TABLE_STATUS[table.status] || TABLE_STATUS.EMPTY;
          return (
            <TouchableOpacity
              className={`flex-1 m-2 p-4 rounded-xl border-2 ${
                isSelected ? 'border-amber-700 bg-amber-50' :
                isAvailable ? 'border-green-300 bg-green-50' :
                'border-gray-200 bg-gray-100 opacity-60'
              }`}
              onPress={() => isAvailable && handleTableToggle(table._id)}
              disabled={!isAvailable}>
              <Text className="font-lexend font-bold text-text">{table.table_number}</Text>
              <Text className="font-lexend text-xs text-muted">Chỗ ngồi: {table.capacity}</Text>
              <View className={`mt-2 px-2 py-1 rounded-full self-start ${isSelected ? 'bg-amber-100' : statusInfo.bg}`}>
                <Text className={`text-xs font-lexend font-bold ${isSelected ? 'text-amber-700' : statusInfo.text}`}>
                  {isBooked ? 'Đã đặt' : isSelected ? '✓ Đã chọn' : statusInfo.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View className="py-10 items-center"><Text className="font-lexend text-muted">Không có bàn trong khu vực này</Text></View>}
      />
      {selectedTableIds.length > 0 && (
        <View className="px-4 py-2 bg-amber-50 border-t border-amber-200">
          <Text className="font-lexend text-amber-800 text-sm font-semibold">Đã chọn {selectedTableIds.length} bàn</Text>
        </View>
      )}
    </View>
  );
}
