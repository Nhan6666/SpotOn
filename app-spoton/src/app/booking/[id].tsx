import { useLocalSearchParams } from 'expo-router';
import { BookingFlowFeature } from '@/features/booking/BookingFlowFeature';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookingFlowFeature id={id!} />;
}
