"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { http } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { Edit2, Trash2, Plus, Power, Package, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { MANAGER_TEXTS } from "@/constants/texts/manager";
import { useToast } from "@/components/ui/Toast";

interface MenuItem {
  _id: string;
  name: string;
  sku: string;
  description: string;
  base_price: number;
  is_available: boolean;
  quantity: number;
  is_master: boolean;
  image_url: string;
}

interface MenuCategory {
  category_name: string;
  master_category_id?: string;
  local_category_id?: string;
  items: MenuItem[];
}

export function BranchMenuManagementFeature() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5; // Giảm xuống 3 để dễ dàng thấy phân trang
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].category_name);
    }
  }, [categories, selectedCategory]);

  const { displayItems, totalPages } = React.useMemo(() => {
    const category = categories.find(
      (c) => c.category_name === selectedCategory,
    );
    if (!category) return { displayItems: [], totalPages: 0 };

    const items = category.items;
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return {
      displayItems: items.slice(startIndex, startIndex + ITEMS_PER_PAGE),
      totalPages,
    };
  }, [categories, selectedCategory, currentPage]);

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentPage(1);
  };

  // For Override Master Item Modal
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    item: MenuItem | null;
    is_available: boolean;
    quantity: number;
  }>({ isOpen: false, item: null, is_available: false, quantity: 0 });

  // For Local Item Modal (Edit only)
  const [editLocalItemModal, setEditLocalItemModal] = useState<{
    isOpen: boolean;
    item: Partial<MenuItem> | null;
  }>({ isOpen: false, item: null });

  const fetchBranchMenu = async () => {
    try {
      setIsLoading(true);
      const res = await http.get<{ data: MenuCategory[] }>("/manager/menus");
      setCategories(res.data);
    } catch (err) {
      setError(
        err instanceof AppError ? err.message : MANAGER_TEXTS.menus.errorFetch,
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchMenu();
  }, []);

  // --- Master Item Override Handlers ---
  const handleOpenOverride = (item: MenuItem) => {
    setOverrideModal({
      isOpen: true,
      item,
      is_available: item.is_available,
      quantity: Math.max(0, item.quantity),
    });
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal.item) return;
    try {
      await http.patch(
        `/manager/menus/master/${overrideModal.item._id}/override`,
        {
          is_available: overrideModal.is_available,
          quantity: overrideModal.quantity,
        },
      );
      setOverrideModal({ ...overrideModal, isOpen: false });
      toastSuccess("Cập nhật trạng thái món ăn thành công!");
      fetchBranchMenu();
    } catch (err) {
      toastError(
        err instanceof AppError ? err.message : MANAGER_TEXTS.menus.errorUpdate,
      );
    }
  };

  // --- Local Item Handlers ---
  const handleSaveEditLocalItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLocalItemModal.item) return;

    try {
      const payload = { ...editLocalItemModal.item };
      await http.put(`/manager/menus/local/${payload._id}`, payload);
      setEditLocalItemModal({ isOpen: false, item: null });
      toastSuccess("Cập nhật món ăn thành công!");
      fetchBranchMenu();
    } catch (err) {
      toastError(
        err instanceof AppError
          ? err.message
          : MANAGER_TEXTS.menus.errorSaveLocal,
      );
    }
  };

  const handleDeleteLocalItem = async (itemId: string) => {
    if (!confirm(MANAGER_TEXTS.menus.confirmDelete)) return;
    try {
      await http.delete(`/manager/menus/local/${itemId}`);
      toastSuccess("Đã xóa món ăn thành công!");
      fetchBranchMenu();
    } catch (err) {
      toastError(
        err instanceof AppError
          ? err.message
          : MANAGER_TEXTS.menus.errorDeleteLocal,
      );
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">
        {MANAGER_TEXTS.menus.loading}
      </div>
    );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {MANAGER_TEXTS.menus.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {MANAGER_TEXTS.menus.subtitle}
          </p>
        </div>
        <button
          onClick={() => router.push("/manager/menus/add-local")}
          className="flex items-center gap-2 px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {MANAGER_TEXTS.menus.addLocalBtn}
        </button>
      </div>

      {/* Tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 border-b border-gray-200 mb-2">
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
              }
            }}
            className="shrink-0 p-2 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div 
            ref={scrollContainerRef}
            className="flex-1 flex gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {categories.map((cat) => (
              <button
                key={cat.category_name}
                onClick={() => handleCategoryChange(cat.category_name)}
                className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  selectedCategory === cat.category_name
                    ? "border-[#ea580c] text-[#ea580c]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {cat.category_name}{" "}
                <span className="ml-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {cat.items.length}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
              }
            }}
            className="shrink-0 p-2 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {displayItems.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              {MANAGER_TEXTS.menus.emptyCategory}
            </div>
          ) : (
            displayItems.map((item) => (
              <div
                key={item._id}
                className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {item.name}
                        {item.is_master ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">
                            {MANAGER_TEXTS.menus.tagMaster}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">
                            {MANAGER_TEXTS.menus.tagLocal}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium mt-1">
                        {item.base_price.toLocaleString("vi-VN")}{" "}
                        {MANAGER_TEXTS.menus.currency}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {item.is_master ? (
                        <button
                          onClick={() => handleOpenOverride(item)}
                          className="px-3 py-1.5 text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-medium flex items-center gap-1 transition-colors"
                        >
                          <Power className="w-4 h-4" />{" "}
                          {MANAGER_TEXTS.menus.btnOverride}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              setEditLocalItemModal({ isOpen: true, item })
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLocalItem(item._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded font-bold ${item.is_available && item.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {item.is_available && item.quantity > 0
                        ? MANAGER_TEXTS.menus.statusAvailable
                        : MANAGER_TEXTS.menus.statusUnavailable}
                    </span>
                    <span className="text-gray-600 flex items-center gap-1 font-medium">
                      <Package className="w-4 h-4" />
                      {MANAGER_TEXTS.menus.stockPrefix} {item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 font-medium"
          >
            Trang trước
          </button>
          <span className="text-gray-600 font-medium px-4 bg-white border border-gray-200 py-2 rounded-lg">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 font-medium"
          >
            Trang sau
          </button>
        </div>
      )}

      {/* MODAL: Override Master Item */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-1">
              {MANAGER_TEXTS.menus.overrideModal.titlePrefix}{" "}
              {overrideModal.item?.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {MANAGER_TEXTS.menus.overrideModal.subtitle}
            </p>
            <form onSubmit={handleSaveOverride}>
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideModal.is_available}
                    onChange={(e) =>
                      setOverrideModal({
                        ...overrideModal,
                        is_available: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-[#ea580c] rounded focus:ring-[#ea580c]"
                  />
                  <span className="font-medium text-gray-900">
                    {MANAGER_TEXTS.menus.overrideModal.enableSelling}
                  </span>
                </label>
              </div>
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-1">
                  {MANAGER_TEXTS.menus.overrideModal.stockLabel}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={overrideModal.quantity}
                  onChange={(e) =>
                    setOverrideModal({
                      ...overrideModal,
                      quantity: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea580c] outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setOverrideModal({ ...overrideModal, isOpen: false })
                  }
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  {MANAGER_TEXTS.menus.overrideModal.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ea580c] text-white hover:bg-[#c2410c] rounded-lg font-medium"
                >
                  {MANAGER_TEXTS.menus.overrideModal.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Sửa Local Item (Cơ bản) */}
      {editLocalItemModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {MANAGER_TEXTS.menus.editLocalModal.title}
            </h2>
            <form onSubmit={handleSaveEditLocalItem}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {MANAGER_TEXTS.menus.editLocalModal.nameLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editLocalItemModal.item?.name || ""}
                    onChange={(e) =>
                      setEditLocalItemModal({
                        ...editLocalItemModal,
                        item: {
                          ...editLocalItemModal.item,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {MANAGER_TEXTS.menus.editLocalModal.descLabel}
                  </label>
                  <textarea
                    value={editLocalItemModal.item?.description || ""}
                    onChange={(e) =>
                      setEditLocalItemModal({
                        ...editLocalItemModal,
                        item: {
                          ...editLocalItemModal.item,
                          description: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {MANAGER_TEXTS.menus.editLocalModal.priceLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editLocalItemModal.item?.base_price || 0}
                    onChange={(e) =>
                      setEditLocalItemModal({
                        ...editLocalItemModal,
                        item: {
                          ...editLocalItemModal.item,
                          base_price: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {MANAGER_TEXTS.menus.editLocalModal.stockLabel}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editLocalItemModal.item?.quantity ?? 0}
                    onChange={(e) =>
                      setEditLocalItemModal({
                        ...editLocalItemModal,
                        item: {
                          ...editLocalItemModal.item,
                          quantity: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {MANAGER_TEXTS.menus.editLocalModal.linkLabel}
                  </label>
                  <input
                    type="url"
                    value={editLocalItemModal.item?.image_url || ""}
                    onChange={(e) =>
                      setEditLocalItemModal({
                        ...editLocalItemModal,
                        item: {
                          ...editLocalItemModal.item,
                          image_url: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={
                      MANAGER_TEXTS.menus.editLocalModal.linkPlaceholder
                    }
                  />
                </div>
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editLocalItemModal.item?.is_available ?? true}
                      onChange={(e) =>
                        setEditLocalItemModal({
                          ...editLocalItemModal,
                          item: {
                            ...editLocalItemModal.item,
                            is_available: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">
                      {MANAGER_TEXTS.menus.editLocalModal.enableSelling}
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    setEditLocalItemModal({ isOpen: false, item: null })
                  }
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  {MANAGER_TEXTS.menus.editLocalModal.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
                >
                  {MANAGER_TEXTS.menus.editLocalModal.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
