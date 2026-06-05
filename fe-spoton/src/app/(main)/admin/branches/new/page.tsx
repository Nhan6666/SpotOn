import { AddBranchFeature } from '@/features/branch-management/AddBranchFeature';

export const metadata = {
  title: 'Add New Branch | SpotOn Admin',
  description: 'Add a new SpotOn branch to the system.',
};

export default function AddBranchPage() {
  return <AddBranchFeature />;
}
