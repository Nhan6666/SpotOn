import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: { backgroundColor: Colors.background },
      headerTitleStyle: { fontFamily: 'Lexend_600SemiBold', color: Colors.text },
      headerTintColor: Colors.primary,
      headerShadowVisible: false,
    }}>
      <Stack.Screen 
        name="branches" 
        options={{ title: 'Quản lý Chi nhánh' }} 
      />
    </Stack>
  );
}
