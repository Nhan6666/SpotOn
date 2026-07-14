"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { HOME_TEXTS } from '@/constants/texts/home';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';
import { PublicVoucherCard } from '@/components/ui/PublicVoucherCard';

interface Voucher {
  _id: string;
  code: string;
  discount_percentage: number;
  max_discount_amount: number;
  min_order_value: number;
}

export function SpecialOffers() {
  const { specialOffers } = HOME_TEXTS;
  const [offers, setOffers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedOffers, setClaimedOffers] = useState<Set<string>>(new Set());
  const { success, error } = useToast();

  // Drag to scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

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

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-stencil tracking-wider uppercase text-[#F2B02A] mb-2">{specialOffers.title}</h2>
            <p className="text-gray-300 text-sm">{specialOffers.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[340px] h-40 bg-[#0A2A12] border border-[#2A5A3A] rounded-2xl animate-pulse"></div>
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
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex overflow-x-auto gap-6 pb-4 hide-scrollbar cursor-grab active:cursor-grabbing ${!isDragging ? 'snap-x snap-mandatory' : ''}`}
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {offers.map((offer, index) => {
            const isClaimed = claimedOffers.has(offer.code);
            return (
              <PublicVoucherCard
                key={offer._id}
                voucher={offer}
                isClaimed={isClaimed}
                onClaim={handleSimulateClaim}
                className="min-w-[300px] md:min-w-[340px] max-w-[340px] flex-shrink-0 snap-start"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
