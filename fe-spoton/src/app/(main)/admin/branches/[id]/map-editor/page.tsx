import { use } from 'react';
import { MapEditorFeature } from '@/features/admin/map-editor/MapEditorFeature';

export const metadata = {
  title: 'Map Editor | SpotOn Admin',
  description: 'Manage zones and tables layout for your branch.',
};

export default function MapEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <MapEditorFeature branchId={id} />;
}
