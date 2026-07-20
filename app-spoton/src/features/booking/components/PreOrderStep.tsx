import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, Image } from 'react-native';

interface PreOrderStepProps {
  state: any;
  actions: any;
}

export function PreOrderStep({ state, actions }: PreOrderStepProps) {
  const { canPreOrder, menuCategories, cart, holdTimeLeft } = state;
  const { handleAddToCart, getPreOrderTotal } = actions;
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);

  const m = Math.floor(holdTimeLeft / 60);
  const s = holdTimeLeft % 60;
  const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const currentCategory = menuCategories[selectedCategoryIdx];
  const itemsToDisplay = (currentCategory?.items || []).filter((item: any) => item.is_available !== false);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="px-4 pt-4">
        <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex-row justify-between items-center shadow-sm">
          <View className="flex-row items-center">
            <Text className="text-orange-500 mr-2 text-lg">⏱️</Text>
            <Text className="font-lexend text-orange-800 text-sm">Thời gian giữ bàn còn lại</Text>
          </View>
          <Text className="font-lexend font-bold text-orange-600 text-lg">{timeStr}</Text>
        </View>
      </View>

      <View className="bg-white flex-1 rounded-t-3xl shadow-sm border border-gray-100 overflow-hidden">
        <View className="p-4 pb-2 border-b border-gray-100">
          <Text className="font-lexend font-bold text-lg mb-1">Chọn món trước (Không bắt buộc)</Text>
          <Text className="font-lexend text-muted text-xs">Bạn có thể chọn món tại nhà hàng hoặc chọn trước tại đây.</Text>
        </View>

        {!canPreOrder ? (
          <View className="flex-1 justify-center items-center py-10 px-4">
            <Text className="text-5xl mb-4">⏰</Text>
            <Text className="font-lexend font-bold text-lg text-text mb-2 text-center">Không thể đặt món trước</Text>
            <Text className="font-lexend text-muted text-center leading-6">
              Giờ đặt bàn của bạn cách hiện tại chưa đến 2 tiếng.{"\n"}
              Quý khách vui lòng gọi món trực tiếp tại nhà hàng nhé!
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            {/* Category Tabs */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                {menuCategories.map((cat: any, idx: number) => (
                  <TouchableOpacity
                    key={cat._id || `cat-${idx}`}
                    onPress={() => setSelectedCategoryIdx(idx)}
                    className={`px-5 py-2.5 mr-3 rounded-full border ${selectedCategoryIdx === idx ? 'bg-amber-700 border-amber-700' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-lexend text-sm font-semibold ${selectedCategoryIdx === idx ? 'text-white' : 'text-gray-600'}`}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Menu Items List */}
            <FlatList
              data={itemsToDisplay}
              keyExtractor={(item: any) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              renderItem={({ item }) => {
                const cartItem = cart.find((i: any) => i.item._id === item._id);
                const qty = cartItem ? cartItem.quantity : 0;
                
                return (
                  <View className="flex-row bg-white border border-gray-100 rounded-2xl mb-4 shadow-sm overflow-hidden p-3">
                    <Image 
                      source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/150' }} 
                      className="w-24 h-24 rounded-xl bg-gray-100 mr-3"
                      resizeMode="cover"
                    />
                    <View className="flex-1 justify-between py-1">
                      <View>
                        <Text className="font-lexend font-bold text-text text-base" numberOfLines={2}>{item.name}</Text>
                        <Text className="font-lexend font-bold text-amber-600 mt-1">{item.price?.toLocaleString('vi-VN')}đ</Text>
                      </View>
                      
                      <View className="flex-row justify-between items-center mt-2">
                        {item.quantity !== undefined && item.quantity >= 0 ? (
                          <View className="bg-gray-100 px-2 py-1 rounded">
                            <Text className="font-lexend text-xs text-gray-600">Còn {item.quantity}</Text>
                          </View>
                        ) : <View />}

                        {qty === 0 ? (
                          <TouchableOpacity 
                            onPress={() => handleAddToCart(item, 1)}
                            className="bg-gray-100 px-4 py-1.5 rounded-full"
                          >
                            <Text className="font-lexend font-bold text-text text-sm">Thêm món</Text>
                          </TouchableOpacity>
                        ) : (
                          <View className="flex-row items-center">
                            <TouchableOpacity 
                              onPress={() => handleAddToCart(item, -1)} 
                              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                            >
                              <Text className="font-lexend font-bold text-text">-</Text>
                            </TouchableOpacity>
                            <Text className="font-lexend font-bold text-text mx-3 text-base">{qty}</Text>
                            <TouchableOpacity 
                              onPress={() => handleAddToCart(item, 1)} 
                              className="w-8 h-8 bg-amber-700 rounded-full items-center justify-center"
                            >
                              <Text className="font-lexend font-bold text-white">+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View className="py-10 items-center">
                  <Text className="font-lexend text-muted">Chưa có món trong danh mục này</Text>
                </View>
              }
            />

            {/* Cart Summary Header */}
            {cart.length > 0 && (
              <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex-row justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <View>
                  <Text className="font-lexend text-muted text-xs">Tổng đặt trước ({cart.reduce((s: number, i: any) => s + i.quantity, 0)} món)</Text>
                  <Text className="font-lexend font-bold text-amber-700 text-lg">{getPreOrderTotal().toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
