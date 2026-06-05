import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useBranchContext } from '../branch-management.context';
import { useToast } from '@/components/ui/Toast';

interface DeactivateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  branchId: string;
}

export function DeactivateBranchModal({ isOpen, onClose, branchName, branchId }: DeactivateBranchModalProps) {
  const { deactivateBranch } = useBranchContext();
  const { success } = useToast();

  const handleDeactivate = () => {
    deactivateBranch(branchId);
    success(`Branch "${branchName}" has been deactivated.`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="p-6 md:p-8">
        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-6">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-3">Deactivate Branch?</h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to deactivate <span className="font-semibold text-gray-900">{branchName} ({branchId})</span>?
        </p>

        <div className="space-y-4 mb-8">
          {/* Warning Box */}
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-red-800 uppercase tracking-wider mb-1">Warning</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                Deactivated branches cannot accept new bookings.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Historical Data Retention</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deactivation will stop new bookings, but all associated historical data, employee records, and catering logs will be securely archived and remain accessible via the Reports module.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} className="font-semibold">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeactivate} className="font-semibold">
            Confirm Deactivation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
