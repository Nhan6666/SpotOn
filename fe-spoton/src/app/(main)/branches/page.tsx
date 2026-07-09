import { Suspense } from 'react';
import { BranchesFeature } from '@/features/public/branches/BranchesFeature';

export default function BranchesPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Đang tải danh sách...</div>}>
      <BranchesFeature />
    </Suspense>
  );
}
