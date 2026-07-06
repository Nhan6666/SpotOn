"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Search, Plus } from 'lucide-react';
import { http } from '@/lib/http';

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  base_price?: number;
  price?: number;
  image_url: string;
}

interface MenuCategory {
  _id: string;
  category_name: string;
  items: MenuItem[];
}

export function PublicMenuFeature() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await http.get<{ success: boolean; data: MenuCategory[] }>('/categories');
        if (res?.data) {
          // Filter out categories with no active items
          const validCategories = res.data.filter(cat => cat.items && cat.items.length > 0);
          setCategories(validCategories);
        }
      } catch (error) {
        console.error('Failed to fetch menus:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const scrollToCategory = (categoryId: string) => {
    setActiveTab(categoryId);
    // Scroll slightly down to hide the hero banner, but only on mobile maybe, or just stay where it is
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Remove Intersection Observer since we are now filtering instead of scrolling
  
  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(cat => cat.items.length > 0)
  .filter(cat => activeTab === 'all' || cat._id === activeTab);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] pt-32 pb-20 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e67e22]"></div>
        <p className="mt-4 text-gray-500 font-medium">Đang tải thực đơn...</p>
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
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-full border-none shadow-xl focus:ring-2 focus:ring-[#e67e22] text-gray-800 placeholder-gray-400 font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Sticky Category Tabs */}
      <div className="sticky top-[72px] md:top-[80px] z-40 bg-[#fba81a] shadow-md transition-all duration-300">
        <div className="container mx-auto max-w-7xl relative">
          <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center lg:justify-center">
            <button
              onClick={() => scrollToCategory('all')}
              className={`flex-shrink-0 whitespace-nowrap px-5 py-4 font-bold text-[15px] transition-all uppercase border-b-4 ${
                activeTab === 'all'
                  ? 'border-[#1a3826] text-[#1a3826]'
                  : 'border-transparent text-[#1a3826]/80 hover:text-[#1a3826]'
              }`}
            >
              TẤT CẢ
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => scrollToCategory(cat._id)}
                className={`flex-shrink-0 whitespace-nowrap px-5 py-4 font-bold text-[15px] transition-all uppercase border-b-4 ${
                  activeTab === cat._id
                    ? 'border-[#1a3826] text-[#1a3826]'
                    : 'border-transparent text-[#1a3826]/80 hover:text-[#1a3826]'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4 flex justify-center">
              <Search className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy món ăn</h3>
            <p className="text-gray-500">Vui lòng thử lại với từ khóa khác.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-6 px-6 py-2 bg-amber-100 text-[#e67e22] font-bold rounded-lg hover:bg-amber-200 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredCategories.map((cat) => (
              <div key={cat._id} id={`category-${cat._id}`} className="scroll-mt-40">
                <div className="flex items-center mb-8">
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight relative">
                    {cat.category_name}
                    <div className="absolute -bottom-2 left-0 w-12 h-1.5 bg-[#e67e22] rounded-full"></div>
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cat.items.map((item) => (
                    <div key={item._id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-50 flex flex-col group hover:shadow-xl transition-shadow duration-300">
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
                        {/* Fake Badge for visual flair */}
                        {Math.random() > 0.7 && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-sm">
                            Bán Chạy
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
                          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-50 text-[#e67e22] hover:bg-[#e67e22] hover:text-white transition-colors group/btn">
                            <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
