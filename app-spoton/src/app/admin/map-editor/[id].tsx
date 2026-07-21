import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { AdminMapEditorFeature } from '@/features/admin/AdminMapEditorFeature';

export default function MapEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: 'Trình tạo Sơ đồ', headerShown: true }} />
      <AdminMapEditorFeature id={id as string} />
    </>
  );
}
