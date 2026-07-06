"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMenuContext } from './menu.context';
import { MenuTable } from './components/MenuTable';
import { MenuCategoryFilter } from './menu.types';
import { menuService } from './menu.service';

export function MenuFeature() {
  const { items, categories, pagination, isLoading, fetchMasterMenu } = useMenuContext();
  const [activeTab, setActiveTab] = useState<MenuCategoryFilter | 'Tất cả món'>('Tất cả món');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Build dynamic tabs from server categories
  const categoryTabs: MenuCategoryFilter[] = useMemo(() => {
    const tabs: MenuCategoryFilter[] = ['Tất cả món'];
    categories.forEach(cat => {
      if (cat.category_name && !tabs.includes(cat.category_name)) {
        tabs.push(cat.category_name);
      }
    });
    return tabs;
  }, [categories]);

  // Fetch from server with current filters + page
  const loadData = useCallback(() => {
    fetchMasterMenu({
      page: currentPage,
      limit: 8,
      category: activeTab === 'Tất cả món' ? '' : activeTab,
      search: searchQuery || undefined,
    });
  }, [fetchMasterMenu, currentPage, activeTab, searchQuery]);

  // Re-fetch when page, tab, or search changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when filter or search changes
  const handleTabChange = (tab: MenuCategoryFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = async (menuId: string, itemId: string) => {
    try {
      await menuService.deleteItem(menuId, itemId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa món ăn.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Quản lý Thực đơn</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Quản lý các món ăn, giá bán và giới hạn giá cho từng chi nhánh.</p>
        </div>
        <Link href="/admin/menu/new">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Thêm món mới
          </Button>
        </Link>
      </div>

      {/* Dynamic Category Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {categoryTabs.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`pb-4 text-[15px] font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === tab
                ? 'text-[#e67e22]'
                : 'text-[#64748b] hover:text-[#334155]'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#e67e22] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Table Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e67e22]"></div>
        </div>
      ) : (
        <MenuTable 
          items={items}
          currentPage={pagination.page}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
