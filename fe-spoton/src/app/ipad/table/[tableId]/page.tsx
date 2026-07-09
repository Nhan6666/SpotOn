import { IpadFeature } from '@/features/ipad/IpadFeature';

export default async function IpadTablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  return <IpadFeature tableId={tableId} />;
}
