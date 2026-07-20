"use client";

import { useState, useEffect } from 'react';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';
import { voucherService } from './voucher.service';
import { PublicVoucherCard } from '@/components/ui/PublicVoucherCard';

interface Voucher {
  _id: string;
  code: string;
  discount_percentage: number;
  max_discount_amount: number;
  min_order_value: number;
}

export default function PromotionsFeature() {
  const [offers, setOffers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await http.get<{ success: boolean; data: Voucher[] }>('/vouchers/public/global');
        if (res?.data) {
          setOffers(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch special offers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-playfair tracking-tight">Khuyến Mãi & Ưu Đãi</h1>
          <p className="text-gray-600 text-lg">
            Khám phá các chương trình khuyến mãi đặc biệt dành riêng cho bạn tại hệ thống SpotOn. Hãy lấy mã và tận hưởng bữa ăn tuyệt vời!
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 place-items-center">
            {offers.map((offer, index) => {
              
              return (
                <PublicVoucherCard
                  key={offer._id}
                  voucher={offer}
                  className="w-full max-w-[340px]"
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có khuyến mãi nào</h3>
            <p className="text-gray-500">Hiện tại hệ thống chưa có chương trình khuyến mãi nào đang diễn ra. Vui lòng quay lại sau!</p>
          </div>
        )}
      </div>
    </div>
  );
}
