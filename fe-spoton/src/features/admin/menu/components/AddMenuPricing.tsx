import React, { useMemo, useEffect, useState } from 'react';
import { Banknote, Tag, Target, Globe, Check, AlertCircle } from 'lucide-react';
import { http } from '@/lib/http';
import { Branch } from '../../branch-management/branch-management.types';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

interface AddMenuPricingProps {
  basePrice: string;
  setBasePrice: (val: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  hasDiscount: boolean;
  setHasDiscount: (val: boolean) => void;
  discountPercentage: string;
  setDiscountPercentage: (val: string) => void;
  validityPeriod: string;
  setValidityPeriod: (val: string) => void;
  selectedBranches: string[];
  setSelectedBranches: (val: string[]) => void;
  globalStatus: 'Active' | 'Draft';
  setGlobalStatus: (val: 'Active' | 'Draft') => void;
}

export function AddMenuPricing({
  basePrice, setBasePrice,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  hasDiscount, setHasDiscount,
  discountPercentage, setDiscountPercentage,
  validityPeriod, setValidityPeriod,
  selectedBranches, setSelectedBranches,
  globalStatus, setGlobalStatus,
}: AddMenuPricingProps) {
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await http.get<{success: boolean, data: Branch[]}>('/branches');
        if (res?.data) {
          setBranches(res.data);
        }
      } catch (error) {
        console.error(ADMIN_TEXTS.menu.pricingFetchError, error);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // BR-01: Min <= Base <= Max
  const priceErrors = useMemo(() => {
    const errs: { base?: string; min?: string; max?: string } = {};
    const b = parseFloat(basePrice) || 0;
    const mn = parseFloat(minPrice) || 0;
    const mx = parseFloat(maxPrice) || 0;

    if (minPrice && maxPrice && mn > mx)
      errs.min = ADMIN_TEXTS.menu.pricingErrMinMax;
    if (basePrice && minPrice && b < mn) {
      errs.base = ADMIN_TEXTS.menu.pricingErrBaseMin;
      errs.min = errs.min || ADMIN_TEXTS.menu.pricingErrMinBase;
    }
    if (basePrice && maxPrice && b > mx) {
      errs.base = (errs.base ? errs.base + ' ' : '') + ADMIN_TEXTS.menu.pricingErrBaseMax;
      errs.max = ADMIN_TEXTS.menu.pricingErrMaxBase;
    }
    return errs;
  }, [basePrice, minPrice, maxPrice]);

  const hasError = Object.keys(priceErrors).length > 0;

  const base = parseFloat(basePrice) || 0;
  const min = parseFloat(minPrice) || 0;
  const max = parseFloat(maxPrice) || 0;

  const inputCls = (hasErr?: string) =>
    `w-full pl-14 pr-4 py-3 bg-white border rounded-lg text-sm font-medium focus:outline-none focus:ring-1 transition-shadow ${hasErr
      ? 'border-red-400 focus:border-red-500 focus:ring-red-300'
      : 'border-gray-200 focus:border-amber-500 focus:ring-amber-500'
    }`;

  const toggleBranch = (id: string) => {
    if (selectedBranches.includes(id)) {
      setSelectedBranches(selectedBranches.filter((b) => b !== id));
    } else {
      setSelectedBranches([...selectedBranches, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedBranches.length === branches.length && branches.length > 0) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(branches.map((b) => b._id));
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 mb-24">

      {/* Pricing & Branch Override Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="text-[#e67e22]">
            <Banknote className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h2 className="text-[17px] font-bold text-gray-900">{ADMIN_TEXTS.menu.pricingTitle}</h2>
        </div>
        <p className="text-[13px] text-gray-500 mb-6 ml-9">
          {ADMIN_TEXTS.menu.pricingDesc}
        </p>

        {/* BR-01 error banner */}
        {hasError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-[13px] font-bold text-red-700 mb-0.5">{ADMIN_TEXTS.menu.pricingBr01Title}</p>
              <p className="text-[12px] text-red-600">
                {ADMIN_TEXTS.menu.pricingBr01Desc}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {/* Min Price */}
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">
              {ADMIN_TEXTS.menu.pricingMinPrice} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm font-medium">VND</span>
              </div>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className={inputCls(priceErrors.min)}
              />
            </div>
            {priceErrors.min && (
              <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {priceErrors.min}
              </p>
            )}
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">
              {ADMIN_TEXTS.menu.pricingBasePrice} <span className="text-red-500">*</span>
              <span className="ml-2 text-[11px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{ADMIN_TEXTS.menu.pricingGlobalDefault}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm font-medium">VND</span>
              </div>
              <input
                type="number"
                placeholder="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={inputCls(priceErrors.base)}
              />
            </div>
            {priceErrors.base && (
              <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {priceErrors.base}
              </p>
            )}
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">
              {ADMIN_TEXTS.menu.pricingMaxPrice} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm font-medium">VND</span>
              </div>
              <input
                type="number"
                placeholder="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={inputCls(priceErrors.max)}
              />
            </div>
            {priceErrors.max && (
              <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {priceErrors.max}
              </p>
            )}
          </div>
        </div>

        {/* Visual range indicator */}
        {!hasError && basePrice && minPrice && maxPrice && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-[12px] font-bold text-gray-500 mb-2 uppercase tracking-wider">{ADMIN_TEXTS.menu.pricingOverrideRange}</p>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-gray-500 w-24 text-right">{parseInt(minPrice).toLocaleString('vi-VN')}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full relative">
                <div className="absolute h-2 bg-amber-200 rounded-full left-0 right-0" />
                <div
                  className="absolute w-3 h-3 bg-amber-600 rounded-full -top-0.5 shadow-sm border-2 border-white"
                  style={{ left: max > min ? `${((base - min) / (max - min)) * 100}%` : '50%', transform: 'translateX(-50%)' }}
                />
              </div>
              <span className="text-[12px] text-gray-500 w-24">{parseInt(maxPrice).toLocaleString('vi-VN')}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 text-center">
              {ADMIN_TEXTS.menu.pricingBasePrice} <strong className="text-amber-700">{parseInt(basePrice).toLocaleString('vi-VN')} VND</strong> {ADMIN_TEXTS.menu.pricingWithinRangeInfo}
            </p>
          </div>
        )}

        <p className="text-[12px] text-gray-400 mt-4 pt-4 border-t border-gray-50">
          {ADMIN_TEXTS.menu.pricingAdjustInfo}
        </p>
      </div>

      {/* Branch Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="text-[#e67e22]">
              <Target className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h2 className="text-[17px] font-bold text-gray-900">{ADMIN_TEXTS.menu.pricingBranchDist}</h2>
          </div>
          <button onClick={handleSelectAll} className="text-[13px] font-bold text-[#e67e22] hover:text-[#d67118] transition-colors">
            {ADMIN_TEXTS.menu.pricingBtnSelectAll}
          </button>
        </div>
        <p className="text-[13px] text-gray-500 mb-6">{ADMIN_TEXTS.menu.pricingSelectInfo}</p>

        <div className="grid grid-cols-2 gap-4">
          {isLoadingBranches ? (
            <div className="col-span-2 py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#e67e22]"></div>
            </div>
          ) : branches.length === 0 ? (
            <div className="col-span-2 text-center py-4 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">{ADMIN_TEXTS.menu.pricingNoBranches}</div>
          ) : branches.map((branch) => {
            const isSelected = selectedBranches.includes(branch._id);
            return (
              <div
                key={branch._id}
                onClick={() => toggleBranch(branch._id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-[#f59e0b] bg-[#fffbf2]' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="pr-2">
                    <h3 className="text-[14px] font-bold text-gray-900 line-clamp-1" title={branch.name}>{branch.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${branch.status === 'OPEN' ? 'bg-emerald-500' : branch.status === 'CLOSED' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                      <span className="text-[12px] font-medium text-gray-500 line-clamp-1" title={typeof branch.address === 'object' ? branch.address.full : branch.address}>{typeof branch.address === 'object' ? branch.address.district : branch.address || branch.status}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full border-2 border-[#f59e0b] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#f59e0b]" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Availability */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="text-[#e67e22] mt-0.5">
            <Globe className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">{ADMIN_TEXTS.menu.pricingGlobalAvailTitle}</h2>
            <p className="text-[13px] text-gray-500 mt-1 max-w-[280px]">{ADMIN_TEXTS.menu.pricingGlobalAvailDesc}</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setGlobalStatus('Active')}
            className={`px-6 py-2 rounded-md text-[13px] font-bold transition-all ${globalStatus === 'Active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {ADMIN_TEXTS.menu.pricingBtnActive}
          </button>
          <button
            onClick={() => setGlobalStatus('Draft')}
            className={`px-6 py-2 rounded-md text-[13px] font-bold transition-all ${globalStatus === 'Draft' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {ADMIN_TEXTS.menu.pricingBtnDraft}
          </button>
        </div>
      </div>
    </div>
  );
}
