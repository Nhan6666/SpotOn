import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { CustomerService } from '@/features/customer/customer.service';
import { useAuthStore } from '@/stores/useAuthStore';

interface BranchDetailProps {
  id: string;
}

export function BranchDetailFeature({ id }: BranchDetailProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [branch, setBranch] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MENU' | 'VOUCHERS' | 'REVIEWS'>('OVERVIEW');

  useEffect(() => {
    fetchBranchData();
  }, [id]);

  const fetchBranchData = async () => {
    try {
      const [branchRes, menuRes, reviewsRes, vouchersRes] = await Promise.all([
        CustomerService.getBranchById(id),
        CustomerService.getPublicMenu(id).catch(() => ({ success: false, data: [] })),
        CustomerService.getBranchReviews(id).catch(() => ({ success: false, data: [] })),
        CustomerService.getPublicVouchers().catch(() => ({ success: false, data: [] }))
      ]);

      if (branchRes.success) setBranch(branchRes.data);
      if (menuRes.success) setMenu(menuRes.data || []);
      if (reviewsRes.success) setReviews(reviewsRes.data || []);
      if (vouchersRes.success) setVouchers(vouchersRes.data || []);
    } catch (error) {
      console.log('Error fetching branch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  if (!branch) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="font-lexend text-muted">Không tìm thấy chi nhánh</Text>
      </View>
    );
  }

  const addressText = typeof branch.address === 'object'
    ? branch.address?.full || `${branch.address?.street || ''}, ${branch.address?.district || ''}, ${branch.address?.city || ''}`
    : branch.address || '';

  const renderOverview = () => (
    <View className="p-4">
      {branch.description && (
        <View className="bg-white rounded-md p-4 shadow-sm border border-gray-100 mb-4">
          <Text className="font-lexend font-bold text-lg mb-2">Về chi nhánh</Text>
          <Text className="font-lexend text-gray-600">{branch.description}</Text>
        </View>
      )}

      {/* Amenities */}
      {branch.amenities && branch.amenities.length > 0 && (
        <View className="bg-white rounded-md p-4 shadow-sm border border-gray-100 mb-4">
          <Text className="font-lexend font-bold text-lg mb-3">Tiện ích nổi bật</Text>
          <View className="flex-row flex-wrap gap-2">
            {branch.amenities.map((amenity: any, idx: number) => (
              <View key={amenity._id || idx} className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 flex-row items-center gap-2">
                <FontAwesome name={(amenity.icon as any) || 'star'} size={12} color="#ea580c" />
                <Text className="font-lexend text-xs text-orange-800 font-medium">{amenity.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Contact & Hours */}
      <View className="bg-orange-50 rounded-md p-4 border border-orange-100 mb-4">
        <Text className="font-lexend font-bold text-lg mb-3">Liên hệ & Giờ mở cửa</Text>
        
        <View className="flex-row items-start mb-3">
          <FontAwesome name="map-marker" size={16} color="#ea580c" className="mt-1 mr-3" style={{ width: 16 }} />
          <View className="flex-1 ml-2">
            <Text className="font-lexend font-semibold text-text">Địa chỉ</Text>
            <Text className="font-lexend text-gray-600">{addressText}</Text>
          </View>
        </View>

        <View className="flex-row items-start mb-3">
          <FontAwesome name="phone" size={16} color="#ea580c" className="mt-1 mr-3" style={{ width: 16 }} />
          <View className="flex-1 ml-2">
            <Text className="font-lexend font-semibold text-text">Hotline</Text>
            <Text className="font-lexend text-gray-600">{branch.hotline || 'N/A'}</Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <FontAwesome name="clock-o" size={16} color="#ea580c" className="mt-1 mr-3" style={{ width: 16 }} />
          <View className="flex-1 ml-2">
            <Text className="font-lexend font-semibold text-text mb-2">Giờ phục vụ</Text>
            <View className="bg-white rounded p-2 mb-2 border border-orange-100">
              <Text className="font-lexend font-bold text-primary text-xs uppercase mb-1">TRƯA</Text>
              <Text className="font-lexend text-gray-700">{branch.service_periods?.lunch?.start || '08:00'} - {branch.service_periods?.lunch?.end || '13:00'}</Text>
            </View>
            <View className="bg-white rounded p-2 border border-orange-100">
              <Text className="font-lexend font-bold text-primary text-xs uppercase mb-1">TỐI</Text>
              <Text className="font-lexend text-gray-700">{branch.service_periods?.dinner?.start || '15:00'} - {branch.service_periods?.dinner?.end || '23:00'}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMenu = () => (
    <View className="p-4">
      {menu.length === 0 ? (
        <Text className="font-lexend text-muted text-center py-4">Chưa có thực đơn</Text>
      ) : (
        menu.map((category: any, idx: number) => (
          <View key={category._id || idx} className="mb-4">
            <Text className="font-lexend font-bold text-lg text-primary mb-2">
              {category.category || category.name || 'Category'}
            </Text>
            {(category.items || []).map((item: any, itemIdx: number) => (
              <View key={item._id || itemIdx} className="flex-row justify-between items-center bg-white rounded-md p-3 mb-2 border border-gray-100 shadow-sm">
                <View className="flex-1 pr-3">
                  <Text className="font-lexend font-semibold text-text">{item.name}</Text>
                  {item.description && (
                    <Text className="font-lexend text-muted text-xs mt-1" numberOfLines={2}>{item.description}</Text>
                  )}
                </View>
                <Text className="font-lexend font-bold text-primary">
                  {item.price?.toLocaleString() || '0'}đ
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  );

  const renderVouchers = () => (
    <View className="p-4">
      {vouchers.length === 0 ? (
        <Text className="font-lexend text-muted text-center py-4">Chưa có ưu đãi nào</Text>
      ) : (
        vouchers.map((v: any, idx: number) => (
          <View key={v._id || idx} className="flex-row items-center bg-white rounded-xl p-3 mb-3 border border-orange-100 shadow-sm">
            <View className="w-12 h-12 bg-orange-50 rounded-full items-center justify-center mr-3">
              <FontAwesome name="ticket" size={24} color="#ea580c" />
            </View>
            <View className="flex-1">
              <Text className="font-lexend font-bold text-primary text-base">{v.code}</Text>
              <Text className="font-lexend text-gray-600 text-xs mt-1">Giảm {v.discount_percentage}% {v.max_discount_amount ? `tối đa ${v.max_discount_amount.toLocaleString()}đ` : ''}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderReviews = () => (
    <View className="p-4">
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 items-center">
        <Text className="font-lexend font-bold text-4xl text-primary mb-1">
          {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1) : '5.0'}
        </Text>
        <View className="flex-row mb-2">
          {[1,2,3,4,5].map(i => <FontAwesome key={i} name="star" size={16} color="#fbbf24" className="mx-0.5" />)}
        </View>
        <Text className="font-lexend text-gray-500 text-xs">{reviews.length} đánh giá</Text>
      </View>

      {reviews.length === 0 ? (
        <Text className="font-lexend text-muted text-center py-4">Chưa có đánh giá nào</Text>
      ) : (
        reviews.map((r: any, idx: number) => (
          <View key={r._id || idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-lexend font-bold text-text">{r.user_id?.full_name || 'Khách hàng'}</Text>
              <Text className="font-lexend text-xs text-gray-400">
                {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}
              </Text>
            </View>
            <View className="flex-row mb-2">
              {[...Array(5)].map((_, i) => (
                <FontAwesome key={i} name={i < (r.rating || 5) ? "star" : "star-o"} size={12} color="#fbbf24" className="mr-1" />
              ))}
            </View>
            <Text className="font-lexend text-gray-600">{r.comment || 'Không có bình luận'}</Text>
          </View>
        ))
      )}
    </View>
  );

  const tabs = [
    { key: 'OVERVIEW', label: 'TỔNG QUAN' },
    { key: 'MENU', label: 'THỰC ĐƠN' },
    { key: 'VOUCHERS', label: 'ƯU ĐÃI' },
    { key: 'REVIEWS', label: 'ĐÁNH GIÁ' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" stickyHeaderIndices={[2]}>
        {/* 0. Banner */}
        <View className="relative">
          <Image 
            source={{ uri: branch.images?.[0] || 'https://via.placeholder.com/800x400?text=SpotOn' }}
            className="w-full h-56 bg-gray-200"
          />
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="absolute top-10 left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm"
          >
            <Text className="text-text text-xl">←</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Title */}
        <View className="p-4 bg-white">
          <Text className="font-lexend font-bold text-2xl text-text mb-1">{branch.name}</Text>
          <View className="flex-row items-center mb-2">
            <FontAwesome name="map-marker" size={14} color="#9ca3af" className="mr-2" />
            <Text className="font-lexend text-muted text-sm flex-1">{addressText}</Text>
          </View>
          <View className="flex-row items-center">
            <View className={`px-2 py-1 rounded ${branch.status === 'OPEN' ? 'bg-green-100' : branch.status === 'FULL' ? 'bg-orange-100' : 'bg-red-100'}`}>
              <Text className={`font-lexend font-bold text-xs ${branch.status === 'OPEN' ? 'text-green-700' : branch.status === 'FULL' ? 'text-orange-700' : 'text-red-700'}`}>
                {branch.status === 'OPEN' ? 'ĐANG MỞ' : branch.status === 'FULL' ? 'ĐẦY CHỖ' : 'ĐÓNG CỬA'}
              </Text>
            </View>
            <View className="flex-row items-center ml-3">
              <FontAwesome name="star" size={14} color="#fbbf24" className="mr-1" />
              <Text className="font-lexend font-bold text-sm">
                {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1) : '5.0'}
              </Text>
              <Text className="font-lexend text-muted text-xs ml-1">({reviews.length})</Text>
            </View>
          </View>
        </View>

        {/* 2. Tab Bar (Sticky) */}
        <View className="bg-white border-b border-gray-100 border-t shadow-sm z-10">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  className={`py-3.5 px-4 border-b-2 mr-2 ${isActive ? 'border-primary' : 'border-transparent'}`}
                >
                  <Text className={`font-lexend text-sm font-semibold ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* 3. Content */}
        <View>
          {activeTab === 'OVERVIEW' && renderOverview()}
          {activeTab === 'MENU' && renderMenu()}
          {activeTab === 'VOUCHERS' && renderVouchers()}
          {activeTab === 'REVIEWS' && renderReviews()}
        </View>

        {/* 4. Bottom padding for sticky button */}
        <View className="h-24" /> 
      </ScrollView>

      {/* Sticky Bottom Booking Button */}
      {branch.status !== 'CLOSED' && user?.role !== 'ADMIN' && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          {branch.status === 'FULL' && (
            <Text className="font-lexend text-orange-600 text-xs text-center mb-2">Chi nhánh đã đầy, vui lòng liên hệ hotline để được hỗ trợ.</Text>
          )}
          <Button 
            title={branch.status === 'FULL' ? 'Liên hệ Hotline' : 'Đặt bàn ngay'}
            onPress={() => {
              if (branch.status === 'FULL') {
                Alert.alert('Liên hệ', `Hotline: ${branch.hotline || 'Chưa cập nhật'}`);
                return;
              }
              if (!isAuthenticated) {
                Alert.alert('Đăng nhập', 'Bạn cần đăng nhập để đặt bàn.', [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') },
                ]);
              } else {
                router.push(`/booking/${id}`);
              }
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

