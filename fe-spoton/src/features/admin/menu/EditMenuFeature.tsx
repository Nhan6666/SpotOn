"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, ChevronRight, Check, ArrowLeft, ArrowRight, Lightbulb, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddMenuBasics } from './components/AddMenuBasics';
import { AddMenuMedia } from './components/AddMenuMedia';
import { AddMenuPricing } from './components/AddMenuPricing';
import { menuService } from './menu.service';
import { http } from '@/lib/http';
import { MenuItem } from './menu.types';

interface EditMenuFeatureProps {
  menuId: string;
  itemId: string;
}

export function EditMenuFeature({ menuId, itemId }: EditMenuFeatureProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Step 1 States
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // Step 2 States
  const [basePrice, setBasePrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [validityPeriod, setValidityPeriod] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [globalStatus, setGlobalStatus] = useState<'Active' | 'Draft'>('Active');

  // Step 3 States
  const [isCoreItem, setIsCoreItem] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

  // Load existing item data from /categories (returns full category docs with embedded items)
  useEffect(() => {
    const loadItem = async () => {
      try {
        const res = await http.get<{
          success: boolean;
          data: Array<{ _id: string; category_name: string; items: Array<MenuItem & { _id: string }> }>;
        }>('/categories');

        if (res?.data) {
          // Find the category matching menuId
          const category = res.data.find(cat => cat._id === menuId);
          // Find the specific item within that category
          const item = category?.items?.find(i => i._id === itemId);

          if (item) {
            setItemName(item.name);
            setSku(item.sku || '');
            setCategory(category?.category_name || '');
            setDescription(item.description || '');
            setBasePrice(String(item.base_price));
            setMinPrice(String(item.min_price ?? 0));
            setMaxPrice(String(item.max_price ?? item.base_price));
            setSelectedBranches(item.branches || []);
            setGlobalStatus(item.status === 'ACTIVE' ? 'Active' : 'Draft');
            setIsCoreItem(item.is_core_item);
            setSelectedTags(item.dietary_tags || []);
            if (item.image_url) {
              setExistingImageUrl(item.image_url);
              setImagePreview(item.image_url);
            }
          } else {
            console.error('Item not found for menuId:', menuId, 'itemId:', itemId);
          }
        }
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setIsLoadingItem(false);
      }
    };
    loadItem();
  }, [menuId, itemId]);

  const base = parseFloat(basePrice) || 0;
  const min = parseFloat(minPrice) || 0;
  const max = parseFloat(maxPrice) || 0;
  const isPriceRangeValid = min <= base && base <= max && min <= max;

  const STEPS = [
    { id: 1, label: 'Basic Details' },
    { id: 2, label: 'Pricing & Branches' },
    { id: 3, label: 'Media & Review' },
  ];

  const handleSave = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Upload new image if changed
      let finalImageUrl = existingImageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const token = typeof window !== 'undefined' ? localStorage.getItem('spoton_token') : null;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const uploadRes = await fetch(`${apiUrl}/uploads/menu`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.message || 'Upload ảnh thất bại.');
        }
        const uploadData = await uploadRes.json();
        const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
        finalImageUrl = `${backendUrl}${uploadData.data.url}`;
      }

      // Build update payload
      const mongoose = await import('mongoose').catch(() => null);
      const validBranches = selectedBranches.filter(id => {
        try { return id.length === 24; } catch { return false; }
      });

      await menuService.updateItem(menuId, itemId, {
        name: itemName,
        sku,
        description,
        base_price: parseFloat(basePrice),
        min_price: parseFloat(minPrice),
        max_price: parseFloat(maxPrice),
        is_core_item: isCoreItem,
        dietary_tags: selectedTags,
        status: globalStatus === 'Active' ? 'ACTIVE' : 'DRAFT',
        branches: validBranches,
        image_url: finalImageUrl,
      });

      router.push('/admin/menu');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi cập nhật món ăn. Vui lòng thử lại.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !isPriceRangeValid) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else handleSave();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.push('/admin/menu');
  };

  if (isLoadingItem) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e67e22]" />
        <p className="mt-4 text-gray-500 font-medium">Đang tải thông tin món ăn...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Top Navigation / Breadcrumb */}
      <div className="px-8 py-4 flex items-center text-sm border-b border-gray-100 bg-white">
        <Link href="/admin/menu" className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1.5 transition-colors">
          Menu Management
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400 mx-2" strokeWidth={2} />
        <span className="text-gray-500">{itemName}</span>
        <ChevronRight className="w-4 h-4 text-gray-400 mx-2" strokeWidth={2} />
        <span className="text-[#e67e22] font-bold">Edit Item</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto w-full px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-[28px] font-bold text-[#0f172a] tracking-tight">
                {currentStep === 3 ? 'Step 3: Media & Review' : 'Edit Menu Item'}
              </h1>
              <p className="text-[15px] text-[#64748b] mt-1">
                {currentStep === 3
                  ? 'Update the image and finalize configurations before saving.'
                  : `Chỉnh sửa thông tin cho "${itemName}".`}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between max-w-[800px] mx-auto mb-12 relative">
            <div className="absolute left-0 top-[16px] w-full h-[2px] bg-gray-200 -z-10 rounded-full" />
            {STEPS.map((step) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3 bg-[#f8fafc] px-4 cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
                    step.id === currentStep
                      ? 'bg-[#fffbf2] text-[#e67e22] border-2 border-[#e67e22]'
                      : step.id < currentStep
                        ? 'bg-[#e67e22] text-white border-2 border-[#e67e22]'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                  }`}>
                    {step.id < currentStep ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : step.id}
                  </div>
                  <span className={`text-[14px] font-bold ${step.id === currentStep || step.id < currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Main Content Layout */}
          <div className="flex items-start gap-8">
            {/* Left Column (Form) */}
            {currentStep === 1 && (
              <AddMenuBasics
                itemName={itemName} setItemName={setItemName}
                sku={sku} setSku={setSku}
                category={category} setCategory={setCategory}
                description={description} setDescription={setDescription}
              />
            )}

            {currentStep === 2 && (
              <AddMenuPricing
                basePrice={basePrice} setBasePrice={setBasePrice}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                hasDiscount={hasDiscount} setHasDiscount={setHasDiscount}
                discountPercentage={discountPercentage} setDiscountPercentage={setDiscountPercentage}
                validityPeriod={validityPeriod} setValidityPeriod={setValidityPeriod}
                selectedBranches={selectedBranches} setSelectedBranches={setSelectedBranches}
                globalStatus={globalStatus} setGlobalStatus={setGlobalStatus}
              />
            )}

            {currentStep === 3 && (
              <AddMenuMedia
                isCoreItem={isCoreItem} setIsCoreItem={setIsCoreItem}
                selectedTags={selectedTags} toggleTag={(tag) => {
                  setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                }}
                imageFile={imageFile} setImageFile={setImageFile}
                imagePreview={imagePreview} setImagePreview={setImagePreview}
              />
            )}

            {/* Right Column (Summary / Tips) */}
            <div className="w-[300px] shrink-0">
              {currentStep === 3 ? (
                <>
                  <div className="bg-[#fffbeb] rounded-xl overflow-hidden shadow-sm border border-[#fde68a] mb-6">
                    {imagePreview && (
                      <div className="relative w-full h-40 overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="bg-[#d97706] p-5">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">Item Summary</p>
                      <h3 className="text-[20px] font-bold text-white leading-tight">{itemName}</h3>
                    </div>
                    <div className="p-5 space-y-4 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500">Danh mục</span>
                        <span className="text-[12px] font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">{category}</span>
                      </div>
                      <div className="h-px w-full bg-gray-100" />
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500">Base Price</span>
                        <span className="text-[14px] font-bold text-[#d97706]">{parseInt(basePrice || '0').toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="h-px w-full bg-gray-100" />
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500">Chi nhánh</span>
                        <span className="text-[12px] font-bold text-[#d97706]">{selectedBranches.length} chi nhánh</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-5 h-5 text-[#f59e0b]" strokeWidth={2.5} />
                      <h3 className="text-[15px] font-bold text-[#92400e]">Lưu ý khi sửa ảnh</h3>
                    </div>
                    <p className="text-[12px] text-[#b45309] leading-relaxed">
                      Nếu bạn không chọn ảnh mới, ảnh cũ sẽ được giữ nguyên. Chọn ảnh mới để thay thế toàn bộ ảnh hiện tại.
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5 sticky top-8">
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Lightbulb className="w-4 h-4 text-[#f59e0b]" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#92400e]">Pro Tips</h3>
                  </div>
                  {currentStep === 1 ? (
                    <div className="text-[12px] text-[#b45309] leading-relaxed space-y-3">
                      <p>Cập nhật tên món ăn sẽ được đồng bộ ngay ra trang menu công khai sau khi lưu.</p>
                      <p>Thay đổi danh mục sẽ di chuyển món ăn sang nhóm danh mục mới.</p>
                    </div>
                  ) : (
                    <div className="text-[12px] text-[#b45309] leading-relaxed space-y-3">
                      <p>Thay đổi giá sẽ áp dụng ngay lập tức tại tất cả các chi nhánh đã chọn.</p>
                      <p>Hệ thống sẽ cảnh báo nếu có chi nhánh đang bán ngoài khoảng giá mới.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-center z-10">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting}
          className="bg-gray-50 border-none text-gray-900 hover:bg-gray-100 px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          {currentStep > 1 ? `Back to Step ${currentStep - 1}` : 'Back'}
        </Button>

        <div className="flex items-center gap-4">
          {submitError && (
            <span className="text-[13px] text-red-500 font-medium max-w-[300px] text-right">{submitError}</span>
          )}
          <Button
            onClick={handleNext}
            disabled={(currentStep === 2 && !isPriceRangeValid) || isSubmitting}
            className={`px-8 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 ${
              (currentStep === 2 && !isPriceRangeValid) || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#d97706] hover:bg-[#b45309] text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : currentStep === 3 ? (
              <>
                <Save className="w-4 h-4" strokeWidth={2.5} />
                Lưu Thay Đổi
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
