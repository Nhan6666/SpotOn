"use client";

import { useState, useEffect } from 'react';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';
import { voucherService } from './voucher.service';

interface Voucher {
  _id: string;
  code: string;
  discount_percentage: number;
  max_discount_amount: number;
  min_order_value: number;
}

const CARD_STYLES = [
  { bg: 'bg-[#e68a1a]', text: 'text-[#e68a1a]' },
  { bg: 'bg-[#3e5f48]', text: 'text-[#3e5f48]' },
  { bg: 'bg-[#2a2f3a]', text: 'text-[#2a2f3a]' }
];

const DECORATIONS = [
  'top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:scale-150',
  'bottom-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full translate-x-10 translate-y-10 transition-transform duration-500 group-hover:scale-125',
  'top-1/2 right-0 w-24 h-24 bg-white opacity-5 rounded-full translate-x-4 -translate-y-1/2 transition-transform duration-500 group-hover:scale-[2]'
];

export default function PromotionsFeature() {
  const [offers, setOffers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedOffers, setClaimedOffers] = useState<Set<string>>(new Set());
  const { success, error } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spoton_claimed_vouchers');
      if (saved) {
        setClaimedOffers(new Set(JSON.parse(saved)));
      }
    } catch (e) {}
  }, []);

  const handleSimulateClaim = (code: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setClaimedOffers(prev => {
        const next = new Set(prev).add(code);
        localStorage.setItem('spoton_claimed_vouchers', JSON.stringify(Array.from(next)));
        return next;
      });
      success(`Đã nhận thành công! Voucher ${code} đã nằm trong Ví ưu đãi của bạn.`);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer, index) => {
              const style = CARD_STYLES[index % CARD_STYLES.length];
              const decoration = DECORATIONS[index % DECORATIONS.length];
              const name = `MÃ ${offer.code}`;
              const isClaimed = claimedOffers.has(offer.code);
              
              let description = `Giảm ${offer.discount_percentage}%`;
              if (offer.max_discount_amount) {
                description += ` tối đa ${offer.max_discount_amount.toLocaleString('vi-VN')}đ`;
              }
              if (offer.min_order_value) {
                description += ` cho đơn từ ${offer.min_order_value.toLocaleString('vi-VN')}đ`;
              }

              return (
                <div 
                  key={offer._id} 
                  className={`${style.bg} rounded-2xl p-8 text-white relative overflow-hidden group min-h-[280px] flex flex-col justify-between items-start shadow-md hover:shadow-xl transition-all`}
                >
                  <div className={`absolute ${decoration}`}></div>
                  <div className="relative z-10">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">
                      Ưu Đãi Đặc Biệt
                    </div>
                    <h3 className="text-2xl font-bold mb-2 line-clamp-2" title={name}>{name}</h3>
                    <p className="text-white text-opacity-90 text-sm mb-6 line-clamp-3">
                      {description}
                    </p>
                  </div>
                  <div className="relative z-10 flex gap-2 w-full mt-4">
                    {!isClaimed ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateClaim(offer.code);
                        }}
                        className={`flex-1 px-6 py-2.5 bg-white ${style.text} text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm cursor-pointer`}
                      >
                        Nhận Voucher
                      </button>
                    ) : (
                      <div className="flex-1 px-6 py-2.5 bg-transparent border-2 border-white/20 text-white text-sm font-bold rounded-full flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Đã nhận
                      </div>
                    )}
                  </div>
                </div>
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
