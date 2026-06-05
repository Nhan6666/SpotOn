import { EditBranchFeature } from '@/features/branch-management/EditBranchFeature';

export default function EditBranchPage({ params }: { params: { id: string } }) {
  return <EditBranchFeature branchId={params.id} />;
}
