import { AdminCategoriesFeature } from '@/features/admin/AdminCategoriesFeature';
import { Stack } from 'expo-router';

export default function AdminCategoriesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Danh mục Thực đơn', headerShown: true }} />
      <AdminCategoriesFeature />
    </>
  );
}
