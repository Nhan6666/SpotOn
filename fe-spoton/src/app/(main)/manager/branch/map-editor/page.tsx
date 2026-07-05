"use client";

import { useAuth } from '@/providers/AuthProvider';
import { MapEditorFeature } from '@/features/admin/map-editor/MapEditorFeature';

export default function ManagerMapEditorPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!user?.branch_id) return <div className="p-8 text-center text-gray-500">Bạn chưa được phân công quản lý chi nhánh nào.</div>;
  
  return <MapEditorFeature branchId={user.branch_id} />;
}
