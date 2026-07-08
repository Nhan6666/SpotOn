"use client";

import React, { useEffect, useState } from 'react';
import { http } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ADMIN_TEXTS } from '@/constants/texts/admin';
import { COMMON_TEXTS } from '@/constants/texts/common';
import { useToast } from '@/components/ui/Toast';

interface MenuCategory {
  _id: string;
  category_name: string;
  items: unknown[];
}

export function CategoryManagementFeature() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<MenuCategory | null>(null);
  const { success, error: toastError } = useToast();
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await http.get<{ success: boolean; data: MenuCategory[] }>('/categories');
      if (res?.data) {
        setCategories(res.data);
      }
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchCategories();
    };
    load();
  }, []);

  const handleOpenForm = (category?: MenuCategory) => {
    if (category) {
      setEditingId(category._id);
      setCategoryName(category.category_name);
    } else {
      setEditingId(null);
      setCategoryName('');
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setCategoryName('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        await http.put(`/categories/${editingId}`, { category_name: categoryName });
        success('Cập nhật danh mục thành công!');
      } else {
        await http.post('/categories', { category_name: categoryName });
        success('Thêm danh mục mới thành công!');
      }
      handleCloseForm();
      fetchCategories();
    } catch (err) {
      if (err instanceof AppError) {
        toastError(err.message);
      } else {
        toastError('Có lỗi xảy ra');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      setError(null);
      await http.delete(`/categories/${id}`);
      setDeleteCategory(null);
      success('Đã xóa danh mục thành công!');
      fetchCategories();
    } catch (err) {
      if (err instanceof AppError) {
        toastError(err.message);
      } else {
        toastError('Có lỗi xảy ra khi xóa');
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{ADMIN_TEXTS.categories.title}</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">{ADMIN_TEXTS.categories.description}</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          {ADMIN_TEXTS.categories.addCategory}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-3">
              {editingId ? ADMIN_TEXTS.categories.editCategory : ADMIN_TEXTS.categories.addCategory}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 uppercase tracking-widest">
                  {ADMIN_TEXTS.categories.categoryName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder={ADMIN_TEXTS.categories.categoryNamePlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-shadow"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {COMMON_TEXTS.btnCancel || 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? (COMMON_TEXTS.btnSaving || 'Đang lưu...') : (COMMON_TEXTS.btnConfirm || 'Lưu')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Xác nhận xóa danh mục?</h2>
            <p className="text-gray-600 text-sm mb-6">Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-gray-900">"{deleteCategory.category_name}"</span> không? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteCategory(null)}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => confirmDelete(deleteCategory._id)}
                className="px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                Xóa Danh Mục
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{COMMON_TEXTS.loading}</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{ADMIN_TEXTS.categories.empty}</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">{ADMIN_TEXTS.categories.categoryName}</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">{ADMIN_TEXTS.categories.itemCount}</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-right">{ADMIN_TEXTS.categories.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{category.category_name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {category.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <>
                      <button
                          onClick={() => handleOpenForm(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2 inline-flex cursor-pointer"
                          title={ADMIN_TEXTS.categories.editCategory}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if ((category.items?.length || 0) > 0) {
                              toastError(ADMIN_TEXTS.categories.errorNotEmpty);
                              return;
                            }
                            setDeleteCategory(category);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex cursor-pointer"
                          title={ADMIN_TEXTS.categories.deleteCategory}
                        >
                          <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
