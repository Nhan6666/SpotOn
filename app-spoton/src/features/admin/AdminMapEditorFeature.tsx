import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, PanResponder, Animated, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import apiClient from '@/lib/http';
import { useRouter } from 'expo-router';

interface AdminMapEditorFeatureProps {
  id: string;
}

export function AdminMapEditorFeature({ id }: AdminMapEditorFeatureProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zone, setZone] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [tableTemplates, setTableTemplates] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const panRefs = useRef<{ [key: string]: { pan: Animated.ValueXY, panResponder: any } }>({});

  useEffect(() => {
    fetchMapData();
  }, [id]);

  const fetchMapData = async () => {
    try {
      const res = await apiClient.get(`/map-templates/${id}/zones`);
      if (res.data?.success) {
        const data = res.data.data;
        setTableTemplates(data.table_templates || []);
        
        if (data.zones && data.zones.length > 0) {
          const mainZone = data.zones[0];
          setZone(mainZone);
          
          const initialTables = mainZone.tables || [];
          initializePanResponders(initialTables);
          setTables(initialTables);
        }
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu sơ đồ');
    } finally {
      setLoading(false);
    }
  };

  const initializePanResponders = (tableList: any[]) => {
    const newRefs: any = { ...panRefs.current };
    tableList.forEach(t => {
      if (newRefs[t._id]) return; // Skip if already initialized
      
      const pan = new Animated.ValueXY({ x: t.x || 0, y: t.y || 0 });
      let currentX = t.x || 0;
      let currentY = t.y || 0;

      const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({ x: currentX, y: currentY });
          pan.setValue({ x: 0, y: 0 });
          setSelectedTable(t._id);
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (e, gestureState) => {
          pan.flattenOffset();
          // Grid snap
          const snapX = Math.round((pan.x as any)._value / 20) * 20;
          const snapY = Math.round((pan.y as any)._value / 20) * 20;
          
          const boundedX = Math.max(0, Math.min(snapX, 2000 - (t.width || 70)));
          const boundedY = Math.max(0, Math.min(snapY, 2000 - (t.height || 70)));

          pan.setValue({ x: boundedX, y: boundedY });
          currentX = boundedX;
          currentY = boundedY;

          setTables(prev => prev.map(pt => 
            pt._id === t._id ? { ...pt, x: boundedX, y: boundedY } : pt
          ));
        }
      });
      newRefs[t._id] = { pan, panResponder };
    });
    panRefs.current = newRefs;
  };

  const handleAddTable = async (template: any) => {
    if (!zone) return;
    try {
      const tableNumber = `Bàn ${(tables.length + 1)}`;
      
      const payload = {
        table_number: tableNumber,
        capacity: template.capacity,
        x: 100, 
        y: 100,
        width: template.width,
        height: template.height,
        shape: template.shape,
        image_url: template.image_url
      };

      const res = await apiClient.post(`/map-templates/${id}/zones/${zone._id}/tables`, payload);
      if (res.data?.success) {
        const newTable = res.data.data;
        setTables(prev => {
          const updated = [...prev, newTable];
          initializePanResponders(updated);
          return updated;
        });
        setSelectedTable(newTable._id);
      }
    } catch (error: any) {
      console.error('Error adding table:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm bàn');
    }
  };

  const handleSaveLayout = async () => {
    if (!zone) return;
    setSaving(true);
    try {
      const payload = {
        tables: tables.map(t => ({ _id: t._id, x: t.x, y: t.y }))
      };
      const res = await apiClient.put(`/map-templates/${id}/zones/${zone._id}/tables/layout`, payload);
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã lưu sơ đồ bàn');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      Alert.alert('Lỗi', 'Không thể lưu sơ đồ bàn');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!zone) return;
    Alert.alert('Xóa bàn', 'Bạn có chắc muốn xóa bàn này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/map-templates/${id}/zones/${zone._id}/tables/${tableId}`);
          setTables(prev => prev.filter(t => t._id !== tableId));
          const newRefs = { ...panRefs.current };
          delete newRefs[tableId];
          panRefs.current = newRefs;
          setSelectedTable(null);
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể xóa bàn');
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm z-10 border-b border-gray-200">
        <Text className="font-lexend font-bold text-lg text-gray-800">
          Sắp xếp Sơ đồ
        </Text>
        <TouchableOpacity 
          onPress={handleSaveLayout}
          disabled={saving}
          className={`bg-orange-600 px-4 py-2 rounded-lg flex-row items-center shadow-sm ${saving ? 'opacity-50' : ''}`}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <FontAwesome name="save" size={14} color="#fff" />}
          <Text className="font-lexend font-bold text-white text-sm ml-2">Lưu Layout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal className="flex-1 z-0">
        <ScrollView className="flex-1" bounces={false}>
          <TouchableOpacity 
            activeOpacity={1}
            onPress={() => setSelectedTable(null)}
            style={{ width: 1500, height: 1500, backgroundColor: '#f8fafc' }}
          >
            <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0.1, overflow: 'hidden' }} pointerEvents="none">
              {Array.from({ length: 40 }).map((_, i) => (
                <View key={`v-${i}`} style={{ position: 'absolute', left: i * 40, top: 0, bottom: 0, width: 1, backgroundColor: '#64748b' }} />
              ))}
              {Array.from({ length: 40 }).map((_, i) => (
                <View key={`h-${i}`} style={{ position: 'absolute', top: i * 40, left: 0, right: 0, height: 1, backgroundColor: '#64748b' }} />
              ))}
            </View>

            {tables.map(table => {
              const panItem = panRefs.current[table._id];
              if (!panItem) return null;
              
              const isSelected = selectedTable === table._id;
              
              return (
                <Animated.View
                  key={table._id}
                  {...panItem.panResponder.panHandlers}
                  style={[
                    panItem.pan.getLayout(),
                    {
                      position: 'absolute',
                      width: table.width || 70,
                      height: table.height || 70,
                      borderRadius: table.shape === 'CIRCLE' ? (table.width || 70) / 2 : 8,
                      backgroundColor: isSelected ? '#d1fae5' : '#fff',
                      borderWidth: 2,
                      borderColor: isSelected ? '#10b981' : '#10b981',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      elevation: isSelected ? 10 : 4,
                      zIndex: isSelected ? 10 : 1
                    }
                  ]}
                >
                  <Text className={`font-lexend font-bold text-lg ${isSelected ? 'text-emerald-800' : 'text-emerald-700'}`}>
                    {table.table_number}
                  </Text>
                  <Text className={`font-lexend text-[10px] font-medium ${isSelected ? 'text-emerald-600' : 'text-emerald-600'}`}>
                    {table.capacity} chỗ
                  </Text>
                  
                  {isSelected && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table._id);
                      }}
                      className="absolute -top-3 -right-3 bg-red-500 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
                      style={{ zIndex: 100, elevation: 10 }}
                    >
                      <FontAwesome name="times" size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            })}
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>
      
      <View className="bg-white px-4 py-3 border-t border-gray-200 shadow-lg" style={{ paddingBottom: 24 }}>
        <Text className="font-lexend font-bold text-sm text-gray-700 mb-2">Chạm để thêm bàn mới</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {tableTemplates.map((tpl, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => handleAddTable(tpl)}
              className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mr-3 items-center justify-center min-w-[100px]"
            >
              <FontAwesome name={tpl.shape === 'CIRCLE' ? 'circle' : 'square'} size={24} color="#2563eb" className="mb-2" />
              <Text className="font-lexend font-semibold text-blue-700 text-xs text-center">{tpl.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
