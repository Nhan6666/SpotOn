import React, { useEffect, useState } from 'react';
import { Info, Tags } from 'lucide-react';
import { http } from '@/lib/http';

interface AddMenuBasicsProps {
  itemName: string;
  setItemName: (val: string) => void;
  sku: string;
  setSku: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
}

export function AddMenuBasics({
  itemName, setItemName,
  sku, setSku,
  category, setCategory,
  description, setDescription
}: AddMenuBasicsProps) {
  const [categories, setCategories] = useState<{ _id: string, category_name: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await http.get<{ success: boolean; data: { _id: string, category_name: string }[] }>('/categories');
        if (res?.data) {
          setCategories(res.data);
          // Set default category if not set
          if (!category && res.data.length > 0) {
            setCategory(res.data[0].category_name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();
  }, [category, setCategory]);

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Basic Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start gap-3 mb-8">
          <div className="p-1.5 bg-orange-50 rounded-md text-[#e67e22]">
            <Info className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Basic Information</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">Provide the primary details for this item that customers will see.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-shadow"
            />
          </div>
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-bold text-gray-700">SKU</label>
              <span className="text-[11px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Auto</span>
            </div>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 border-dashed rounded-lg text-sm text-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            Primary Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-shadow cursor-pointer"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c._id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-bold text-gray-700">Description</label>
            <span className="text-[12px] font-medium text-gray-400">{description.length} / 250</span>
          </div>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-shadow resize-y"
          ></textarea>
        </div>
      </div>

      {/* Dietary & Attributes Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-24">
        <div className="flex items-start gap-3 mb-8">
          <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
            <Tags className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Dietary & Attributes</h2>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-3">Dietary Tags</label>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-[13px] font-semibold text-gray-600 flex items-center gap-1.5 hover:bg-gray-100 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              Vegetarian
            </button>
            <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-[13px] font-semibold text-gray-600 flex items-center gap-1.5 hover:bg-gray-100 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              Vegan
            </button>
            <button className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-[13px] font-semibold text-red-600 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
              Spicy Option
            </button>
            <button className="px-3 py-1.5 bg-[#fef3c7] border border-[#fde68a] rounded-full text-[13px] font-semibold text-[#b45309] flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              Gluten Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
