import { EditMenuFeature } from '@/features/admin/menu/EditMenuFeature';

export const metadata = {
  title: 'Edit Menu Item | SpotOn Admin',
  description: 'Edit menu item details, pricing, and media.',
};

interface EditMenuPageProps {
  params: Promise<{
    menuId: string;
    itemId: string;
  }>;
}

export default async function EditMenuPage({ params }: EditMenuPageProps) {
  const { menuId, itemId } = await params;
  return <EditMenuFeature menuId={menuId} itemId={itemId} />;
}
