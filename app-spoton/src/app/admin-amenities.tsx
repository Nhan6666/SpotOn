import { AdminAmenitiesFeature } from '@/features/admin/AdminAmenitiesFeature';
import { Stack } from 'expo-router';

export default function AdminAmenitiesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Tiện ích Nhà hàng', headerShown: true }} />
      <AdminAmenitiesFeature />
    </>
  );
}
