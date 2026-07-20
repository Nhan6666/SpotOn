import { AdminReviewsFeature } from '@/features/admin/AdminReviewsFeature';
import { Stack } from 'expo-router';

export default function AdminReviewsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Quản lý Đánh giá', headerShown: true }} />
      <AdminReviewsFeature />
    </>
  );
}
