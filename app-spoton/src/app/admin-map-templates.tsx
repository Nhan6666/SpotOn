import { AdminMapTemplatesFeature } from '@/features/admin/AdminMapTemplatesFeature';
import { Stack } from 'expo-router';

export default function AdminMapTemplatesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Mẫu Sơ đồ bàn', headerShown: true }} />
      <AdminMapTemplatesFeature />
    </>
  );
}
