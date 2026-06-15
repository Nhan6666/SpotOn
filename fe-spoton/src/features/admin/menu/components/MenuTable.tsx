"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Pencil,
  Trash2,
  Wine,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MenuItem } from '../menu.types';

interface MenuTableProps {
  items: MenuItem[];           // Already paginated from server
  currentPage: number;
  totalItems: number;          // Total from server pagination
  totalPages: number;          // Total pages from server
  itemsPerPage: number;        // Items per page from server
  onPageChange: (page: number) => void;
  onDelete: (menuId: string, itemId: string) => Promise<void>;
}

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

function StatusBadge({ status }: { status: MenuItem['status'] }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4caf50]" />
        Active
      </span>
    );
  }
  if (status === 'HIDDEN') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Hidden
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Hidden
    </span>
  );
}

function MenuItemImage({ item }: { item: MenuItem }) {
  if (item.image_url) {
    return (
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-sm bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.classList.add('flex', 'items-center', 'justify-center');
              const icon = document.createElement('span');
              icon.textContent = '🍽️';
              icon.className = 'text-lg';
              target.parentElement.appendChild(icon);
            }
          }}
        />
      </div>
    );
  }

  // Fallback icon based on category
  return (
    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400">
      {item.category === 'Drinks' || item.category === 'Đồ Uống'
        ? <Wine className="w-6 h-6" strokeWidth={1.5} />
        : <UtensilsCrossed className="w-6 h-6" strokeWidth={1.5} />}
    </div>
  );
}

export function MenuTable({
  items,
  currentPage,
  totalItems,
  totalPages,
  itemsPerPage,
  onPageChange,
  onDelete,
}: MenuTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Items are already paginated from server — render directly
  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-[#f8fafc]">
              <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[35%]">ITEM</th>
              <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">CATEGORY</th>
              <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">BASE PRICE (VND)</th>
              <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">PRICE RANGE (MIN-MAX)</th>
              <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">STATUS</th>
              <th className="text-right py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                  Không có món ăn nào trong danh mục này.
                </td>
              </tr>
            ) : items.map((item) => (
              <tr
                key={item._id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Item */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <MenuItemImage item={item} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-gray-900">{item.name}</span>
                        {item.is_core_item && (
                          <Lock className="w-4 h-4 text-amber-500" strokeWidth={2.5} />
                        )}
                      </div>
                      {item.is_core_item ? (
                         <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fff3e0] text-[#e65100] w-max uppercase tracking-wider">
                           CORE
                         </span>
                      ) : item.description ? (
                        <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                      ) : null}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-4 px-6">
                  <span className="text-[14px] text-gray-500">{item.category}</span>
                </td>

                {/* Base Price */}
                <td className="py-4 px-6">
                  <span className="text-[14px] font-bold text-gray-900">{formatVND(item.base_price)}</span>
                </td>

                {/* Price Range */}
                <td className="py-4 px-6">
                  {item.min_price && item.max_price ? (
                    <span className="text-[14px] text-gray-500">
                      {formatVND(item.min_price)} <span className="text-gray-300 mx-1">—</span> {formatVND(item.max_price)}
                    </span>
                  ) : (
                    <span className="text-[14px] text-gray-400 italic">Flexible (No Limits)</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <StatusBadge status={item.status} />
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right">
                  {deleteConfirmId === item._id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-red-600 font-bold mr-1">Xóa?</span>
                      <button
                        disabled={isDeleting}
                        onClick={async () => {
                          setIsDeleting(true);
                          await onDelete(item.menu_id, item._id);
                          setIsDeleting(false);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? '...' : 'Có'}
                      </button>
                      <button
                        disabled={isDeleting}
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/menu/${item.menu_id}/${item._id}/edit`}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors inline-flex justify-end"
                        title="Sửa món"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={2} />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-end"
                        title="Xóa món"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Server-side Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {totalItems === 0
            ? 'No items found'
            : `Showing ${showingFrom} to ${showingTo} of ${totalItems} items`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((page, idx) =>
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded font-medium text-sm transition-colors ${
                    page === currentPage
                      ? 'bg-[#e67e22] text-white shadow-sm'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
