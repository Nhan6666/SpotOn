import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, PanResponder, Modal, TextInput, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { BranchService } from '../branch/branch.service';

const TABLE_SIZE = 80;

function DraggableTable({ table, onDragRelease, onPress }: any) {
  const pan = useRef(new Animated.ValueXY({ x: table.x || 0, y: table.y || 0 })).current;
  const panValue = useRef({ x: table.x || 0, y: table.y || 0 });

  useEffect(() => {
    pan.addListener((value) => {
      panValue.current = value;
    });
    return () => {
      pan.removeAllListeners();
    };
  }, [pan]);

  useEffect(() => {
    pan.setValue({ x: table.x || 0, y: table.y || 0 });
    panValue.current = { x: table.x || 0, y: table.y || 0 };
  }, [table.x, table.y]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          // Tap
          onPress(table);
        } else {
          // Drag release
          pan.flattenOffset();
          const newX = panValue.current.x;
          const newY = panValue.current.y;
          onDragRelease(table._id, newX, newY);
        }
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: panValue.current.x,
          y: panValue.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
        width: table.width || TABLE_SIZE,
        height: table.height || TABLE_SIZE,
        backgroundColor: '#d1fae5',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: table.shape === 'CIRCLE' ? (table.width || TABLE_SIZE) / 2 : 8,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text className="font-lexend font-bold text-emerald-800">{table.table_number}</Text>
      <Text className="font-lexend text-[10px] text-emerald-700">{table.capacity} chỗ</Text>
    </Animated.View>
  );
}

export function ManagerMapEditorFeature() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [branch, setBranch] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [activeZone, setActiveZone] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ _id: '', table_number: '', capacity: 2, width: 80, height: 80, shape: 'RECTANGLE' });
  const [templates, setTemplates] = useState<any[]>([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [zoneFormData, setZoneFormData] = useState({ name: '', capacity: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await BranchService.getMyBranch();
      if (data.success && data.data) {
        setBranch(data.data);
        setZones(data.data.zones || []);
        if (data.data.zones && data.data.zones.length > 0) {
          // Use functional state update to avoid dependency on activeZone
          setActiveZone((prevZone: any) => {
            const firstZone = prevZone ? data.data.zones.find((z: any) => z._id === prevZone._id) || data.data.zones[0] : data.data.zones[0];
            setTables(firstZone.tables || []);
            return firstZone;
          });
        }
      }

      const templatesData = await BranchService.getMapTemplates();
      if (templatesData.success && templatesData.data) {
        setTemplates(templatesData.data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectZone = (zone: any) => {
    setActiveZone(zone);
    setTables(zone.tables || []);
  };

  const handleDragRelease = (tableId: string, newX: number, newY: number) => {
    setTables(prev => {
      const newTables = prev.map(t => t._id === tableId ? { ...t, x: Math.max(0, newX), y: Math.max(0, newY) } : t);
      setZones(prevZones => prevZones.map(z => z._id === activeZone?._id ? { ...z, tables: newTables } : z));
      return newTables;
    });
  };

  const handleTablePress = (table: any) => {
    setFormData({
      _id: table._id,
      table_number: table.table_number,
      capacity: table.capacity,
      width: table.width || 80,
      height: table.height || 80,
      shape: table.shape || 'RECTANGLE'
    });
    setModalVisible(true);
  };

  const handleAddTable = () => {
    setFormData({ _id: '', table_number: '', capacity: 2, width: 80, height: 80, shape: 'RECTANGLE' });
    setModalVisible(true);
  };

  const handleAddZone = async () => {
    if (!zoneFormData.name) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khu vực');
      return;
    }
    try {
      setIsSaving(true);
      await BranchService.createZone(branch._id, zoneFormData);
      Alert.alert('Thành công', 'Đã thêm khu vực mới');
      setShowZoneModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm khu vực');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!activeZone) return;
    try {
      setIsSaving(true);
      await BranchService.applyMapTemplate(branch._id, activeZone._id, templateId);
      Alert.alert('Thành công', 'Đã áp dụng mẫu sơ đồ bàn thành công');
      setShowTemplateModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể áp dụng mẫu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLayout = async () => {
    try {
      setIsSaving(true);
      const payload = tables.map(t => ({ _id: t._id, x: Math.round(t.x || 0), y: Math.round(t.y || 0) }));
      const res = await BranchService.bulkUpdateTablesLayout(branch._id, activeZone._id, payload);
      if (res.success) {
        Alert.alert('Thành công', 'Đã lưu sơ đồ bàn');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu sơ đồ');
    } finally {
      setIsSaving(false);
    }
  };

  const saveTable = async () => {
    try {
      if (!formData.table_number) {
        Alert.alert('Lỗi', 'Vui lòng nhập số bàn');
        return;
      }
      setIsSaving(true);
      if (formData._id) {
        const res = await BranchService.updateTable(branch._id, activeZone._id, formData._id, formData);
        if (res.success && res.data) {
          const updated = res.data;
          setTables(prev => {
            const newTables = prev.map(t => t._id === formData._id ? { ...updated, x: t.x, y: t.y } : t);
            setZones(prevZones => prevZones.map(z => z._id === activeZone._id ? { ...z, tables: newTables } : z));
            return newTables;
          });
        }
      } else {
        const res = await BranchService.createTable(branch._id, activeZone._id, { ...formData, x: 50, y: 50 });
        if (res.success && res.data) {
          setTables(prev => {
            const newTables = [...prev, res.data];
            setZones(prevZones => prevZones.map(z => z._id === activeZone._id ? { ...z, tables: newTables } : z));
            return newTables;
          });
        }
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTable = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa bàn này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          try {
            if (formData._id) {
              await BranchService.deleteTable(branch._id, activeZone._id, formData._id);
              setModalVisible(false);
              setTables(prev => {
                const newTables = prev.filter(t => t._id !== formData._id);
                setZones(prevZones => prevZones.map(z => z._id === activeZone._id ? { ...z, tables: newTables } : z));
                return newTables;
              });
            }
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể xóa bàn');
          }
        }
      }
    ]);
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <ActivityIndicator size="large" color="#ea580c" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white flex-row justify-between items-center border-b border-gray-200 mt-8">
        <TouchableOpacity 
          onPress={() => router.push(user?.role === 'ADMIN' ? '/admin-branches' : '/branch-manage')} 
          className="p-2 -ml-2"
        >
          <FontAwesome name="arrow-left" size={18} color="#4b5563" />
        </TouchableOpacity>
        <Text className="font-lexend font-bold text-lg text-gray-900 flex-1 ml-2">Sơ đồ: {activeZone?.name}</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity 
            onPress={() => setShowTemplateModal(true)} 
            className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg"
          >
            <Text className="font-lexend font-bold text-xs text-blue-700">Dùng Mẫu</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSaveLayout} 
            disabled={isSaving}
            className="bg-orange-600 px-3 py-2 rounded-lg"
          >
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="font-lexend font-bold text-xs text-white">Lưu Sơ đồ</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Zone Tabs */}
      <View className="bg-white py-2 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {zones.map(z => (
            <TouchableOpacity 
              key={z._id} 
              onPress={() => selectZone(z)}
              className={`px-4 py-2 rounded-full mr-2 ${activeZone?._id === z._id ? 'bg-orange-100 border border-orange-200' : 'bg-gray-100 border border-gray-100'}`}
            >
              <Text className={`font-lexend font-bold text-sm ${activeZone?._id === z._id ? 'text-orange-700' : 'text-gray-600'}`}>{z.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            onPress={() => { setZoneFormData({ name: '', capacity: 0 }); setShowZoneModal(true); }}
            className="px-4 py-2 rounded-full mr-2 bg-emerald-50 border border-emerald-200 flex-row items-center"
          >
            <FontAwesome name="plus" size={12} color="#059669" />
            <Text className="font-lexend font-bold text-sm text-emerald-700 ml-1">Khu vực mới</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Canvas */}
      <ScrollView horizontal bounces={false} style={{ flex: 1 }}>
        <ScrollView bounces={false} style={{ flex: 1 }}>
          <View style={{ width: 1200, height: 1200, backgroundColor: '#f0fdf4', position: 'relative' }}>
            <View style={{ position: 'absolute', opacity: 0.1, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <View style={{ width: '100%', height: '100%', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#10b981', borderStyle: 'dashed' }} />
            </View>
            {tables.map((table: any) => (
              <DraggableTable key={table._id} table={table} onDragRelease={handleDragRelease} onPress={handleTablePress} />
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        onPress={handleAddTable}
        className="absolute bottom-10 right-6 w-14 h-14 bg-emerald-500 rounded-full justify-center items-center shadow-lg"
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Table Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <Text className="font-lexend font-bold text-lg text-gray-900 mb-4">{formData._id ? 'Sửa bàn' : 'Thêm bàn mới'}</Text>
            
            <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Tên bàn / Số bàn <Text className="text-red-500">*</Text></Text>
            <TextInput 
              value={formData.table_number} 
              onChangeText={t => setFormData({...formData, table_number: t})} 
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 font-lexend text-gray-900" 
              placeholder="VD: A1, VIP 1"
            />

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Sức chứa</Text>
                <TextInput 
                  value={String(formData.capacity)} 
                  onChangeText={t => setFormData({...formData, capacity: Number(t)})} 
                  keyboardType="numeric" 
                  className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900" 
                />
              </View>
              <View className="flex-1">
                <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Kiểu dáng</Text>
                <TouchableOpacity 
                  onPress={() => setFormData({...formData, shape: formData.shape === 'CIRCLE' ? 'RECTANGLE' : 'CIRCLE'})}
                  className="border border-gray-300 rounded-lg px-4 py-3 items-center justify-center bg-gray-50"
                >
                  <Text className="font-lexend font-medium text-gray-700">{formData.shape === 'CIRCLE' ? 'Tròn' : 'Vuông'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View className="flex-row justify-end items-center pt-4 border-t border-gray-100">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="px-4 py-3 mr-2">
                <Text className="font-lexend font-medium text-gray-500">Hủy</Text>
              </TouchableOpacity>
              {formData._id && (
                <TouchableOpacity onPress={deleteTable} className="px-4 py-3 mr-2 bg-red-50 rounded-lg">
                  <Text className="font-lexend font-bold text-red-600">Xóa</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={saveTable} className="px-6 py-3 bg-orange-600 rounded-lg">
                <Text className="font-lexend font-bold text-white">Lưu Bàn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Zone Modal */}
      <Modal visible={showZoneModal} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <Text className="font-lexend font-bold text-lg text-gray-900 mb-4">Thêm khu vực mới</Text>
            
            <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Tên khu vực <Text className="text-red-500">*</Text></Text>
            <TextInput 
              value={zoneFormData.name} 
              onChangeText={t => setZoneFormData({...zoneFormData, name: t})} 
              className="border border-gray-300 rounded-lg px-4 py-3 mb-6 font-lexend text-gray-900" 
              placeholder="VD: Tầng 1, Sân vườn..."
            />
            
            <View className="flex-row justify-end items-center border-t border-gray-100 pt-4">
              <TouchableOpacity onPress={() => setShowZoneModal(false)} className="px-4 py-3 mr-2">
                <Text className="font-lexend font-medium text-gray-500">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddZone} disabled={isSaving} className="px-6 py-3 bg-orange-600 rounded-lg">
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="font-lexend font-bold text-white">Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Apply Template Modal */}
      <Modal visible={showTemplateModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-lexend font-bold text-xl text-gray-900">Sơ đồ mẫu (Admin tạo)</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)} className="p-2">
                <FontAwesome name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text className="font-lexend text-sm text-gray-500 mb-4 leading-5">
              Chọn một mẫu có sẵn để áp dụng cho khu vực <Text className="font-bold text-orange-600">{activeZone?.name}</Text>. 
              Lưu ý: Sơ đồ mới sẽ thay thế toàn bộ thiết lập bàn hiện tại trong khu vực này.
            </Text>

            <ScrollView className="flex-1">
              {templates.length === 0 ? (
                <Text className="font-lexend text-center text-gray-500 mt-10">Chưa có sơ đồ mẫu nào được tạo.</Text>
              ) : (
                templates.map(tpl => (
                  <TouchableOpacity 
                    key={tpl._id}
                    onPress={() => {
                      Alert.alert('Xác nhận', `Bạn chắc chắn muốn áp dụng mẫu "${tpl.name}" cho khu vực này?`, [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Áp dụng', style: 'destructive', onPress: () => handleApplyTemplate(tpl._id) }
                      ]);
                    }}
                    className="flex-row items-center p-4 bg-gray-50 rounded-xl border border-gray-200 mb-3"
                  >
                    <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center mr-4">
                      <FontAwesome name="map" size={20} color="#2563eb" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-lexend font-bold text-gray-900 text-base">{tpl.name}</Text>
                      <Text className="font-lexend text-sm text-gray-500">{tpl.description || 'Không có mô tả'}</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
