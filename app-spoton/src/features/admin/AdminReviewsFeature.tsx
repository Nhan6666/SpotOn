import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

interface Review {
  _id: string;
  rating: number;
  comment: string;
  is_deleted: boolean;
  created_at: string;
  user_id?: {
    full_name: string;
    email: string;
  };
  branch_id?: {
    name: string;
  };
}

export function AdminReviewsFeature() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reviews/admin');
      if (res.data?.success) {
        setReviews(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = (reviewId: string, isDeleted: boolean) => {
    if (isDeleted) {
      Alert.alert('Thông báo', 'Đánh giá này đã bị xóa trước đó.');
      return;
    }
    
    Alert.alert('Gỡ Đánh giá', 'Bạn có chắc chắn muốn gỡ đánh giá này khỏi hệ thống? Đánh giá sẽ không còn hiển thị với khách hàng.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gỡ bỏ', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/reviews/admin/${reviewId}`);
          Alert.alert('Thành công', 'Đã gỡ đánh giá');
          fetchReviews();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể gỡ đánh giá');
        }
      }}
    ]);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <FontAwesome 
        key={i} 
        name="star" 
        size={14} 
        color={i < rating ? "#eab308" : "#e5e7eb"} 
        style={{ marginRight: 2 }}
      />
    ));
  };

  const filtered = reviews.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.comment?.toLowerCase().includes(q) && 
          !r.user_id?.full_name?.toLowerCase().includes(q) &&
          !r.branch_id?.name?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-4 pt-5 pb-4 shadow-sm z-10 border-b border-gray-100">
        <Text className="font-lexend font-bold text-lg text-gray-900 mb-3">Tất cả Đánh giá</Text>
        
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <FontAwesome name="search" size={14} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo nội dung, tên khách..."
            className="flex-1 font-lexend ml-2 text-sm text-gray-900"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#ea580c" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className={`bg-white p-4 rounded-xl mb-3 border ${item.is_deleted ? 'border-red-200 bg-red-50' : 'border-gray-100'} shadow-sm`}>
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="font-lexend font-bold text-sm text-gray-900">
                    {item.user_id?.full_name || 'Khách hàng ẩn danh'}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    {renderStars(item.rating)}
                    <Text className="font-lexend text-xs text-gray-500 ml-2">
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>
                {item.is_deleted && (
                  <View className="bg-red-100 px-2 py-1 rounded">
                    <Text className="font-lexend font-bold text-[10px] text-red-600">ĐÃ GỠ</Text>
                  </View>
                )}
              </View>

              {item.branch_id && (
                <View className="flex-row items-center mb-2 bg-gray-50 p-1.5 rounded-lg self-start">
                  <FontAwesome name="map-marker" size={10} color="#6b7280" />
                  <Text className="font-lexend text-[10px] text-gray-600 ml-1">
                    {item.branch_id.name}
                  </Text>
                </View>
              )}

              <Text className={`font-lexend text-sm ${item.is_deleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {item.comment || '(Không có nội dung)'}
              </Text>

              {!item.is_deleted && (
                <View className="flex-row justify-end mt-3 border-t border-gray-50 pt-3">
                  <TouchableOpacity 
                    onPress={() => handleDelete(item._id, item.is_deleted)}
                    className="flex-row items-center px-3 py-1.5 bg-red-50 rounded-lg"
                  >
                    <FontAwesome name="ban" size={12} color="#dc2626" />
                    <Text className="font-lexend font-bold text-xs text-red-600 ml-1.5">Gỡ bỏ</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FontAwesome name="star-half-o" size={32} color="#d1d5db" />
              <Text className="font-lexend text-gray-500 mt-3">Chưa có đánh giá nào.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
