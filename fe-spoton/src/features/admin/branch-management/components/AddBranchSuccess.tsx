import React from 'react';
import { CheckCircle2, ArrowRight, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface AddBranchSuccessProps {
  onReset: () => void;
}

export function AddBranchSuccess({ onReset }: AddBranchSuccessProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-md w-full">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-emerald-500"></div>
        
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Branch Created Successfully</h2>
          <p className="text-sm text-slate-500 mb-8">
            The new location has been added to your management network and is ready for configuration.
          </p>

          {/* Summary Box */}
          <div className="w-full bg-slate-50 rounded-lg border border-slate-200 p-5 mb-8 text-left space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-4 pb-4 border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Name</span>
              <span className="text-sm font-semibold text-gray-900">Downtown Metro Branch</span>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-4 pb-4 border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Address</span>
              <span className="text-sm text-gray-700 leading-tight">
                1420 Business Parkway, Suite 200<br />
                Metropolis, NY 10001
              </span>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Manager</span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="w-3 h-3 text-slate-500" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Sarah Jenkins</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <Link href="/admin/branches" className="block w-full">
              <Button variant="primary" className="w-full bg-amber-700 hover:bg-amber-800 text-white">
                Go to Branch Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full border-emerald-700 text-emerald-800 hover:bg-emerald-50"
              onClick={onReset}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Branch
            </Button>
            
            <Link href="/admin/branches" className="block w-full text-center mt-4">
              <span className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                Back to Management List
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
