import React from 'react';
import { PUBLIC_TEXTS } from '@/constants/texts/public';

export interface VoucherCardProps {
    voucher: {
        _id?: string;
        code: string;
        discount_percentage: number;
        max_discount_amount?: number;
        min_order_value?: number;
        valid_until?: string;
    };
    className?: string;
}

export function PublicVoucherCard({ voucher, className = '' }: VoucherCardProps) {
    const formattedDate = voucher.valid_until ? new Date(voucher.valid_until).toLocaleDateString('vi-VN') : '';
    
    return (
        <div className={`flex bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm transition-shadow relative select-none ${className}`}>
            {/* Left side pattern */}
            <div className="w-8 flex-shrink-0 bg-amber-500 flex flex-col items-center justify-between py-2 border-r border-dashed border-amber-600">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-white rounded-full -ml-4" />
                ))}
            </div>

            <div className="p-5 flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-start mb-2">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider truncate mr-2">
                        {voucher.code || PUBLIC_TEXTS.branchDetail.vouchersTab.codeFallback}
                    </span>
                    {voucher.discount_percentage && (
                        <span className="font-black text-xl text-[#ea580c] whitespace-nowrap">
                            -{voucher.discount_percentage}%
                        </span>
                    )}
                </div>

                <h4 className="font-bold text-gray-900 mb-1 truncate">
                    Giảm {voucher.discount_percentage}% tối đa {voucher.max_discount_amount?.toLocaleString('vi-VN')}đ
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    Đơn tối thiểu {voucher.min_order_value?.toLocaleString('vi-VN')}đ
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{PUBLIC_TEXTS.branchDetail.vouchersTab.expiry} {formattedDate || PUBLIC_TEXTS.branchDetail.vouchersTab.noExpiry}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
