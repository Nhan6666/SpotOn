"use client";

import { useAuth } from '@/providers/AuthProvider';
import { EditBranchFeature } from '@/features/admin/branch-management/EditBranchFeature';

import { BranchProvider } from '@/features/admin/branch-management/branch-management.context';

export default function ManagerEditBranchPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!user?.branch_id) return <div className="p-8 text-center text-gray-500">Bạn chưa được phân công quản lý chi nhánh nào.</div>;
  
  return (
    <BranchProvider>
      <EditBranchFeature branchId={user.branch_id} />
    </BranchProvider>
  );
}
