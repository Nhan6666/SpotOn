import { useLocalSearchParams } from 'expo-router';
import { BranchDetailFeature } from '@/features/branch/BranchDetailFeature';

export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BranchDetailFeature id={id!} />;
}
