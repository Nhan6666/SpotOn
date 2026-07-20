import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '@/lib/http';
import { Colors } from '@/constants/Colors';
import { Branch } from '@/types/branch.types';
import { BranchFormModal } from './components/BranchFormModal';

export function AdminBranchesFeature() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFormVisible, setFormVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await apiClient.get('/branches');
      if (res.data?.success) {
        setBranches(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách chi nhánh');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBranches();
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      const newStatus = branch.status === 'OPEN' || branch.status === 'FULL' ? 'CLOSED' : 'OPEN';
      const res = await apiClient.put(`/branches/${branch._id}`, { status: newStatus });
      if (res.data?.success) {
        Alert.alert('Thành công', newStatus === 'OPEN' ? 'Đã mở cửa chi nhánh' : 'Đã đóng cửa chi nhánh');
        fetchBranches();
      }
    } catch (error) {
      console.error('Failed to toggle branch status:', error);
      Alert.alert('Lỗi', 'Không thể đổi trạng thái chi nhánh');
    }
  };

  const handleDelete = (branch: Branch) => {
    Alert.alert(
      "Xóa chi nhánh",
      `Bạn có chắc muốn xóa chi nhánh "${branch.name}" không? Thao tác này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/branches/${branch._id}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa chi nhánh');
                fetchBranches();
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa chi nhánh');
            }
          }
        }
      ]
    );
  };

  const openCreateForm = () => {
    setSelectedBranch(null);
    setFormVisible(true);
  };

  const openEditForm = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormVisible(true);
  };

  const renderBranchItem = ({ item }: { item: Branch }) => {
    const defaultImage = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image';
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : (item.image || defaultImage);
    
    // address parser
    let addressStr = '';
    if (typeof item.address === 'object' && item.address) {
      addressStr = `${item.address.district || ''}, ${item.address.city || ''}`;
    } else {
      addressStr = item.address as string;
    }

    const isClosed = item.status === 'CLOSED';

    return (
      <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        {/* Banner / Header */}
        <View className="flex-row items-center border-b border-gray-50 p-3 bg-gray-50/50">
          <Text className="font-lexend font-bold text-gray-800 flex-1" numberOfLines={1}>{item.name}</Text>
          <View className={`px-2 py-1 rounded-full flex-row items-center ${isClosed ? 'bg-gray-200' : 'bg-amber-100'}`}>
            <View className={`w-2 h-2 rounded-full mr-1.5 ${isClosed ? 'bg-gray-500' : 'bg-amber-600'}`} />
            <Text className={`font-lexend font-bold text-[10px] ${isClosed ? 'text-gray-600' : 'text-amber-700'}`}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-3 flex-row gap-3">
          <Image 
            source={{ uri: imageUrl }} 
            className="w-20 h-20 rounded-md bg-gray-100" 
          />
          <View className="flex-1 justify-center gap-1">
            <View className="flex-row items-center">
              <FontAwesome name="map-marker" size={14} color={Colors.muted} style={{ width: 16 }} />
              <Text className="font-lexend text-gray-500 text-xs flex-1" numberOfLines={1}>{addressStr}</Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="user" size={14} color={Colors.muted} style={{ width: 16 }} />
              <Text className="font-lexend text-gray-500 text-xs flex-1" numberOfLines={1}>
                {item.manager_id && (item.manager_id as any).full_name ? (item.manager_id as any).full_name : 'Chưa có quản lý'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="phone" size={14} color={Colors.muted} style={{ width: 16 }} />
              <Text className="font-lexend text-gray-500 text-xs flex-1" numberOfLines={1}>{item.hotline || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row border-t border-gray-50">
          <TouchableOpacity 
            className="flex-1 py-3 items-center justify-center border-r border-gray-50 flex-row gap-2"
            onPress={() => handleToggleStatus(item)}
          >
            <FontAwesome name={isClosed ? "play" : "pause"} size={14} color={isClosed ? Colors.primary : Colors.muted} />
            <Text className={`font-lexend text-sm ${isClosed ? 'text-primary font-bold' : 'text-gray-500'}`}>
              {isClosed ? 'Mở cửa' : 'Tạm đóng'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-3 items-center justify-center border-r border-gray-50 flex-row gap-2"
            onPress={() => openEditForm(item)}
          >
            <FontAwesome name="edit" size={14} color={Colors.text} />
            <Text className="font-lexend text-sm text-gray-700">Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-3 items-center justify-center flex-row gap-2"
            onPress={() => handleDelete(item)}
          >
            <FontAwesome name="trash" size={14} color="#ef4444" />
            <Text className="font-lexend text-sm text-red-500">Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={branches}
        keyExtractor={(item) => item._id}
        renderItem={renderBranchItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View className="py-10 items-center justify-center">
            <FontAwesome name="building-o" size={48} color="#e5e7eb" className="mb-4" />
            <Text className="font-lexend text-gray-400 text-center">Chưa có chi nhánh nào.</Text>
          </View>
        }
      />

      {/* FAB to Add Branch */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 w-14 h-14 bg-amber-600 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 4 }}
        onPress={openCreateForm}
      >
        <FontAwesome name="plus" size={20} color="#fff" />
      </TouchableOpacity>

      <BranchFormModal 
        visible={isFormVisible}
        branch={selectedBranch}
        onClose={() => setFormVisible(false)}
        onSuccess={() => {
          setFormVisible(false);
          fetchBranches();
        }}
      />
    </View>
  );
}
