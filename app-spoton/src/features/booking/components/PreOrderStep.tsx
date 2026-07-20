import { View, Text, TouchableOpacity, FlatList } from 'react-native';

interface PreOrderStepProps {
  state: any;
  actions: any;
}

export function PreOrderStep({ state, actions }: PreOrderStepProps) {
  const { canPreOrder, allMenuItems, cart } = state;
  const { handleAddToCart, getPreOrderTotal } = actions;

  return (
    <View className="flex-1 p-4">
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1">
        <Text className="font-lexend font-bold text-lg mb-1">Đặt trước món ăn</Text>
        
        {!canPreOrder ? (
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-4xl mb-4">⏰</Text>
            <Text className="font-lexend font-bold text-lg text-text mb-2">Không thể đặt món trước</Text>
            <Text className="font-lexend text-muted text-center leading-6">
              Giờ đặt bàn của bạn cách hiện tại chưa đến 2 tiếng. {"\n"}
              Quý khách vui lòng gọi món trực tiếp tại nhà hàng nhé!
            </Text>
          </View>
        ) : (
          <>
            <Text className="font-lexend text-muted text-xs mb-3">Không bắt buộc — bạn có thể gọi món tại nhà hàng</Text>
            <FlatList
              data={allMenuItems}
              keyExtractor={(item: any) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({item}: {item: any}) => {
                const cartItem = cart.find((i: any) => i.item._id === item._id);
                const qty = cartItem ? cartItem.quantity : 0;
                return (
                  <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                    <View className="flex-1 mr-2">
                      <Text className="font-lexend font-semibold text-text">{item.name}</Text>
                      <Text className="font-lexend text-primary text-sm">{item.price?.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity onPress={() => handleAddToCart(item, -1)} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                        <Text className="font-lexend font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="font-lexend font-bold mx-2 w-4 text-center">{qty}</Text>
                      <TouchableOpacity onPress={() => handleAddToCart(item, 1)} className="w-8 h-8 bg-amber-700 rounded-full items-center justify-center">
                        <Text className="font-lexend font-bold text-white">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text className="font-lexend text-muted text-center py-4">Chưa có món trong thực đơn</Text>}
            />
            {cart.length > 0 && (
              <View className="pt-4 border-t border-gray-100">
                <View className="flex-row justify-between">
                  <Text className="font-lexend font-bold text-text">Tổng đặt trước:</Text>
                  <Text className="font-lexend font-bold text-primary">{getPreOrderTotal().toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
