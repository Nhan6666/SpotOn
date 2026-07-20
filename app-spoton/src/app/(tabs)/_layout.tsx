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

      {/* ===== MANAGER/ADMIN: Quản lý ===== */}
      <Tabs.Screen
        name="branch-manage"
        options={{
          title: 'Quản lý',
          tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color as string} />,
          href: isManager ? '/branch-manage' : null,
        }}
      />

      {/* ===== MANAGER/ADMIN: Check-in (Kanban) ===== */}
      <Tabs.Screen
        name="kanban"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ color }) => <TabBarIcon name="columns" color={color as string} />,
          href: isManager ? '/kanban' : null,
        }}
      />

      {/* ===== MANAGER/ADMIN: Sơ đồ bàn ===== */}
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Sơ đồ bàn',
          tabBarIcon: ({ color }) => <TabBarIcon name="th" color={color as string} />,
          href: isManager ? '/tables' : null,
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

      {/* ===== KITCHEN: Bếp ===== */}
      <Tabs.Screen
        name="kds"
        options={{
          title: 'Bếp',
          tabBarIcon: ({ color }) => <TabBarIcon name="fire" color={color as string} />,
          href: isKitchen ? '/kds' : null,
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
