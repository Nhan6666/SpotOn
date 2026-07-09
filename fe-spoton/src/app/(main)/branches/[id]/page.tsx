import { Suspense } from 'react';
import { BranchDetailFeature } from '@/features/public/branch-detail/BranchDetailFeature';

export default async function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-20 text-center">Đang tải dữ liệu chi nhánh...</div>}>
      <BranchDetailFeature branchId={id} />
    </Suspense>
  );
}
