"use client";

export default function ManagerMenusPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cập nhật Thực đơn</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý thực đơn của chi nhánh (ẩn/hiện món, cập nhật giá).
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Tính năng đang phát triển</h3>
        <p className="text-gray-400 text-sm">Trang quản lý thực đơn cho Manager sẽ sớm ra mắt.</p>
      </div>
    </div>
  );
}
