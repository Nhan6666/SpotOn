import { BookingDetailFeature } from '@/features/booking/BookingDetailFeature';
import { useLocalSearchParams } from 'expo-router';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  return <BookingDetailFeature id={id as string} />;
}
