"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Phone, Clock } from 'lucide-react';
import { HOME_TEXTS } from '@/constants/texts/home';
import { useBranches } from '@/features/public/branches/useBranches';
import { FALLBACK_IMAGES } from '@/features/public/branches/branches.constants';
import { PublicBranch } from '@/features/public/branches/branches.types';

export function FeaturedBranches() {
  const { branches, isLoading } = useBranches();
  const [currentPage, setCurrentPage] = useState(0);

  // Helper: get address string
  const getAddressDisplay = (branch: PublicBranch) => {
    if (typeof branch.address === "object" && branch.address?.full) {
      return branch.address.full;
    }
    if (typeof branch.address === "string") return branch.address;
    return "Chưa cập nhật địa chỉ";
  };

  // Helper: format time range
  const getServiceHoursDisplay = (branch: PublicBranch) => {
    const sp = branch.service_periods;
    if (!sp) return null;

    const parts: string[] = [];
    if (sp.lunch?.start && sp.lunch?.end) {
      parts.push(`Trưa: ${sp.lunch.start} - ${sp.lunch.end}`);
    }
    if (sp.dinner?.start && sp.dinner?.end) {
      parts.push(`Tối: ${sp.dinner.start} - ${sp.dinner.end}`);
    }
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'FULL') {
      return (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          {HOME_TEXTS.popularBranches.status.full || 'Hết chỗ'}
        </div>
      );
    }
    if (status === 'CLOSED' || status === 'MAINTENANCE') {
      return (
        <div className="absolute top-3 right-3 bg-gray-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          {HOME_TEXTS.popularBranches.status.closed || 'Đóng cửa'}
        </div>
      );
    }
    return (
      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center">
        <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>
        {HOME_TEXTS.popularBranches.status.open || 'Đang mở'}
      </div>
    );
  };

  const ITEMS_PER_PAGE = 3;
  const maxPages = 4; // Tối đa 12 chi nhánh nổi bật
  const totalPages = Math.min(maxPages, Math.ceil(branches.length / ITEMS_PER_PAGE));
  const currentBranches = branches.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(0, p - 1));
  };

  const handleNext = () => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  };

  return (
    <section className="container mx-auto px-4 py-16 mb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-playfair tracking-tight">{HOME_TEXTS.popularBranches.title}</h2>
          <p className="text-gray-500 text-sm">{HOME_TEXTS.popularBranches.subtitle}</p>
        </div>
        <Link href="/branches" className="text-amber-500 hover:text-amber-600 text-sm font-medium flex items-center transition-colors">
          {HOME_TEXTS.popularBranches.viewAllBtn} <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </Link>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-[320px] animate-pulse">
                <div className="h-48 bg-gray-200 w-full"></div>
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))
          ) : currentBranches.length > 0 ? (
            currentBranches.map((branch, index) => {
            const imageUrl = (branch.images && branch.images.length > 0 && branch.images[0] && branch.images[0].trim() !== '') 
              ? branch.images[0] 
              : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

            return (
              <div key={branch._id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col group h-full transition-transform hover:-translate-y-1">
                <Link href={`/branches/${branch._id}`} className="flex flex-col h-full group cursor-pointer">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image 
                      src={imageUrl} 
                      alt={branch.name} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Status Badge */}
                    {getStatusBadge(branch.status)}
                  </div>
                  
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-amber-500 transition-colors line-clamp-1">{branch.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-start text-gray-500 text-sm">
                          <svg className="w-4 h-4 mr-1.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                          <span className="line-clamp-2">{getAddressDisplay(branch)}</span>
                        </div>
                        <div className="flex items-start text-gray-500 text-sm">
                          <Phone className="w-4 h-4 mr-1.5 mt-0.5 shrink-0" />
                          <span>{branch.hotline || 'Đang cập nhật'}</span>
                        </div>
                        <div className="flex items-start text-gray-500 text-sm">
                          <Clock className="w-4 h-4 mr-1.5 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{getServiceHoursDisplay(branch) || 'Đang cập nhật'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                      <span className="px-6 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 text-sm font-semibold rounded-full transition-colors w-full text-center cursor-pointer">
                        {HOME_TEXTS.popularBranches.bookingBtn || 'Đặt bàn'}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500">
            Không có dữ liệu chi nhánh.
          </div>
        )}
        </div>

        {/* Left/Right controls */}
        {totalPages > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className={`absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 transition-colors hidden lg:block ${currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-amber-500 cursor-pointer'}`}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              className={`absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 transition-colors hidden lg:block ${currentPage >= totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-amber-500 cursor-pointer'}`}
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
