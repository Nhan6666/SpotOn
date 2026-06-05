import { BranchManagementFeature } from '@/features/branch-management/BranchManagementFeature';

export const metadata = {
  title: 'Branch Management | SpotOn Admin',
  description: 'Manage branches, capacities, and operations across the SpotOn chain.',
};

export default function BranchesPage() {
  return <BranchManagementFeature />;
}
