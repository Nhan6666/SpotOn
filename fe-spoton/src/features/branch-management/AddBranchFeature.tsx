"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddBranchStepper } from './components/AddBranchStepper';
import { AddBranchForm } from './components/AddBranchForm';
import { AddBranchLocation } from './components/AddBranchLocation';
import { AddBranchOperations } from './components/AddBranchOperations';
import { ProTipsSidebar } from './components/ProTipsSidebar';
import { AddBranchSuccess } from './components/AddBranchSuccess';
import { useBranchContext } from './branch-management.context';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export function AddBranchFeature() {
  const [currentStep, setCurrentStep] = useState(1);

  const { addBranch } = useBranchContext();
  const { success } = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 3) {
      // Simulate adding a new branch
      const mockNewBranch = {
        _id: 'BR-' + Math.floor(1000 + Math.random() * 9000),
        name: 'New Branch (Mock)',
        address: '123 Test Address, HCMC',
        hotline: '028-0000-0000',
        open_time: '08:00',
        close_time: '22:00',
        status: 'SETUP' as const,
        overload_threshold: 80,
        current_capacity_percent: 0,
      };
      addBranch(mockNewBranch);
      success('Branch created successfully!');
      setCurrentStep(4);
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };
  
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleReset = () => setCurrentStep(1);

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
        <Link href="/admin/branches" className="text-gray-500 hover:text-amber-700 transition-colors">Branch Management</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-gray-900">Add New Branch</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-10">Add New Branch</h1>
      
      <AddBranchStepper currentStep={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentStep === 1 && <AddBranchForm />}
          {currentStep === 2 && <AddBranchLocation />}
          {currentStep === 3 && <AddBranchOperations />}
          
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
              {currentStep === 1 ? 'Continue to Location' : currentStep === 2 ? 'Continue to Operations' : 'Finish & Create'}
              {currentStep === 3 ? (
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <ArrowRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <ProTipsSidebar currentStep={currentStep} />
        </div>
      </div>
    </div>
  );
}
