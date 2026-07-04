"use client";

export default function ManagerBookingsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đặt bàn</h1>
        <p className="text-gray-500 text-sm mt-1">
          Xem và xử lý các đơn đặt bàn tại chi nhánh của bạn.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Tính năng đang phát triển</h3>
        <p className="text-gray-400 text-sm">Trang quản lý đặt bàn cho Manager sẽ sớm ra mắt.</p>
      </div>
    </div>
  );
}
