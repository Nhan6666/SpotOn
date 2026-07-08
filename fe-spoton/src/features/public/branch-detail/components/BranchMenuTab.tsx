import { useState } from 'react';
import Image from 'next/image';
import { PUBLIC_TEXTS } from '@/constants/texts/public';

export function BranchMenuTab({ menu }: { menu: any }) {
  const categories = menu?.categories || menu || [];
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center">
        <p className="text-gray-500 italic">{PUBLIC_TEXTS.branchDetail.menuTab.empty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{PUBLIC_TEXTS.branchDetail.menuTab.title}</h3>
        <p className="text-gray-500 text-sm">{PUBLIC_TEXTS.branchDetail.menuTab.subtitle}</p>
      </div>

      <div className="mb-6 flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-[#ea580c] text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất Cả
        </button>
        {Array.isArray(categories) && categories.map((cat: any, idx: number) => {
          const catId = cat._id || idx.toString();
          return (
            <button
              key={catId}
              onClick={() => setActiveCategory(catId)}
              className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === catId
                  ? 'bg-[#ea580c] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name || PUBLIC_TEXTS.branchDetail.menuTab.noCategoryName}
            </button>
          );
        })}
      </div>

      <div className="space-y-12">
        {Array.isArray(categories) && categories
          .filter((cat: any, idx: number) => activeCategory === 'all' || activeCategory === (cat._id || idx.toString()))
          .map((cat: any, idx: number) => (
          <div key={cat._id || idx}>
            <h4 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500 inline-block">
              {cat.name || PUBLIC_TEXTS.branchDetail.menuTab.noCategoryName}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(cat.items || []).map((item: any, iIdx: number) => {
                const isOutOfStock = !item.is_available || item.quantity === 0;
                return (
                  <div key={item._id || iIdx} className={`flex gap-4 p-4 rounded-xl border border-gray-100 bg-white transition-shadow relative overflow-hidden ${isOutOfStock ? 'opacity-60 grayscale-[50%]' : 'hover:shadow-md'}`}>
                    
                    {/* Out of stock overlay/badge */}
                    {isOutOfStock && (
                      <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10 uppercase tracking-wider">
                        {PUBLIC_TEXTS.branchDetail.menuTab.outOfStock}
                      </div>
                    )}

                    <div className="w-24 h-24 rounded-lg bg-gray-100 relative overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1 pr-12">
                        <h5 className="font-bold text-gray-900">{item.name || PUBLIC_TEXTS.branchDetail.menuTab.noItemName}</h5>
                        <span className="font-bold text-[#ea580c] whitespace-nowrap">{item.price ? `${item.price.toLocaleString()}đ` : PUBLIC_TEXTS.branchDetail.menuTab.priceContact}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description || PUBLIC_TEXTS.branchDetail.menuTab.noDesc}</p>
                    </div>
                  </div>
                );
              })}
              
              {(!cat.items || cat.items.length === 0) && (
                <p className="text-gray-500 italic text-sm">{PUBLIC_TEXTS.branchDetail.menuTab.emptyCategory}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
