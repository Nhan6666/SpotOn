"use client";

import React, { useEffect, useState } from 'react';
import { http } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface MenuCategory {
  _id: string;
  category_name: string;
  items: unknown[];
}

export function CategoryManagementFeature() {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'admin.categories.title': 'Quản Lý Danh Mục',
      'admin.categories.description': 'Thêm, sửa, xóa các danh mục thực đơn của nhà hàng.',
      'admin.categories.addCategory': 'Thêm Danh Mục',
      'admin.categories.editCategory': 'Sửa',
      'admin.categories.deleteCategory': 'Xóa',
      'admin.categories.categoryName': 'Tên danh mục',
      'admin.categories.categoryNamePlaceholder': 'VD: Khai vị',
      'admin.categories.itemCount': 'Số món',
      'admin.categories.actions': 'Thao tác',
      'admin.categories.confirmDelete': 'Bạn có chắc chắn muốn xóa danh mục này không?',
      'admin.categories.createSuccess': 'Tạo danh mục thành công',
      'admin.categories.updateSuccess': 'Cập nhật danh mục thành công',
      'admin.categories.deleteSuccess': 'Xóa danh mục thành công',
      'admin.categories.empty': 'Chưa có danh mục nào.',
      'common.cancel': 'Hủy',
      'common.confirm': 'Xác nhận',
      'common.saving': 'Đang lưu...',
      'common.loading': 'Đang tải...',
      'common.error.generic': 'Có lỗi xảy ra. Vui lòng thử lại.'
    };
    return map[key] || key;
  };

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
        setError(t('common.error.generic'));
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
      } else {
        await http.post('/categories', { category_name: categoryName });
      }
      handleCloseForm();
      fetchCategories();
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message);
      } else {
        setError(t('common.error.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      setError(null);
      await http.delete(`/categories/${id}`);
      setDeleteConfirmId(null);
      fetchCategories();
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message);
      } else {
        setError(t('common.error.generic'));
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.categories.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin.categories.description')}</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {t('admin.categories.addCategory')}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? t('admin.categories.editCategory') : t('admin.categories.addCategory')}
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.categories.categoryName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('admin.categories.categoryNamePlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSubmitting ? t('common.saving') : t('common.confirm')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('admin.categories.empty')}</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">{t('admin.categories.categoryName')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">{t('admin.categories.itemCount')}</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">{t('admin.categories.actions')}</th>
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
                    {deleteConfirmId === category._id ? (
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-sm text-red-600 font-medium">Xác nhận xóa?</span>
                        <button
                          onClick={() => confirmDelete(category._id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
                        >
                          Có
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenForm(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2 inline-flex"
                          title={t('admin.categories.editCategory')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if ((category.items?.length || 0) > 0) {
                              setError("Không thể xóa danh mục đang có món ăn!");
                              return;
                            }
                            setDeleteConfirmId(category._id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          title={t('admin.categories.deleteCategory')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
