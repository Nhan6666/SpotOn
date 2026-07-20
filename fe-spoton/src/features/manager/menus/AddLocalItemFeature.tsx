"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { http } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { UploadCloud, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { MANAGER_TEXTS } from '@/constants/texts/manager';
import { useToast } from '@/components/ui/Toast';

interface MenuCategory {
  category_name: string;
}

interface UserContext {
  branch_id?: string;
}

export function AddLocalItemFeature() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);

  // Form Data Step 1
  const [formData, setFormData] = useState({
    name: '',
    category_name: '',
    description: '',
    base_price: 0,
    quantity: 0,
    is_available: true,
  });

  // Form Data Step 2
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Lấy danh sách danh mục để Manager chọn
    const fetchCategories = async () => {
      try {
        const res = await http.get<{ data: MenuCategory[] }>('/manager/menus');
        setCategories(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, category_name: res.data[0].category_name }));
        }
      } catch (error) {
        console.error(MANAGER_TEXTS.menus.addLocalItem.errorFetch, error);
      }
    };
    fetchCategories();
  }, []);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.quantity < 0) {
        toastError(MANAGER_TEXTS.menus.addLocalItem.errorNegativeStock);
        return;
      }
      if (!formData.category_name) {
        toastError(MANAGER_TEXTS.menus.addLocalItem.errorNoCategory);
        return;
      }

      // 1. Tạo món ăn (chưa có ảnh)
      const res = await http.post<{ data: { _id: string } }>('/manager/menus/local', formData);
      setCreatedItemId(res.data._id);
      
      // Chuyển sang bước 2
      setStep(2);
    } catch (error) {
      toastError(error instanceof AppError ? error.message : MANAGER_TEXTS.menus.addLocalItem.errorCreateItem);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !createdItemId) return;

    try {
      setIsUploading(true);
      
      // 1. Lấy thông tin user để lấy branch_id làm "tên chi nhánh" cho folder Cloudinary
      const userRes = await http.get<{ data: UserContext }>('/auth/me');
      const branchName = userRes.data?.branch_id || 'local-branch';

      // 2. Upload ảnh lên Cloudinary
      const uploadData = new FormData();
      uploadData.append('image', selectedFile);
      uploadData.append('category', formData.category_name);
      uploadData.append('itemName', formData.name);
      uploadData.append('branchName', branchName); // Custom path: /SpotOn/[branchName]/menu/[category]/[name]/

      const uploadRes = await http.post<{ data: { url: string } }>('/uploads/menu', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = uploadRes.data.url;

      // 3. Update lại món ăn với image_url (PUT request)
      await http.put(`/manager/menus/local/${createdItemId}`, { image_url: imageUrl });

      toastSuccess(MANAGER_TEXTS.menus.addLocalItem.successAlert);
      router.push('/manager/menus'); // Quay lại trang quản lý menu
    } catch (error) {
      toastError(error instanceof AppError ? error.message : MANAGER_TEXTS.menus.addLocalItem.errorUpload);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Progress Bar */}
      <div className="flex border-b border-gray-200">
        <div className={`flex-1 py-4 text-center font-bold text-sm ${step === 1 ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 bg-gray-50'}`}>
          {MANAGER_TEXTS.menus.addLocalItem.step1Title}
        </div>
        <div className={`flex-1 py-4 text-center font-bold text-sm ${step === 2 ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 bg-gray-50'}`}>
          {MANAGER_TEXTS.menus.addLocalItem.step2Title}
        </div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="max-w-2xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{MANAGER_TEXTS.menus.addLocalItem.nameLabel} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{MANAGER_TEXTS.menus.addLocalItem.categoryLabel} <span className="text-red-500">*</span></label>
              <select
                value={formData.category_name}
                onChange={e => setFormData({ ...formData, category_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="" disabled>{MANAGER_TEXTS.menus.addLocalItem.categoryPlaceholder}</option>
                {categories.map(c => (
                  <option key={c.category_name} value={c.category_name}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{MANAGER_TEXTS.menus.addLocalItem.descLabel}</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{MANAGER_TEXTS.menus.addLocalItem.priceLabel} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={formData.base_price}
                  onChange={e => setFormData({ ...formData, base_price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{MANAGER_TEXTS.menus.addLocalItem.stockLabel} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900">{MANAGER_TEXTS.menus.addLocalItem.showAfterCreate}</span>
              </label>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="button" onClick={() => router.push('/manager/menus')} className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium mr-3">{MANAGER_TEXTS.menus.addLocalItem.cancelBtn}</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2">
                {MANAGER_TEXTS.menus.addLocalItem.nextBtn} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="max-w-xl mx-auto space-y-6 text-center">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 justify-center mb-6">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{MANAGER_TEXTS.menus.addLocalItem.savedInfoPrefix} {formData.name}</span>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-colors bg-gray-50">
              <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">{MANAGER_TEXTS.menus.addLocalItem.uploadTitle}</h3>
              <p className="text-sm text-gray-500 mb-6">{MANAGER_TEXTS.menus.addLocalItem.uploadDesc}</p>
              
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/jpeg, image/png, image/webp"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="file-upload" className="px-6 py-2 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer inline-block">
                {MANAGER_TEXTS.menus.addLocalItem.chooseFileBtn}
              </label>

              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium border border-blue-100">
                  {MANAGER_TEXTS.menus.addLocalItem.selectedPrefix} {selectedFile.name}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => {
                  toastSuccess(MANAGER_TEXTS.menus.addLocalItem.skipUploadAlert);
                  router.push('/manager/menus');
                }}
                className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
              >
                {MANAGER_TEXTS.menus.addLocalItem.skipBtn}
              </button>
              
              <button 
                type="submit" 
                disabled={!selectedFile || isUploading}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? MANAGER_TEXTS.menus.addLocalItem.uploadingBtn : MANAGER_TEXTS.menus.addLocalItem.finishBtn}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
