"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddBranchStepper } from './components/AddBranchStepper';
import { AddBranchForm } from './components/AddBranchForm';
import { AddBranchOperations } from './components/AddBranchOperations';
import { AddBranchSuccess } from './components/AddBranchSuccess';
import { useBranchContext } from './branch-management.context';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export function AddBranchFeature() {
  const [currentStep, setCurrentStep] = useState(1);
  const { addBranch } = useBranchContext();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    hotline: '',
    manager_id: '',
    open_time: '09:00',
    close_time: '22:00',
    status: 'OPEN' as const,
    overload_threshold: 85,
  });

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleNext = async () => {
    // Bước 2 = bước cuối → Submit
    if (currentStep === 2) {
      if (!formData.name || !formData.address) {
        showError('Name and Address are required!');
        return;
      }
      if (!formData.manager_id) {
        showError('Please assign a Manager for this branch!');
        return;
      }
      try {
        await addBranch(formData);
        success('Branch created successfully!');
        setCurrentStep(3); // Bước 3 = màn hình Success
      } catch (error) {
        showError('Failed to create branch. Please try again.');
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleReset = () => {
    setCurrentStep(1);
    setFormData({ name: '', address: '', hotline: '', manager_id: '', open_time: '09:00', close_time: '22:00', status: 'OPEN', overload_threshold: 85 });
  };

  // Màn hình Success (bước 3)
  if (currentStep === 3) {
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
        <Link href="/admin/branches" className="text-gray-500 hover:text-amber-700 transition-colors">Branch Management</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-gray-900">Add New Branch</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-10">Add New Branch</h1>

      <AddBranchStepper currentStep={currentStep} />

      <div className="max-w-2xl mx-auto">
          {currentStep === 1 && <AddBranchForm formData={formData} updateFormData={updateFormData} />}
          {currentStep === 2 && <AddBranchOperations formData={formData} updateFormData={updateFormData} />}

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
              {currentStep === 1 ? 'Continue to Operations' : 'Finish & Create'}
              {currentStep === 2 ? (
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <ArrowRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
      </div>
    </div>
  );
}
