"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { http } from '@/lib/http';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface MenuItem {
  _id: string;
  name: string;
  base_price: number;
  image_url: string;
}

interface MenuCategory {
  _id: string;
  category_name: string;
  items: MenuItem[];
}

export function NewDishesSection() {
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const ITEMS_PER_PAGE = 8;
  const maxPages = 3; // Tối đa 3 trang (24 món)
  const totalPages = Math.min(maxPages, Math.ceil(allItems.length / ITEMS_PER_PAGE));
  const currentItems = allItems.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await http.get<{ success: boolean; data: MenuCategory[] }>('/categories');
        if (res?.data) {
          // Flatten items from all categories
          const fetchedItems = res.data.flatMap((cat) => cat.items || []);
          setAllItems(fetchedItems);
        }
      } catch (error) {
        console.error('Failed to fetch menus:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(0, p - 1));
  };

  const handleNext = () => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  };

  if (isLoading) {
    return (
      <section className="bg-transparent py-16 text-center">
        <h2 className="text-[#1a3826] text-4xl font-black tracking-tight mb-12 uppercase">Món mới ra lò</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e67e22]"></div>
        </div>
      </section>
    );
  }

  if (allItems.length === 0) {
    return null;
  }

  return (
    <section className="bg-transparent py-16 px-4 md:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-[#1a3826] text-[42px] font-black tracking-tight mb-12 text-center uppercase">Món mới ra lò</h2>

        <div className="relative">
          {/* Grid: 2 rows of 4 cards on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[600px]">
            {currentItems.map((item) => (
              <div key={item._id} className="bg-white rounded-xl overflow-hidden shadow-lg flex flex-col group h-[340px]">
                <div className="h-[180px] w-full overflow-hidden relative shrink-0">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-[17px] font-bold text-gray-900 line-clamp-2 mb-1">{item.name}</h3>
                    <p className="text-[#1a3826] font-semibold text-[15px]">
                      {(item.base_price || 0).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 hover:border-[#e67e22] hover:text-[#e67e22] hover:bg-amber-50 transition-colors text-sm font-semibold text-gray-700">
                      <Plus className="w-4 h-4" />
                      Đặt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Left/Right controls */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 transition-colors hidden lg:block ${currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-[#e67e22] cursor-pointer'}`}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages - 1}
            className={`absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 transition-colors hidden lg:block ${currentPage >= totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-[#e67e22] cursor-pointer'}`}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>

        {/* Carousel indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentPage ? 'bg-[#e67e22]' : 'bg-black/20 hover:bg-black/40'}`}
                aria-label={`Go to page ${idx + 1}`}
              ></button>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center mt-10">
          <Link href="/menu" className="px-8 py-3 rounded-lg border-2 border-[#e67e22] text-[#1a3826] font-bold text-[15px] hover:bg-[#e67e22] transition-colors inline-block uppercase tracking-wide">
            Xem thực đơn
          </Link>
        </div>
      </div>
    </section>
  );
}
