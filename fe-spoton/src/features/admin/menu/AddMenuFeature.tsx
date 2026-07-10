"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, Info, Lightbulb, Type, FileText, Tags, ChevronRight, UtensilsCrossed, Check, ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddMenuBasics } from './components/AddMenuBasics';
import { AddMenuMedia } from './components/AddMenuMedia';
import { AddMenuPricing } from './components/AddMenuPricing';
import { useMenuContext } from './menu.context';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

export function AddMenuFeature() {
  const router = useRouter();
  const { categories, addItem, createCategory, fetchMasterMenu } = useMenuContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  useEffect(() => {
    fetchMasterMenu();
  }, [fetchMasterMenu]);

  // Step 1 States
  const [itemName, setItemName] = useState('Signature Beef Pho');
  const [sku, setSku] = useState('ITM-PHO-001');
  const [category, setCategory] = useState('Main Courses');
  const [description, setDescription] = useState('A rich, slow-simmered 24-hour bone broth poured over fresh rice noodles, topped with premium rare steak slices, basil, and lime.');

  // Step 2 States
  const [basePrice, setBasePrice] = useState('125000');
  const [minPrice, setMinPrice] = useState('100000');
  const [maxPrice, setMaxPrice] = useState('150000');
  const [hasDiscount, setHasDiscount] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState('15');
  const [validityPeriod, setValidityPeriod] = useState('Launch Month (30 Days)');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [globalStatus, setGlobalStatus] = useState<'Active' | 'Draft'>('Active');

  // BR-01: price validation — block Next on step 2 if violated
  const base = parseFloat(basePrice) || 0;
  const min = parseFloat(minPrice) || 0;
  const max = parseFloat(maxPrice) || 0;
  const isPriceRangeValid = min <= base && base <= max && min <= max;

  // Step 3 States
  const [isCoreItem, setIsCoreItem] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['chef', 'spicy', 'gluten']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const STEPS = [
    { id: 1, label: ADMIN_TEXTS.menu.addStep1 },
    { id: 2, label: ADMIN_TEXTS.menu.addStep2 },
    { id: 3, label: ADMIN_TEXTS.menu.addStep3 },
  ];

  const handlePublish = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Step 1: Upload image if provided
      let uploadedImageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('category', category);
        formData.append('itemName', itemName);
        formData.append('image', imageFile);

        const token = typeof window !== 'undefined' ? localStorage.getItem('spoton_token') : null;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        
        const uploadRes = await fetch(`${apiUrl}/uploads/menu`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.message || ADMIN_TEXTS.menu.addUploadError);
        }

        const uploadData = await uploadRes.json();
        // Cloudinary returns an absolute URL
        uploadedImageUrl = uploadData.data.url;
      }

      // Step 2: Find or create the category
      let menuId: string;
      const existing = categories.find(c => c.category_name === category);
      if (existing) {
        menuId = existing._id;
      } else {
        menuId = await createCategory(category);
      }

      // Step 3: Build payload with image URL
      const payload = {
        name: itemName,
        sku,
        description,
        base_price: parseFloat(basePrice),
        min_price: parseFloat(minPrice),
        max_price: parseFloat(maxPrice),
        is_core_item: isCoreItem,
        dietary_tags: selectedTags,
        status: globalStatus === 'Active' ? 'ACTIVE' as const : 'DRAFT' as const,
        branches: selectedBranches,
        image_url: uploadedImageUrl,
      };

      await addItem(menuId, payload);
      router.push('/admin/menu');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_TEXTS.menu.addCreateError;
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !isPriceRangeValid) return; // guard BR-01
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else handlePublish();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.push('/admin/menu');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Top Navigation / Breadcrumb */}
      <div className="px-8 py-4 flex items-center text-sm border-b border-gray-100 bg-white">
        <Link href="/admin/menu" className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1.5 transition-colors">
          {ADMIN_TEXTS.menu.addBreadcrumbParent}
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400 mx-2" strokeWidth={2} />
        <span className="text-[#e67e22] font-bold">{ADMIN_TEXTS.menu.addBreadcrumbChild}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto w-full px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              {currentStep === 3 ? (
              <>
                  <h1 className="text-[28px] font-bold text-[#0f172a] tracking-tight">{ADMIN_TEXTS.menu.addStep3Title}</h1>
                  <p className="text-[15px] text-[#64748b] mt-1">{ADMIN_TEXTS.menu.addStep3Desc}</p>
                </>
              ) : (
                <>
                  <h1 className="text-[28px] font-bold text-[#0f172a] tracking-tight">{ADMIN_TEXTS.menu.addTitle}</h1>
                  <p className="text-[15px] text-[#64748b] mt-1">{ADMIN_TEXTS.menu.addDesc}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                {ADMIN_TEXTS.menu.addBtnDraft}
              </Button>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between max-w-[800px] mx-auto mb-12 relative">
            <div className="absolute left-0 top-[16px] w-full h-[2px] bg-gray-200 -z-10 rounded-full"></div>
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3 bg-[#f8fafc] px-4 cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${step.id === currentStep
                    ? 'bg-[#fffbf2] text-[#e67e22] border-2 border-[#e67e22]'
                    : step.id < currentStep
                      ? 'bg-[#e67e22] text-white border-2 border-[#e67e22]'
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}>
                    {step.id < currentStep ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : step.id}
                  </div>
                  <span className={`text-[14px] font-bold ${step.id === currentStep || step.id < currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}>
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

            {/* Right Column (Tips / Summary) */}
            <div className="w-[300px] shrink-0">
              {currentStep === 3 ? (
                <>
                  <div className="bg-[#fffbeb] rounded-xl overflow-hidden shadow-sm border border-[#fde68a] mb-6">
                    {/* Image preview in summary */}
                    {imagePreview && (
                      <div className="relative w-full h-40 overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="bg-[#d97706] p-5">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">{ADMIN_TEXTS.menu.addFinalSummary}</p>
                      <h3 className="text-[20px] font-bold text-white leading-tight">{itemName}</h3>
                    </div>

                    <div className="p-5 space-y-5 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500">{ADMIN_TEXTS.menu.addCategory}</span>
                        <span className="text-[12px] font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">{category}</span>
                      </div>

                      <div className="h-px w-full bg-gray-100"></div>

                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500">{ADMIN_TEXTS.menu.addBasePrice}</span>
                        <span className="text-[14px] font-bold text-[#d97706]">{parseInt(basePrice).toLocaleString('vi-VN')} VND</span>
                      </div>

                      <div className="h-px w-full bg-gray-100"></div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] text-gray-500">{ADMIN_TEXTS.menu.addActiveBranches}</span>
                          <span className="text-[12px] font-bold text-[#d97706]">{selectedBranches.length} Branches</span>
                        </div>
                        <div className="space-y-2">
                          {selectedBranches.includes('1') && (
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-[12px] font-bold text-gray-700">Downtown Central</span>
                            </div>
                          )}
                          {selectedBranches.includes('3') && (
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-[12px] font-bold text-gray-700">Riverside</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5 sticky top-8">
                    <div className="flex items-center gap-3 mb-5">
                      <Lightbulb className="w-5 h-5 text-[#f59e0b]" strokeWidth={2.5} />
                      <h3 className="text-[15px] font-bold text-[#92400e]">{ADMIN_TEXTS.menu.addProTips}</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">{ADMIN_TEXTS.menu.addTipPhotoTitle}</h4>
                        <p className="text-[12px] text-gray-500 leading-relaxed">
                          {ADMIN_TEXTS.menu.addTipPhotoDesc}
                        </p>
                      </div>
                      <div className="h-px bg-[#fde68a] w-full"></div>
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">{ADMIN_TEXTS.menu.addTipDietTitle}</h4>
                        <p className="text-[12px] text-gray-500 leading-relaxed">
                          {ADMIN_TEXTS.menu.addTipDietDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5 sticky top-8">
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Lightbulb className="w-4 h-4 text-[#f59e0b]" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#92400e]">{ADMIN_TEXTS.menu.addProTips}</h3>
                    </div>
                  </div>

                  {currentStep === 1 ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[12px] text-[#b45309] mb-3">{ADMIN_TEXTS.menu.addTipOptimize}</p>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-[#fef3c7] mb-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Type className="w-3.5 h-3.5 text-[#d97706]" strokeWidth={2.5} />
                            <h4 className="text-[13px] font-bold text-gray-900">{ADMIN_TEXTS.menu.addTipNameTitle}</h4>
                          </div>
                          <p className="text-[12px] text-gray-500 leading-relaxed">
                            {ADMIN_TEXTS.menu.addTipNameDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-[13px] font-bold text-gray-900 mb-1">{ADMIN_TEXTS.menu.addTipPriceTitle}</h4>
                        <p className="text-[12px] text-gray-500 leading-relaxed">
                          {ADMIN_TEXTS.menu.addTipPriceDesc}
                        </p>
                      </div>
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
          {currentStep > 1 ? `${ADMIN_TEXTS.menu.addBtnBackStep}${currentStep - 1}` : ADMIN_TEXTS.menu.addBtnBack}
        </Button>

        <div className="flex items-center gap-4">
          {submitError && (
            <span className="text-[13px] text-red-500 font-medium">{submitError}</span>
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
                {ADMIN_TEXTS.menu.addBtnPublishing}
              </>
            ) : currentStep === 3 ? ADMIN_TEXTS.menu.addBtnPublish : ADMIN_TEXTS.menu.addBtnNext}
          </Button>
        </div>
      </div>
    </div>
  );
}
