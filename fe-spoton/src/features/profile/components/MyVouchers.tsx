"use client";

import React, { useEffect, useState } from 'react';
import { voucherService } from '@/features/public/promotions/voucher.service';
import { Tag, Clock, CheckCircle } from 'lucide-react';

export function MyVouchers() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await voucherService.getMyWallet();
        if (res?.data) {
          setWallets(res.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy ví voucher:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải ví voucher...</div>;
  }

  if (wallets.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ví voucher trống</h3>
        <p className="text-gray-500">Bạn chưa có mã giảm giá nào. Hãy lấy thêm tại trang Khuyến mãi nhé!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map((wallet) => {
          const voucher = wallet.voucher_id;
          if (!voucher) return null; // Fallback nếu voucher bị xóa cứng
          
          const isUsed = wallet.status === 'USED';
          const isExpired = wallet.status === 'EXPIRED' || new Date(voucher.valid_until) < new Date();
          
          let statusColor = 'bg-green-100 text-green-700';
          let statusText = 'Chưa sử dụng';
          let Icon = Tag;

          if (isUsed) {
            statusColor = 'bg-gray-100 text-gray-600';
            statusText = 'Đã sử dụng';
            Icon = CheckCircle;
          } else if (isExpired) {
            statusColor = 'bg-red-100 text-red-600';
            statusText = 'Đã hết hạn';
            Icon = Clock;
          }

          const discountText = voucher.discount_type === 'PERCENTAGE' 
            ? `Giảm ${voucher.discount_value}%` 
            : `Giảm ${(voucher.discount_value || 0).toLocaleString('vi-VN')}đ`;

          return (
            <div key={wallet._id} className={`p-5 rounded-2xl border ${isUsed || isExpired ? 'border-gray-200 bg-gray-50 opacity-80' : 'border-orange-200 bg-white shadow-sm hover:shadow-md transition-shadow'} flex flex-col justify-between`}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${statusColor}`}>
                    <Icon className="w-3 h-3" />
                    {statusText}
                  </div>
                  <div className="font-mono font-bold text-gray-900 px-2 py-1 bg-gray-100 rounded text-sm border border-gray-200">
                    {voucher.code}
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{voucher.name}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{voucher.description || discountText}</p>
                {voucher.min_order_value > 0 && (
                  <p className="text-xs text-gray-500 mt-2">Đơn tối thiểu: {voucher.min_order_value.toLocaleString()}đ</p>
                )}
                {voucher.min_guest_count > 1 && (
                  <p className="text-xs text-gray-500">Bàn tối thiểu: {voucher.min_guest_count} người</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                HSD: {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
