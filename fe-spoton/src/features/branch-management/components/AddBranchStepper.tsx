import React from 'react';

export function AddBranchStepper({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <div className="flex items-center justify-center mb-10 w-full max-w-2xl mx-auto">
      {/* Step 1 */}
      <div className="flex flex-col items-center relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg z-10 transition-colors ${currentStep >= 1 ? 'bg-amber-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
          1
        </div>
        <span className={`font-semibold text-sm mt-2 absolute top-12 whitespace-nowrap ${currentStep >= 1 ? 'text-amber-600' : 'text-gray-400'}`}>Basic Info</span>
      </div>
      
      {/* Divider */}
      <div className={`flex-1 h-[2px] -mt-6 mx-2 transition-colors ${currentStep >= 2 ? 'bg-amber-500' : 'bg-gray-200'}`}></div>
      
      {/* Step 2 */}
      <div className="flex flex-col items-center relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg z-10 transition-colors ${currentStep >= 2 ? 'bg-amber-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
          2
        </div>
        <span className={`font-semibold text-sm mt-2 absolute top-12 whitespace-nowrap ${currentStep >= 2 ? 'text-amber-600' : 'text-gray-400'}`}>Location</span>
      </div>
      
      {/* Divider */}
      <div className={`flex-1 h-[2px] -mt-6 mx-2 transition-colors ${currentStep >= 3 ? 'bg-amber-500' : 'bg-gray-200'}`}></div>
      
      {/* Step 3 */}
      <div className="flex flex-col items-center relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg z-10 transition-colors ${currentStep >= 3 ? 'bg-amber-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
          3
        </div>
        <span className={`font-semibold text-sm mt-2 absolute top-12 whitespace-nowrap ${currentStep >= 3 ? 'text-amber-600' : 'text-gray-400'}`}>Operations</span>
      </div>
    </div>
  );
}
