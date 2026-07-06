"use client";

import React, { useEffect, useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { BookingRules } from './system-settings.types';
import { systemSettingsService } from './system-settings.service';

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
      showError('Không thể tải chính sách đặt bàn.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Validate và mở Modal xác nhận
  const handleSave = () => {
    if (rules.deposit_percent < 0 || rules.deposit_percent > 100) {
      showError('Tỷ lệ cọc phải từ 0-100%.');
      return;
    }
    if (rules.min_advance_hours < 0 || rules.max_advance_days <= 0 || rules.max_party_size <= 0) {
      showError('Vui lòng nhập các giá trị hợp lệ lớn hơn 0.');
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
      success('Lưu chính sách đặt bàn thành công!');
    } catch (err) {
      console.error('Failed to save booking rules:', err);
      showError('Lưu thất bại. Vui lòng thử lại.');
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
    return <div className="p-8 text-center text-gray-500 animate-pulse">Đang tải cấu hình...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Cài đặt Hệ thống</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Quản lý cấu hình chung cho toàn bộ nền tảng SpotOn.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Chính sách Đặt bàn Toàn cầu</h2>
              <p className="text-sm text-gray-500">Những quy định này áp dụng cho tất cả chi nhánh theo mặc định.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Deposit Percent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-gray-100">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">Tỷ lệ cọc</label>
                <p className="text-xs text-gray-500">Số tiền cọc yêu cầu để giữ chỗ (đơn vị %).</p>
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
                <label className="block text-sm font-semibold text-gray-900 mb-1">Đặt trước tối thiểu</label>
                <p className="text-xs text-gray-500">Số giờ tối thiểu khách cần đặt trước.</p>
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
                <label className="block text-sm font-semibold text-gray-900 mb-1">Đặt trước tối đa</label>
                <p className="text-xs text-gray-500">Số ngày tối đa cho phép khách đặt trước.</p>
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
                <label className="block text-sm font-semibold text-gray-900 mb-1">Số khách tối đa</label>
                <p className="text-xs text-gray-500">Số khách lớn nhất cho phép trong một lần đặt bàn.</p>
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
            {isSaving ? 'Đang lưu...' : 'Lưu chính sách'}
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
                <h3 className="text-lg font-bold text-gray-900 mb-1">Xác nhận thay đổi cấu hình</h3>
                <p className="text-sm text-gray-500">
                  Bạn sắp thay đổi chính sách đặt bàn áp dụng cho <strong>toàn bộ chuỗi</strong>. 
                  Thay đổi này sẽ có hiệu lực ngay lập tức trên tất cả chi nhánh.
                </p>
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
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
