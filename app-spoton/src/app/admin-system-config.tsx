import { AdminSystemConfigFeature } from '@/features/admin/AdminSystemConfigFeature';
import { Stack } from 'expo-router';

export default function AdminSystemConfigScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Chính sách Đặt bàn', headerShown: true }} />
      <AdminSystemConfigFeature />
    </>
  );
}
