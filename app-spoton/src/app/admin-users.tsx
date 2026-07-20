import { AdminUsersFeature } from '@/features/admin/AdminUsersFeature';
import { Stack } from 'expo-router';

export default function AdminUsersScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Quản lý Tài khoản', headerShown: true }} />
      <AdminUsersFeature />
    </>
  );
}
