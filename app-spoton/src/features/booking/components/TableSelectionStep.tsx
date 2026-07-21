import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const TABLE_STATUS = {
  EMPTY:    { bg: 'bg-green-50',   border: 'border-green-400', text: 'text-green-700', label: 'Trống' },
  HOLDING:  { bg: 'bg-yellow-50',  border: 'border-yellow-400', text: 'text-yellow-700', label: 'Đang giữ' },
  LOCKED:   { bg: 'bg-gray-100',   border: 'border-gray-400', text: 'text-gray-700', label: 'Bảo trì' },
  RESERVED: { bg: 'bg-blue-50',    border: 'border-blue-400', text: 'text-blue-700', label: 'Đã đặt' },
  OCCUPIED: { bg: 'bg-red-50',     border: 'border-red-400', text: 'text-red-700', label: 'Đang dùng' },
  CLEANING: { bg: 'bg-orange-50',  border: 'border-orange-400', text: 'text-orange-700', label: 'Đang dọn' },
} as Record<string, { bg: string; border: string; text: string; label: string }>;

interface TableSelectionStepProps {
  state: any;
  actions: any;
}

export function TableSelectionStep({ state, actions }: TableSelectionStepProps) {
  const { zones, selectedZoneIdx, selectedTableIds, bookedTableIds } = state;
  const { setSelectedZoneIdx, handleTableToggle } = actions;

  const currentZone = zones[selectedZoneIdx];
  const tables = currentZone?.tables || [];

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View style={{ height: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <ScrollView 
          horizontal 
          contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }} 
          showsHorizontalScrollIndicator={false}
        >
          {zones.map((zone: any, idx: number) => (
            <TouchableOpacity key={zone._id || idx} onPress={() => setSelectedZoneIdx(idx)}
              className={`px-5 py-2 mr-3 rounded-full ${selectedZoneIdx === idx ? 'bg-amber-700' : 'bg-gray-100'}`}>
              <Text className={`font-lexend text-sm font-semibold ${selectedZoneIdx === idx ? 'text-white' : 'text-gray-600'}`}>{zone.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <View className="bg-white px-4 py-2 border-b border-gray-100 flex-row justify-between">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center mr-3">
            <View className="w-3 h-3 rounded bg-green-200 border border-green-400 mr-1" />
            <Text className="font-lexend text-xs text-gray-600">Trống</Text>
          </View>
          <View className="flex-row items-center mr-3">
            <View className="w-3 h-3 rounded bg-amber-200 border border-amber-400 mr-1" />
            <Text className="font-lexend text-xs text-gray-600">Đang chọn</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded bg-gray-200 border border-gray-400 mr-1" />
            <Text className="font-lexend text-xs text-gray-600">Không khả dụng</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal className="flex-1 z-0">
        <ScrollView className="flex-1" bounces={false} contentContainerStyle={{ padding: 20 }}>
          <View style={{ width: 1200, height: 1200, backgroundColor: '#f8fafc', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', position: 'relative' }}>
            {/* Grid Pattern */}
            <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0.1 }} pointerEvents="none">
              {Array.from({ length: 30 }).map((_, i) => (
                <View key={`v-${i}`} style={{ position: 'absolute', left: i * 40, top: 0, bottom: 0, width: 1, backgroundColor: '#64748b' }} />
              ))}
              {Array.from({ length: 30 }).map((_, i) => (
                <View key={`h-${i}`} style={{ position: 'absolute', top: i * 40, left: 0, right: 0, height: 1, backgroundColor: '#64748b' }} />
              ))}
            </View>

            {tables.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="font-lexend text-muted">Không có bàn trong khu vực này</Text>
              </View>
            ) : (
              tables.map((table: any) => {
                const isBooked = bookedTableIds.includes(table._id);
                const isSelected = selectedTableIds.includes(table._id);
                const isLocked = table.status === 'LOCKED';
                
                // Bàn có thể đặt nếu không bị đặt (trong ca đó) và không bị khóa (bảo trì)
                const isAvailable = !isBooked && !isLocked;
                
                // Mặc định bàn trống (xanh lá) nếu khả dụng
                let colors = TABLE_STATUS.EMPTY;
                
                if (!isAvailable) {
                  colors = { 
                    bg: 'bg-gray-100', 
                    border: 'border-gray-300', 
                    text: 'text-gray-400', 
                    label: isBooked ? 'Đã đặt' : 'Bảo trì' 
                  };
                }
                
                if (isSelected) {
                  colors = { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-800', label: 'Đang chọn' };
                }

                return (
                  <TouchableOpacity
                    key={table._id}
                    disabled={!isAvailable}
                    onPress={() => handleTableToggle(table._id)}
                    style={{
                      position: 'absolute',
                      left: table.x || 0,
                      top: table.y || 0,
                      width: table.width || 80,
                      height: table.height || 80,
                      borderRadius: table.shape === 'CIRCLE' ? (table.width || 80) / 2 : 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                    className={`${colors.bg} ${colors.border} border-2`}
                  >
                    <Text className={`font-lexend font-bold text-lg mb-0.5 ${colors.text}`}>
                      {table.table_number}
                    </Text>
                    <Text className={`font-lexend text-[10px] mb-1 ${colors.text}`}>
                      {table.capacity} chỗ
                    </Text>
                    {isSelected && (
                      <View className="bg-amber-500 px-1.5 py-0.5 rounded-full absolute -top-2 -right-2 border border-white">
                        <Text className="text-[10px] font-lexend font-bold text-white">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {selectedTableIds.length > 0 && (
        <View className="px-4 py-3 bg-amber-50 border-t border-amber-200 flex-row justify-between items-center shadow-lg">
          <Text className="font-lexend text-amber-800 text-sm font-semibold">Đã chọn {selectedTableIds.length} bàn</Text>
        </View>
      )}
    </View>
  );
}
