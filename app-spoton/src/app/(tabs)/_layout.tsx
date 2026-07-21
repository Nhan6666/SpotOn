import React, { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { ActivityIndicator, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { user, isAuthenticated, isLoading, hasChecked, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!hasChecked) {
      checkAuth();
    }
  }, [hasChecked]);

  if (isLoading || !hasChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf8f5' }}>
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  const role = user?.role;
  const isGuest = !isAuthenticated || !user;
  const isCustomer = role === 'CUSTOMER';
  const isWaiter = role === 'WAITER';
  const isManager = role === 'MANAGER' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const isKitchen = role === 'KITCHEN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#b45309',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#faf8f5',
        },
        headerTitleStyle: {
          fontFamily: 'Lexend_600SemiBold',
          color: '#1a1208',
        },
        tabBarLabelStyle: {
          fontFamily: 'Lexend_500Medium',
          fontSize: 11,
        },
      }}>
      
      {/* ===== ALL: Trang chủ ===== */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color as string} />,
          href: (isGuest || isCustomer) ? '/' : null,
        }}
      />

      {/* ===== GUEST & CUSTOMER: Chi nhánh ===== */}
      <Tabs.Screen
        name="branches"
        options={{
          title: 'Chi nhánh',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="map-marker" color={color as string} />,
          href: (isGuest || isCustomer) ? '/branches' : null,
        }}
      />

      {/* ===== CUSTOMER: Đặt bàn của tôi ===== */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Đặt bàn',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color as string} />,
          href: isCustomer ? '/bookings' : null,
        }}
      />

      {/* ===== ALL: Thực đơn ===== */}
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Thực đơn',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color as string} />,
          href: (isGuest || isCustomer) ? '/menu' : null,
        }}
      />

      {/* ===== WAITER: POS ===== */}
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color as string} />,
          href: isWaiter ? '/pos' : null,
        }}
      />

      {/* ===== WAITER: Lên món ===== */}
      <Tabs.Screen
        name="runner"
        options={{
          title: 'Lên món',
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color as string} />,
          href: isWaiter ? '/runner' : null,
        }}
      />

      {/* ===== ADMIN: Tổng quan ===== */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <TabBarIcon name="pie-chart" color={color as string} />,
          href: isAdmin ? '/admin-dashboard' : null,
        }}
      />

      {/* ===== MANAGER: Quản lý (Chi nhánh đơn lẻ) ===== */}
      <Tabs.Screen
        name="branch-manage"
        options={{
          title: 'Quản lý',
          tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color as string} />,
          href: (isManager && !isAdmin) ? '/branch-manage' : null,
        }}
      />

      {/* ===== ADMIN: CRUD Chi nhánh (Tất cả chi nhánh) ===== */}
      <Tabs.Screen
        name="admin-branches"
        options={{
          title: 'Chi nhánh',
          tabBarIcon: ({ color }) => <TabBarIcon name="building-o" color={color as string} />,
          href: isAdmin ? '/admin-branches' : null,
        }}
      />

      {/* ===== ADMIN: CRUD Thực đơn ===== */}
      <Tabs.Screen
        name="admin-menu"
        options={{
          title: 'Thực đơn',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color as string} />,
          href: isAdmin ? '/admin-menu' : null,
        }}
      />

      {/* ===== ADMIN: CRUD Khuyến mãi ===== */}
      <Tabs.Screen
        name="admin-vouchers"
        options={{
          title: 'Khuyến mãi',
          tabBarIcon: ({ color }) => <TabBarIcon name="ticket" color={color as string} />,
          href: isAdmin ? '/admin-vouchers' : null,
        }}
      />

      {/* ===== ADMIN: Tài chính ===== */}
      <Tabs.Screen
        name="admin-finance"
        options={{
          title: 'Tài chính',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color as string} />,
          href: isAdmin ? '/admin-finance' : null,
        }}
      />

      {/* ===== MANAGER: Check-in (Kanban) ===== */}
      <Tabs.Screen
        name="kanban"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ color }) => <TabBarIcon name="columns" color={color as string} />,
          href: (isManager && !isAdmin) ? '/kanban' : null,
        }}
      />

      {/* ===== MANAGER: Sơ đồ bàn ===== */}
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Sơ đồ bàn',
          tabBarIcon: ({ color }) => <TabBarIcon name="th" color={color as string} />,
          href: (isManager && !isAdmin) ? '/tables' : null,
        }}
      />

      {/* ===== MANAGER/ADMIN: Đơn hàng (HIDDEN) ===== */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          href: null,
        }}
      />

      {/* ===== KITCHEN: Bếp (KDS) ===== */}
      <Tabs.Screen
        name="kds"
        options={{
          title: 'Bếp',
          tabBarIcon: ({ color }) => <TabBarIcon name="fire" color={color as string} />,
          href: isKitchen ? '/kds' : null,
        }}
      />

      {/* ===== KITCHEN: Lịch sử ===== */}
      <Tabs.Screen
        name="kds-history"
        options={{
          title: 'Lịch sử',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color as string} />,
          href: isKitchen ? '/kds-history' : null,
        }}
      />

      {/* ===== ALL: Tài khoản ===== */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color as string} />,
          href: '/profile',
        }}
      />

      {/* ===== HIDDEN MANAGER TABS ===== */}
      <Tabs.Screen
        name="menu-manage"
        options={{ title: 'Thực đơn', href: null }}
      />
      <Tabs.Screen
        name="invoices"
        options={{ title: 'Đối soát hóa đơn', href: null }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Lịch sử giao dịch', href: null }}
      />
      <Tabs.Screen
        name="statistics"
        options={{ title: 'Thống kê', href: null }}
      />
      <Tabs.Screen
        name="promotions"
        options={{ title: 'Khuyến mãi', href: null }}
      />
    </Tabs>
  );
}
