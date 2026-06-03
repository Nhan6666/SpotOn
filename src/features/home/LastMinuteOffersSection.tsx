'use client';

import { useState, useEffect } from 'react';
import type { LastMinuteOffer } from './home.types';
import { LAST_MINUTE_OFFERS } from './home.constants';
import { AOS } from '@/providers/AOS';

function useCountdown(targetHours: number) {
  const [timeLeft, setTimeLeft] = useState({ h: targetHours, m: 45, s: 12 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 0; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return timeLeft;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: '#1a1208', minWidth: 36, textAlign: 'center' }}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#6b5d4a' }}>{label}</span>
    </div>
  );
}

function OfferCard({ offer, index }: { offer: LastMinuteOffer; index: number }) {
  return (
    <AOS animation="fade-up" duration={500} delay={index * 100}>
      <div
        className="relative flex flex-col rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1"
        style={{ background: '#fff', border: '1px solid #ede8df', boxShadow: '0 2px 12px rgba(26,18,8,0.08)', minWidth: 160, flex: 1 }}
      >
        <div className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: offer.tagColor, color: '#fff' }}>
          {offer.tag}
        </div>
        <div className="relative h-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #2d1a08 0%, #4a2d14 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">🍽️</div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ background: '#c8891a' }} />
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          <div className="text-sm font-semibold leading-tight" style={{ color: '#1a1208' }}>{offer.restaurantName}</div>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#6b5d4a' }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {offer.location}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="w-3 h-3" fill={i < Math.round(offer.rating) ? '#f0b843' : '#e5ddd0'} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px]" style={{ color: '#6b5d4a' }}>({offer.reviewCount})</span>
          </div>
          <button className="mt-1 w-full py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #c8891a 0%, #f0b843 100%)', color: '#fff' }}>
            Book Now
          </button>
        </div>
      </div>
    </AOS>
  );
}

export function LastMinuteOffersSection() {
  const time = useCountdown(9);
  return (
    <section id="last-minute-offers" className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 flex-wrap md:flex-nowrap">
          {/* Left promo */}
          <AOS animation="fade-right" duration={600} delay={0}>
            <div className="flex flex-col justify-between p-6 rounded-2xl min-w-[220px] md:w-64 shrink-0"
              style={{ background: 'linear-gradient(160deg, #c8891a 0%, #a06a10 100%)' }}>
              <div>
                <div className="inline-block text-[10px] font-bold px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  LAST MINUTE
                </div>
                <p className="text-xl font-bold text-white leading-tight mb-2">LAST MINUTE<br />OFFERS</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Book today and enjoy special discounts at select branches tonight.
                </p>
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.9)' }}>
                  <CountdownBlock value={time.h} label="Hrs" />
                  <span className="font-bold text-lg" style={{ color: '#c8891a' }}>:</span>
                  <CountdownBlock value={time.m} label="Min" />
                  <span className="font-bold text-lg" style={{ color: '#c8891a' }}>:</span>
                  <CountdownBlock value={time.s} label="Sec" />
                </div>
                <p className="text-center text-xs mt-2 font-bold text-white">UP TO 30% OFF</p>
              </div>
            </div>
          </AOS>

          {/* Right offer cards */}
          <div className="flex gap-4 flex-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {LAST_MINUTE_OFFERS.map((offer, i) => (
              <OfferCard key={offer.id} offer={offer} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
