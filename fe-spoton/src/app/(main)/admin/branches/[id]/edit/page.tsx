import { use } from 'react';
import { EditBranchFeature } from '@/features/branch-management/EditBranchFeature';

export default function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditBranchFeature branchId={id} />;
}
