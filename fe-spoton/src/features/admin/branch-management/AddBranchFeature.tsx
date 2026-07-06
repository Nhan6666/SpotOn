"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddBranchStepper } from './components/AddBranchStepper';
import { AddBranchForm } from './components/AddBranchForm';
import { AddBranchOperations } from './components/AddBranchOperations';
import { AddBranchImages } from './components/AddBranchImages';
import { AddBranchSuccess } from './components/AddBranchSuccess';
import { useBranchContext } from './branch-management.context';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { systemSettingsService } from '../system-settings/system-settings.service';

export function AddBranchFeature() {
  const [currentStep, setCurrentStep] = useState(1);
  const [createdBranchId, setCreatedBranchId] = useState<string | null>(null);
  const { addBranch } = useBranchContext();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    address: {
      full: '',
      city: 'Cần Thơ',
      district: '',
      ward: '',
      street: ''
    },
    location: {
      type: 'Point',
      coordinates: [105.783, 10.033]
    },
    hotline: '',
    manager_id: '',
    service_periods: {
      lunch: { start: '08:00', end: '13:00', last_booking: '12:00', last_order: '12:30' },
      dinner: { start: '15:00', end: '23:00', last_booking: '22:00', last_order: '22:30' }
    },
    status: 'OPEN' as const,
    amenities: [] as string[],
    description: '',
    overload_threshold: 85,
  });

  useEffect(() => {
    // Load default service periods
    systemSettingsService.getBookingRules().then(rules => {
      if (rules && rules.service_periods) {
        setFormData(prev => ({ ...prev, service_periods: rules.service_periods }));
      }
    }).catch(err => console.error('Failed to load default rules:', err));
  }, []);

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleNext = async () => {
    // Bước 2: Lưu Branch -> Chuyển sang Upload Ảnh (Bước 3)
    if (currentStep === 2) {
      if (!formData.name || !formData.address.full) {
        showError('Name and Full Address are required!');
        return;
      }
      if (!formData.manager_id) {
        showError('Please assign a Manager for this branch!');
        return;
      }
      try {
        const id = await addBranch(formData);
        setCreatedBranchId(id);
        success('Branch details saved! Please upload branch photos.');
        setCurrentStep(3); // Bước 3 = màn hình Upload Ảnh
      } catch (error) {
        showError('Failed to create branch. Please try again.');
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleReset = () => {
    setCurrentStep(1);
    setCreatedBranchId(null);
    setFormData({ 
      name: '', 
      address: { full: '', city: 'Cần Thơ', district: '', ward: '', street: '' }, 
      location: { type: 'Point', coordinates: [105.783, 10.033] }, 
      hotline: '', 
      manager_id: '', 
      service_periods: {
        lunch: { start: '08:00', end: '13:00', last_booking: '12:00', last_order: '12:30' },
        dinner: { start: '15:00', end: '23:00', last_booking: '22:00', last_order: '22:30' }
      },
      status: 'OPEN', 
      amenities: [],
      description: '',
      overload_threshold: 85,
    });
  };

  // Màn hình Success (bước 4)
  if (currentStep === 4) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <AddBranchSuccess onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-4">
        <Link href="/admin/branches" className="text-gray-500 hover:text-amber-700 transition-colors">Quản lý Chi nhánh</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-gray-900">Thêm chi nhánh mới</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-10">Thêm Chi nhánh mới</h1>

      <AddBranchStepper currentStep={currentStep} />

      <div className="max-w-2xl mx-auto">
          {currentStep === 1 && <AddBranchForm formData={formData} updateFormData={updateFormData} />}
          {currentStep === 2 && <AddBranchOperations formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && createdBranchId && (
            <AddBranchImages 
              branchId={createdBranchId} 
              onComplete={() => setCurrentStep(4)} 
            />
          )}

          {currentStep < 3 && (
            <div className="flex justify-between mt-8 pb-12">
              {currentStep > 1 ? (
                <Button variant="outline" className="w-32 bg-white hover:bg-gray-50 text-gray-700 border-gray-300" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Link href="/admin/branches">
                  <Button variant="outline" className="w-32 bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
                    Cancel
                  </Button>
                </Link>
              )}

              <Button variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white border-0" onClick={handleNext}>
                {currentStep === 1 ? 'Continue to Operations' : 'Save & Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
