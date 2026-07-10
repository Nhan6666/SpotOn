"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { Ticket, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function ManagerVouchersPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [branch, setBranch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (user?.branch_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [vouchersRes, branchRes] = await Promise.all([
        http.get<{ success: boolean; data: any[] }>('/vouchers'),
        http.get<{ success: boolean; data: any }>(`/branches/${user?.branch_id}`)
      ]);

      if (vouchersRes.success && branchRes.success) {
        // Filter only global vouchers or vouchers specific to this branch
        const relevantVouchers = vouchersRes.data.filter(
          (v: any) => !v.branch_id || v.branch_id === user?.branch_id
        );
        setVouchers(relevantVouchers);
        setBranch(branchRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch vouchers or branch", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoucher = async (voucherId: string, isCurrentlyDisabled: boolean) => {
    if (!branch) return;
    setIsToggling(voucherId);
    
    try {
      let newDisabledVouchers = [...(branch.disabled_vouchers || [])];
      
      if (isCurrentlyDisabled) {
        // Enable it: remove from disabled_vouchers
        newDisabledVouchers = newDisabledVouchers.filter(id => id !== voucherId);
      } else {
        // Disable it: add to disabled_vouchers
        if (!newDisabledVouchers.includes(voucherId)) {
          newDisabledVouchers.push(voucherId);
        }
      }

      await http.put(`/branches/${branch._id}`, { disabled_vouchers: newDisabledVouchers });
      
      // Update local state
      setBranch({ ...branch, disabled_vouchers: newDisabledVouchers });
      toastSuccess(isCurrentlyDisabled ? 'Đã bật mã khuyến mãi tại chi nhánh!' : 'Đã tắt mã khuyến mãi tại chi nhánh!');
    } catch (error) {
      console.error("Failed to toggle voucher", error);
      toastError("Lỗi khi thay đổi trạng thái áp dụng mã.");
    } finally {
      setIsToggling(null);
    }
  };

  const isVoucherRunning = (voucher: any) => {
    const now = new Date();
    const validFrom = new Date(voucher.valid_from);
    const validUntil = new Date(voucher.valid_until);
    return voucher.is_active && now >= validFrom && now <= validUntil;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Khuyến mãi</h1>
          <p className="text-gray-500 mt-1">Quản lý các mã giảm giá được phép áp dụng tại chi nhánh</p>
        </div>
      </div>

      {vouchers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Không có mã giảm giá nào</h3>
          <p className="text-gray-500">Hệ thống hiện tại chưa phát hành mã giảm giá.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => {
            const isDisabled = branch?.disabled_vouchers?.includes(voucher._id);
            const isRunning = isVoucherRunning(voucher);
            
            return (
              <div key={voucher._id} className={`bg-white rounded-xl shadow-sm border transition-all ${isDisabled ? 'border-gray-200 opacity-75 bg-gray-50' : 'border-[#ea580c]/30 hover:border-[#ea580c]/60 hover:shadow-md bg-white'}`}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <span className={`inline-block px-3 py-1 font-bold text-lg rounded-lg border mb-2 ${isDisabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-orange-50 text-[#ea580c] border-orange-100'}`}>
                      {voucher.code}
                    </span>
                    <div className="text-2xl font-bold text-gray-900">
                      Giảm {voucher.discount_percentage}%
                    </div>
                  </div>
                  {isRunning ? (
                    <Badge variant="success">Đang chạy</Badge>
                  ) : (
                    <Badge variant="default">Hết hạn</Badge>
                  )}
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Loại mã:</span>
                      <span className="font-medium">{!voucher.branch_id ? 'Toàn hệ thống' : 'Tại chi nhánh'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đơn tối thiểu:</span>
                      <span className="font-medium">{voucher.min_order_value?.toLocaleString()}đ</span>
                    </div>
                    {voucher.max_discount_amount && (
                      <div className="flex justify-between">
                        <span>Giảm tối đa:</span>
                        <span className="font-medium">{voucher.max_discount_amount.toLocaleString()}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>HSD:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                          {isDisabled ? 'Đang TẮT' : 'Đang BẬT'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isDisabled ? 'Khách sẽ không thấy mã này' : 'Khách có thể dùng mã này'}
                        </p>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleVoucher(voucher._id, isDisabled)}
                        disabled={isToggling === voucher._id}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!isDisabled ? 'bg-[#ea580c]' : 'bg-gray-300'} ${isToggling === voucher._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        role="switch"
                        aria-checked={!isDisabled}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!isDisabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
