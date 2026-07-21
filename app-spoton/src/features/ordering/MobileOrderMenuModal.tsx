import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, ScrollView, Dimensions, StyleSheet
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';

interface MobileOrderMenuModalProps {
  visible: boolean;
  booking: any;
  branchId: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  status: string;
  quantity: number;
}

interface CartItem extends MenuItem {
  cartQuantity: number;
}

export function MobileOrderMenuModal({ visible, booking, branchId, onClose, onSubmitSuccess }: MobileOrderMenuModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  const existingOrders = booking?.order_items || [];
  const depositPaid = booking?.total_deposit_paid || 0;
  const existingFoodTotal = existingOrders.reduce((sum: number, item: any) => sum + ((item.price_at_time || item.price || 0) * item.quantity), 0);

  useEffect(() => {
    if (!visible) return;
    
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/menus/public/branch/${branchId}`);
        const fetchedData = res.data?.data || [];
        
        let allItems: MenuItem[] = [];
        let cats: string[] = [];

        fetchedData.forEach((catObj: any) => {
          cats.push(catObj.name);
          (catObj.items || []).forEach((item: any) => {
            if (item.is_available !== false) {
              allItems.push({
                _id: item._id,
                name: item.name,
                price: item.price || 0,
                image: item.image || '',
                category: catObj.name,
                status: 'AVAILABLE',
                quantity: item.quantity !== undefined ? item.quantity : -1
              });
            }
          });
        });

        setMenuItems(allItems);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);
      } catch (err: any) {
        console.error('Menu Fetch Error:', err);
        Alert.alert('Lỗi', 'Không thể tải Menu.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMenu();
  }, [visible, branchId]);

  const addToCart = (item: MenuItem) => {
    if (item.quantity === 0) return;

    setCart(prev => {
      const existingInPrev = prev.find(i => i._id === item._id);
      if (existingInPrev) {
        if (item.quantity !== -1 && existingInPrev.cartQuantity >= item.quantity) {
          Alert.alert('Hết hàng', `Món này chỉ còn ${item.quantity} phần trong kho.`);
          return prev;
        }
        return prev.map(i => i._id === item._id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, { ...item, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const menuItem = menuItems.find(i => i._id === itemId);
    const cartItem = cart.find(i => i._id === itemId);
    
    if (cartItem) {
      const newQ = cartItem.cartQuantity + delta;
      if (delta > 0 && menuItem && menuItem.quantity !== -1 && newQ > menuItem.quantity) {
        Alert.alert('Hết hàng', `Kho chỉ còn ${menuItem.quantity} phần.`);
        return;
      }
    }

    setCart(prev => prev.map(i => {
      if (i._id === itemId) {
        const newQ = i.cartQuantity + delta;
        return newQ > 0 ? { ...i, cartQuantity: newQ } : i;
      }
      return i;
    }).filter(i => i.cartQuantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const remainingBill = Math.max(0, existingFoodTotal + totalAmount - depositPaid);
  const totalCartItems = cart.reduce((s, i) => s + i.cartQuantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const orderPayload = cart.map(item => ({
        menu_item_id: item._id,
        name: item.name,
        quantity: item.cartQuantity,
        price: item.price
      }));

      const res = await apiClient.post(`/orders/${booking._id}/items`, {
        items: orderPayload
      });
      
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã gửi order xuống bếp!');
        setCart([]);
        setShowCartModal(false);
        onSubmitSuccess();
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || "Lỗi khi gọi món.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // RENDER HELPERS
  const renderItem = ({ item }: { item: MenuItem }) => {
    const inCart = cart.find(c => c._id === item._id)?.cartQuantity || 0;
    const isOutOfStock = item.quantity === 0;

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
            style={styles.image} 
            resizeMode="cover"
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          {item.quantity !== -1 && (
            <Text style={[styles.stockText, isOutOfStock && styles.stockTextOut]}>
              {isOutOfStock ? 'Hết hàng' : `Kho: ${Math.max(0, item.quantity - inCart)}`}
            </Text>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{item.price.toLocaleString('vi-VN')}đ</Text>
            
            {isOutOfStock ? (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockBadgeText}>Đã hết</Text>
              </View>
            ) : inCart > 0 ? (
              <View style={styles.qtyControlRow}>
                <TouchableOpacity onPress={() => updateQuantity(item._id, -1)} style={styles.qtyBtn}>
                  <FontAwesome name="minus" size={10} color="#1d4ed8" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{inCart}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item._id, 1)} style={styles.qtyBtn}>
                  <FontAwesome name="plus" size={10} color="#1d4ed8" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => addToCart(item)} style={styles.addBtn}>
                <FontAwesome name="plus" size={12} color="#1d4ed8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Gọi Món (Bàn {booking?.assigned_tables?.map((t: any) => t.table_number).join(', ') || 'N/A'})</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => setActiveCategory(cat)}
                style={[styles.catTab, activeCategory === cat && styles.catTabActive]}
              >
                <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Menu Items Grid */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={menuItems.filter(i => i.category === activeCategory)}
              keyExtractor={item => item._id}
              numColumns={2}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
            />
          )}
        </View>

        {/* Fixed Footer (Mini Cart) */}
        {(totalCartItems > 0 || existingOrders.length > 0) && (
          <TouchableOpacity style={styles.footer} onPress={() => setShowCartModal(true)}>
            <View style={styles.footerInner}>
              <View style={styles.footerIconWrap}>
                <FontAwesome name="shopping-cart" size={20} color="white" />
                {totalCartItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalCartItems}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.footerTotalText}>Tổng tiền: {totalAmount.toLocaleString('vi-VN')}đ</Text>
                {existingOrders.length > 0 && (
                  <Text style={styles.footerSubText}>+ {existingOrders.length} món đã đặt online</Text>
                )}
              </View>
              <View style={styles.footerAction}>
                <Text style={styles.footerActionText}>Chi tiết</Text>
                <FontAwesome name="chevron-up" size={12} color="white" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Bottom Sheet / Full Modal */}
      <Modal visible={showCartModal} animationType="slide" transparent={true}>
        <View style={styles.cartModalOverlay}>
          <View style={styles.cartModalContent}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartHeaderTitle}>Chi Tiết Giỏ Hàng</Text>
              <TouchableOpacity onPress={() => setShowCartModal(false)} style={styles.closeButton}>
                <FontAwesome name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
              {/* MÓN ĐANG CHỌN */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>MÓN ĐANG CHỌN</Text>
                {cart.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa chọn món nào</Text>
                ) : (
                  cart.map(item => (
                    <View key={item._id} style={styles.cartItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                      </View>
                      <View style={styles.qtyControlRowLg}>
                        <TouchableOpacity onPress={() => updateQuantity(item._id, -1)} style={styles.qtyBtnLg}>
                          <FontAwesome name="minus" size={12} color="#4b5563" />
                        </TouchableOpacity>
                        <Text style={styles.qtyTextLg}>{item.cartQuantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item._id, 1)} style={styles.qtyBtnLg}>
                          <FontAwesome name="plus" size={12} color="#4b5563" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => updateQuantity(item._id, -item.cartQuantity)} style={styles.deleteBtn}>
                        <FontAwesome name="trash" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* MÓN ĐÃ GỌI */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>MÓN ĐÃ GỌI TỪ TRƯỚC</Text>
                {existingOrders.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có món nào đã gọi</Text>
                ) : (
                  existingOrders.map((eo: any, idx: number) => {
                    let statusColor = '#3b82f6';
                    let statusBg = '#eff6ff';
                    let statusText = 'Đang xử lý';
                    
                    if (eo.prep_status === 'READY') { statusColor = '#059669'; statusBg = '#ecfdf5'; statusText = 'Đã xong'; }
                    if (eo.prep_status === 'PREPARING') { statusColor = '#2563eb'; statusBg = '#eff6ff'; statusText = 'Đang nấu'; }
                    if (eo.prep_status === 'SERVED') { statusColor = '#6b7280'; statusBg = '#f3f4f6'; statusText = 'Đã lên món'; }
                    if (eo.prep_status === 'CANCELLED') { statusColor = '#ef4444'; statusBg = '#fef2f2'; statusText = 'Đã hủy'; }

                    return (
                      <View key={idx} style={[styles.existingItemRow, eo.prep_status === 'SERVED' && { opacity: 0.6 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cartItemName, eo.prep_status === 'SERVED' && { textDecorationLine: 'line-through' }]}>
                            {eo.name}
                          </Text>
                          <Text style={styles.cartItemPrice}>{(eo.price_at_time || eo.price || 0).toLocaleString('vi-VN')}đ</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.existingQty}>x{eo.quantity}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* TỔNG KẾT */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tiền món đang chọn:</Text>
                  <Text style={styles.summaryValue}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tiền món đã gọi:</Text>
                  <Text style={styles.summaryValue}>{existingFoodTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Đã cọc online:</Text>
                  <Text style={styles.summaryValue}>- {depositPaid.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }]}>
                  <Text style={styles.summaryLabelTotal}>Ước tính cần thanh toán:</Text>
                  <Text style={styles.summaryValueTotal}>{remainingBill.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.cartFooterFixed}>
              <TouchableOpacity 
                style={[styles.submitButton, cart.length === 0 && { opacity: 0.5 }]} 
                onPress={handleSubmit}
                disabled={cart.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FontAwesome name="send" size={16} color="white" />
                    <Text style={styles.submitButtonText}>GỬI {cart.reduce((s,i)=>s+i.cartQuantity,0)} MÓN XUỐNG BẾP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 36) / 2; // 2 columns, padding 12*2, gap 12

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontFamily: 'lexend-bold', fontSize: 18, color: '#111827' },
  closeButton: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  
  categoriesContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 12 },
  catTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  catTabActive: { backgroundColor: '#2563eb' },
  catText: { fontFamily: 'lexend-medium', color: '#4b5563', fontSize: 13 },
  catTextActive: { color: '#ffffff' },

  listContainer: { flex: 1 },
  
  card: { width: cardWidth, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, overflow: 'hidden' },
  imageContainer: { width: '100%', height: 120, backgroundColor: '#f3f4f6' },
  image: { width: '100%', height: '100%' },
  cardContent: { padding: 10 },
  itemName: { fontFamily: 'lexend-bold', fontSize: 13, color: '#111827', height: 38 },
  stockText: { fontFamily: 'lexend-medium', fontSize: 10, color: '#d97706', marginTop: 4 },
  stockTextOut: { color: '#ef4444' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  priceText: { fontFamily: 'lexend-bold', fontSize: 13, color: '#2563eb' },
  addBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  outOfStockBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  outOfStockBadgeText: { fontFamily: 'lexend-bold', fontSize: 10, color: '#9ca3af' },
  
  qtyControlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2 },
  qtyBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  qtyText: { fontFamily: 'lexend-bold', fontSize: 12, color: '#1e3a8a', width: 20, textAlign: 'center' },

  footer: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#1e3a8a', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
  footerInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  footerIconWrap: { position: 'relative' },
  badge: { position: 'absolute', top: -8, right: -10, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1e3a8a' },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'lexend-bold' },
  footerTotalText: { color: '#fff', fontFamily: 'lexend-bold', fontSize: 16 },
  footerSubText: { color: '#93c5fd', fontFamily: 'lexend-medium', fontSize: 12, marginTop: 2 },
  footerAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  footerActionText: { color: '#fff', fontFamily: 'lexend-bold', fontSize: 12 },

  cartModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  cartModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cartHeaderTitle: { fontFamily: 'lexend-bold', fontSize: 18, color: '#111827' },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'lexend-bold', fontSize: 12, color: '#6b7280', letterSpacing: 1, marginBottom: 12 },
  emptyText: { fontFamily: 'lexend', fontSize: 14, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  
  cartItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 8 },
  cartItemName: { fontFamily: 'lexend-bold', fontSize: 14, color: '#111827', marginBottom: 4 },
  cartItemPrice: { fontFamily: 'lexend-bold', fontSize: 14, color: '#2563eb' },
  qtyControlRowLg: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 4, marginRight: 12 },
  qtyBtnLg: { paddingHorizontal: 10, paddingVertical: 8 },
  qtyTextLg: { fontFamily: 'lexend-bold', fontSize: 14, color: '#111827', width: 24, textAlign: 'center' },
  deleteBtn: { padding: 10 },
  
  existingItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 8 },
  existingQty: { fontFamily: 'lexend-bold', fontSize: 14, color: '#4b5563', marginBottom: 4, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontFamily: 'lexend-bold', fontSize: 10, textTransform: 'uppercase' },

  summaryBox: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontFamily: 'lexend-medium', fontSize: 13, color: '#4b5563' },
  summaryValue: { fontFamily: 'lexend-medium', fontSize: 13, color: '#111827' },
  summaryLabelTotal: { fontFamily: 'lexend-bold', fontSize: 15, color: '#111827' },
  summaryValueTotal: { fontFamily: 'lexend-bold', fontSize: 18, color: '#ef4444' },

  cartFooterFixed: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  submitButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { fontFamily: 'lexend-bold', fontSize: 14, color: '#fff', marginLeft: 8 }
});
