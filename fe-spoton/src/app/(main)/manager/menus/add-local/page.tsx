"use client";

import { AddLocalItemFeature } from '@/features/manager/menus/AddLocalItemFeature';

export default function AddLocalItemPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thêm Món Ăn Mới (Local)</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tạo món ăn đặc trưng chỉ bán tại chi nhánh của bạn.
        </p>
      </div>
      <AddLocalItemFeature />
    </div>
  );
}
