"use client";

import React from 'react';
import Image from 'next/image';
import { Search, Plus } from 'lucide-react';
import { useMenuTabs } from './useMenuTabs';

export function PublicMenuFeature() {
  const { 
    categories, 
    activeTab, 
    handleTabChange, 
    items, 
    isLoadingCategories, 
    isLoadingItems, 
    hasMore, 
    loadMore,
    error 
  } = useMenuTabs();

  if (isLoadingCategories) {
    return (
      <div className="min-h-screen bg-[#f9fafb] pt-32 pb-20 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e67e22]"></div>
        <p className="mt-4 text-gray-500 font-medium">Đang tải danh mục thực đơn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f9fafb] pt-32 pb-20 flex flex-col items-center">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <main className="bg-[#f9fafb] min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="relative w-full h-[350px] md:h-[450px]">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop"
            alt="Thực đơn SpotOn"
            fill
            sizes="100vw"
            className="object-cover brightness-[0.6]"
            priority
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-wider font-playfair drop-shadow-lg">
            Thực Đơn
          </h1>

        </div>
      </section>

      {/* TABS MENU: Scrollable & Max 4 visible on mobile */}
      <div className="sticky top-[72px] md:top-[80px] z-40 bg-[#fba81a] shadow-md transition-all duration-300">
        <div className="container mx-auto max-w-7xl relative">
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth items-center lg:justify-center"
            style={{ 
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none' // IE
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleTabChange(cat.category_name)}
                className={`
                  cursor-pointer snap-start flex-shrink-0 whitespace-nowrap px-6 py-4 font-bold text-[15px] transition-all uppercase border-b-4 
                  /* On mobile, ensure approx 4 tabs are visible by setting min/max widths */
                  w-[25%] lg:w-auto min-w-[100px] text-center
                  ${
                  activeTab === cat.category_name
                    ? 'border-[#1a3826] text-[#1a3826] bg-amber-400/30'
                    : 'border-transparent text-[#1a3826]/80 hover:text-[#1a3826] hover:bg-amber-400/20'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content: Lazy Loaded Items */}
      <div className="container mx-auto px-4 py-12">
        {items.length === 0 && !isLoadingItems ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có món ăn</h3>
            <p className="text-gray-500">Danh mục này hiện chưa có món ăn nào.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={item._id} className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-50 flex flex-col group hover:shadow-xl transition-shadow duration-300">
                  <div className="aspect-[4/3] w-full overflow-hidden relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-[17px] font-bold text-gray-900 leading-snug group-hover:text-[#e67e22] transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-[13px] line-clamp-2 leading-relaxed mb-4">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <p className="text-[#e67e22] font-black text-lg">
                        {(item.base_price || item.price || 0).toLocaleString('vi-VN')} <span className="text-sm font-bold opacity-70">đ</span>
                      </p>
                      <button className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-50 text-[#e67e22] hover:bg-[#e67e22] hover:text-white transition-colors group/btn cursor-pointer">
                        <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Skeletons when loading */}
              {isLoadingItems && Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50 animate-pulse">
                  <div className="aspect-[4/3] w-full bg-gray-200"></div>
                  <div className="p-5">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="flex justify-between items-center mt-auto pt-4">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button (Infinite Scroll alternative) */}
            {hasMore && !isLoadingItems && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-white border-2 border-[#e67e22] text-[#e67e22] font-bold rounded-full hover:bg-[#e67e22] hover:text-white transition-colors"
                >
                  Xem thêm món
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
