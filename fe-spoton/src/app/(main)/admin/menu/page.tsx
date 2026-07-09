import { MenuFeature } from '@/features/admin/menu/MenuFeature';

export const metadata = {
  title: 'Menu Management | SpotOn Admin',
  description: 'Manage core menu items, categories, and pricing.',
};

export default function MenuPage() {
  return <MenuFeature />;
}
