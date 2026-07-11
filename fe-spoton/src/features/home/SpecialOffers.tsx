"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HOME_TEXTS } from '@/constants/texts/home';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';

interface Voucher {
  _id: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  code: string;
}

const CARD_STYLES = [
  { bg: 'bg-[#0A2A12] border border-[#2A5A3A]', text: 'text-[#164626]' },
  { bg: 'bg-[#0A2A12] border border-[#2A5A3A]', text: 'text-[#164626]' },
  { bg: 'bg-[#0A2A12] border border-[#2A5A3A]', text: 'text-[#164626]' }
];

const DECORATIONS = [
  'top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:scale-150',
  'bottom-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full translate-x-10 translate-y-10 transition-transform duration-500 group-hover:scale-125',
  'top-1/2 right-0 w-24 h-24 bg-white opacity-5 rounded-full translate-x-4 -translate-y-1/2 transition-transform duration-500 group-hover:scale-[2]'
];

export function SpecialOffers() {
  const { specialOffers } = HOME_TEXTS;
  const [offers, setOffers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const { success, error } = useToast();

  const handleCopyCode = (code: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      success(`Đã sao chép mã ưu đãi: ${code}`);
    } else {
      error('Mã ưu đãi này chưa có code');
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

  const ITEMS_PER_PAGE = 3;
  const maxPages = 4;
  const totalPages = Math.min(maxPages, Math.ceil(offers.length / ITEMS_PER_PAGE));
  const currentOffers = offers.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handlePrev = () => setCurrentPage((p) => Math.max(0, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-stencil tracking-wider uppercase text-[#F2B02A] mb-2">{specialOffers.title}</h2>
            <p className="text-gray-300 text-sm">{specialOffers.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-[#0A2A12] border border-[#2A5A3A] rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  if (offers.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16 mb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-stencil tracking-wider uppercase text-[#F2B02A] mb-2">{specialOffers.title}</h2>
          <p className="text-gray-300 text-sm">{specialOffers.subtitle}</p>
        </div>
        <Link href="/promotions" className="text-[#F2B02A] hover:text-[#d99d24] text-sm font-bold uppercase tracking-wider flex items-center transition-colors">
          {specialOffers.viewAllBtn} <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </Link>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentOffers.map((offer, index) => {
            const style = CARD_STYLES[index % CARD_STYLES.length];
            const decoration = DECORATIONS[index % DECORATIONS.length];
            const discountText = offer.discount_type === 'PERCENTAGE' 
              ? `Giảm ${offer.discount_value || 0}%` 
              : `Giảm ${(offer.discount_value || 0).toLocaleString('vi-VN')}đ`;

            return (
              <div 
                key={offer._id} 
                onClick={() => handleCopyCode(offer.code)}
                className={`${style.bg} rounded-2xl p-8 text-white relative overflow-hidden group h-full min-h-[260px] flex flex-col justify-between items-start shadow-md cursor-pointer`}
              >
                <div className={`absolute ${decoration}`}></div>
                <div className="relative z-10">
                  <div className="bg-[#F2B02A] text-[#164626] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">
                    Ưu Đãi
                  </div>
                  <h3 className="text-2xl font-bold mb-2 line-clamp-2 text-[#F2B02A]" title={offer.name}>{offer.name}</h3>
                  <p className="text-gray-300 text-sm mb-6 max-w-[85%] line-clamp-3">
                    {offer.description || discountText}
                  </p>
                </div>
                <button 
                  onClick={() => handleCopyCode(offer.code)}
                  className={`relative z-10 px-5 py-2 bg-[#F2B02A] ${style.text} text-sm font-bold rounded-full hover:bg-[#d99d24] transition-colors shadow-sm cursor-pointer uppercase tracking-wider`}
                >
                  Lấy Mã
                </button>
              </div>
            );
          })}
        </div>

        {/* Left/Right controls */}
        {totalPages > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className={`absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 transition-colors hidden lg:block ${currentPage === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-[#F2B02A] cursor-pointer'}`}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              className={`absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 transition-colors hidden lg:block ${currentPage >= totalPages - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-[#F2B02A] cursor-pointer'}`}
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
