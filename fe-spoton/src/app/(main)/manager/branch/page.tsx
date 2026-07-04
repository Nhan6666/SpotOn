"use client";

import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';

export default function ManagerBranchPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Chi nhánh</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý thông tin chi nhánh mà bạn được phân công.
        </p>
      </div>

      {user?.branch_id ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Chi nhánh của bạn</h2>
            <Link
              href={`/admin/branches/${user.branch_id}/map-editor`}
              className="px-4 py-2 bg-[#ea580c] text-white rounded-lg text-sm font-medium hover:bg-[#c2410c] transition-colors"
            >
              Quản lý Sơ đồ bàn
            </Link>
          </div>
          <p className="text-gray-500 text-sm">Branch ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{user.branch_id}</code></p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-yellow-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800 mb-1">Chưa được phân công chi nhánh</h3>
          <p className="text-yellow-600 text-sm">Vui lòng liên hệ Admin để được gán vào một chi nhánh.</p>
        </div>
      )}
    </div>
  );
}
