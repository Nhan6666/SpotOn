import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { BookingService } from '@/features/booking/booking.service';
import apiClient from '@/lib/axios';

// Correct table statuses from SCHEMA_DESIGN.md
const TABLE_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  EMPTY:    { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Empty' },
  HOLDING:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Holding' },
  LOCKED:   { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Locked' },
  RESERVED: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Reserved' },
  OCCUPIED: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Occupied' },
  CLEANING: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Cleaning' },
};

export function POSFeature() {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<any[]>([]);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInGuests, setWalkInGuests] = useState('2');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const branchId = user?.branch_id;

  const fetchData = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/branches/${branchId}`);
      if (res.data.success) {
        setBranch(res.data.data);
        const allTables: any[] = [];
        (res.data.data.zones || []).forEach((zone: any) => {
          (zone.tables || []).forEach((table: any) => {
            allTables.push({ ...table, zoneName: zone.name });
          });
        });
        setTables(allTables);
      }
    } catch (error) {
      console.log('Error fetching POS data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15s for real-time table updates
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTablePress = (table: any) => {
    if (table.status === 'EMPTY') {
      // Show walk-in option for empty tables
      setSelectedTableId(table._id);
      setShowWalkIn(true);
    } else if (table.status === 'OCCUPIED') {
      // In future: show order management
      Alert.alert('Table Occupied', `Table ${table.table_number} is currently in use.`);
    } else {
      Alert.alert('Table Info', `Table ${table.table_number}\nStatus: ${TABLE_STATUS_COLORS[table.status]?.label || table.status}\nCapacity: ${table.capacity}`);
    }
  };

  const handleWalkIn = async () => {
    if (!selectedTableId) return;
    
    try {
      const res = await BookingService.createWalkIn({
        table_ids: [selectedTableId],
        walk_in_name: walkInName || undefined,
        walk_in_phone: walkInPhone || undefined,
        guest_count: parseInt(walkInGuests) || 2,
      });

      if (res.success) {
        Alert.alert('Success', 'Walk-in booking created! Table is now occupied.');
        setShowWalkIn(false);
        setWalkInName('');
        setWalkInPhone('');
        setWalkInGuests('2');
        setSelectedTableId(null);
        fetchData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create walk-in');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  if (!branchId) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="font-lexend font-bold text-xl text-text mb-2">No Branch Assigned</Text>
        <Text className="font-lexend text-muted text-center">Contact your manager to assign you to a branch.</Text>
      </View>
    );
  }

  // Status summary
  const statusCounts = tables.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-6 pb-2">
        <Text className="font-lexend font-bold text-2xl text-text">POS - Tables</Text>
        <Text className="font-lexend text-muted mt-1">{branch?.name || 'Your Branch'}</Text>
      </View>

      {/* Status Summary Bar */}
      <View className="flex-row px-4 py-2 gap-2 flex-wrap">
        {Object.entries(statusCounts).map(([status, count]) => {
          const info = TABLE_STATUS_COLORS[status] || TABLE_STATUS_COLORS.EMPTY;
          return (
            <View key={status} className={`px-2 py-1 rounded-full ${info.bg}`}>
              <Text className={`text-xs font-lexend font-bold ${info.text}`}>{info.label}: {count}</Text>
            </View>
          );
        })}
      </View>

      <FlatList
        data={tables}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={['#b45309']} />}
        renderItem={({ item }) => {
          const statusInfo = TABLE_STATUS_COLORS[item.status] || TABLE_STATUS_COLORS.EMPTY;
          return (
            <TouchableOpacity
              className={`flex-1 m-2 p-4 rounded-md border border-gray-200 ${statusInfo.bg}`}
              onPress={() => handleTablePress(item)}
            >
              <Text className="font-lexend font-bold text-lg text-text">{item.table_number}</Text>
              <Text className="font-lexend text-xs text-muted">{item.zoneName}</Text>
              <Text className={`font-lexend font-semibold text-sm mt-2 ${statusInfo.text}`}>{statusInfo.label}</Text>
              <Text className="font-lexend text-xs text-muted mt-1">Seats: {item.capacity}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="font-lexend text-muted">No tables found</Text>
          </View>
        }
      />

      {/* Walk-in Modal */}
      {showWalkIn && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="font-lexend font-bold text-xl text-text mb-4">Walk-in Customer</Text>
            
            <View className="mb-3">
              <Text className="font-lexend text-sm text-muted mb-1">Guest Name (Optional)</Text>
              <TextInput
                className="border border-gray-200 rounded-md px-3 py-2 font-lexend"
                value={walkInName}
                onChangeText={setWalkInName}
                placeholder="Enter guest name"
              />
            </View>
            
            <View className="mb-3">
              <Text className="font-lexend text-sm text-muted mb-1">Phone (Optional)</Text>
              <TextInput
                className="border border-gray-200 rounded-md px-3 py-2 font-lexend"
                value={walkInPhone}
                onChangeText={setWalkInPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View className="mb-4">
              <Text className="font-lexend text-sm text-muted mb-1">Number of Guests</Text>
              <TextInput
                className="border border-gray-200 rounded-md px-3 py-2 font-lexend"
                value={walkInGuests}
                onChangeText={setWalkInGuests}
                keyboardType="numeric"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 py-3 border border-gray-200 rounded-md items-center"
                onPress={() => { setShowWalkIn(false); setSelectedTableId(null); }}
              >
                <Text className="font-lexend font-semibold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3 bg-amber-700 rounded-md items-center"
                onPress={handleWalkIn}
              >
                <Text className="font-lexend font-bold text-white">Open Table</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
