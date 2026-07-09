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

  const handleSave = async () => {
    // Validate
    if (rules.deposit_percent < 0 || rules.deposit_percent > 100) {
      showError('Tỷ lệ cọc phải từ 0-100%.');
      return;
    }
    if (rules.min_advance_hours < 0 || rules.max_advance_days <= 0 || rules.max_party_size <= 0) {
      showError('Vui lòng nhập các giá trị hợp lệ lớn hơn 0.');
      return;
    }

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
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-500">Manage global configurations for the SpotOn platform.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Global Booking Policies</h2>
              <p className="text-sm text-gray-500">These rules apply to all branches by default unless overridden.</p>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Deposit Percent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-gray-100">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">Deposit Percent</label>
                <p className="text-xs text-gray-500">Amount required to secure a reservation (%).</p>
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
                <label className="block text-sm font-semibold text-gray-900 mb-1">Minimum Advance Time</label>
                <p className="text-xs text-gray-500">How many hours in advance guests must book.</p>
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
                    <span className="text-gray-500 sm:text-sm">hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Max Advance Days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pb-6 border-b border-gray-100">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">Maximum Advance Time</label>
                <p className="text-xs text-gray-500">How far in the future guests can make reservations.</p>
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
                    <span className="text-gray-500 sm:text-sm">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Max Party Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 mb-1">Maximum Party Size</label>
                <p className="text-xs text-gray-500">Largest group size allowed per single booking.</p>
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
                    <span className="text-gray-500 sm:text-sm">guests</span>
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
            {isSaving ? 'Saving...' : 'Save Policies'}
          </Button>
        </div>
      </div>
    </div>
  );
}
