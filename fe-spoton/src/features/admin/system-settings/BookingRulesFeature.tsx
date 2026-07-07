"use client";

import React, { useEffect, useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { BookingRules } from './system-settings.types';
import { systemSettingsService } from './system-settings.service';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

export function BookingRulesFeature() {
  const [rules, setRules] = useState<BookingRules>({
    deposit_percent: 30,
    min_advance_hours: 2,
    max_advance_days: 30,
    max_party_size: 20,
    service_periods: {
      lunch: { start: '08:00', end: '13:00', last_booking: '12:00', last_order: '12:30' },
      dinner: { start: '15:00', end: '23:00', last_booking: '22:00', last_order: '22:30' }
    },
    no_show_minutes: 30
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await systemSettingsService.getBookingRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load booking rules:', err);
      showError(ADMIN_TEXTS.settings.errLoadRules);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Validate và mở Modal xác nhận
  const handleSave = () => {
    if (rules.deposit_percent < 0 || rules.deposit_percent > 100) {
      showError(ADMIN_TEXTS.settings.errDepositRange);
      return;
    }
    if (rules.min_advance_hours < 0 || rules.max_advance_days <= 0 || rules.max_party_size <= 0) {
      showError(ADMIN_TEXTS.settings.errInvalidValues);
      return;
    }
    // BR: Two-Step Confirmation — Mở modal xác nhận trước khi lưu
    setShowConfirmModal(true);
  };

  // Step 2: Xác nhận và thực sự lưu
  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      const updatedData = await systemSettingsService.updateBookingRules(rules);
      setRules(updatedData);
      success(ADMIN_TEXTS.settings.successSaveRules);
    } catch (err) {
      console.error('Failed to save booking rules:', err);
      showError(ADMIN_TEXTS.settings.errSaveRules);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: keyof BookingRules, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setRules(prev => ({ ...prev, [key]: numValue }));
    } else if (value === '') {
      // Allow empty temporarily while typing
      setRules(prev => ({ ...prev, [key]: 0 }));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">{ADMIN_TEXTS.settings.loadingConfig}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 flex flex-col gap-6 px-4 xl:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{ADMIN_TEXTS.settings.title}</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">{ADMIN_TEXTS.settings.subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{ADMIN_TEXTS.settings.globalPolicyTitle}</h2>
              <p className="text-sm text-gray-500">{ADMIN_TEXTS.settings.globalPolicyDesc}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Deposit Percent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-gray-100">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">{ADMIN_TEXTS.settings.lblDeposit}</label>
                <p className="text-xs text-gray-500">{ADMIN_TEXTS.settings.descDeposit}</p>
              </div>
              <div className="sm:col-span-2">
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={rules.deposit_percent}
                    onChange={(e) => handleChange('deposit_percent', e.target.value)}
                    className="pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Min Advance Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-gray-100">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">{ADMIN_TEXTS.settings.lblMinAdvance}</label>
                <p className="text-xs text-gray-500">{ADMIN_TEXTS.settings.descMinAdvance}</p>
              </div>
              <div className="sm:col-span-2">
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min="0"
                    value={rules.min_advance_hours}
                    onChange={(e) => handleChange('min_advance_hours', e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">giờ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Max Advance Days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-gray-100">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">{ADMIN_TEXTS.settings.lblMaxAdvance}</label>
                <p className="text-xs text-gray-500">{ADMIN_TEXTS.settings.descMaxAdvance}</p>
              </div>
              <div className="sm:col-span-2">
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min="1"
                    value={rules.max_advance_days}
                    onChange={(e) => handleChange('max_advance_days', e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">ngày</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Max Party Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">{ADMIN_TEXTS.settings.lblMaxParty}</label>
                <p className="text-xs text-gray-500">{ADMIN_TEXTS.settings.descMaxParty}</p>
              </div>
              <div className="sm:col-span-2">
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    min="1"
                    value={rules.max_party_size}
                    onChange={(e) => handleChange('max_party_size', e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">khách</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <Button
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 text-white border-0"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? ADMIN_TEXTS.settings.btnSaving : ADMIN_TEXTS.settings.btnSavePolicy}
          </Button>
        </div>
      </div>

      {/* BR: Two-Step Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{ADMIN_TEXTS.settings.confirmModalTitle}</h3>
                <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: ADMIN_TEXTS.settings.confirmModalDesc }} />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tỷ lệ cọc</span><span className="font-semibold text-gray-900">{rules.deposit_percent}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Đặt trước tối thiểu</span><span className="font-semibold text-gray-900">{rules.min_advance_hours} giờ</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Đặt trước tối đa</span><span className="font-semibold text-gray-900">{rules.max_advance_days} ngày</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Số khách tối đa</span><span className="font-semibold text-gray-900">{rules.max_party_size} khách</span></div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {ADMIN_TEXTS.settings.confirmBtnCancel}
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                {ADMIN_TEXTS.settings.confirmBtnSave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
