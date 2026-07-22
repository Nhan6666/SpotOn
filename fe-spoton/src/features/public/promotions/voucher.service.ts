import { http } from '@/lib/http';

export const voucherService = {
  // Nhận voucher vào ví
  claimVoucher: async (code: string) => {
    return http.post<{ success: boolean; message: string; data?: any }>('/vouchers/claim', { code });
  },

  // Lấy ví voucher
  getMyWallet: async () => {
    return http.get<{ success: boolean; data: any[] }>('/vouchers/my-wallet');
  },

  // Validate voucher (khi đặt cọc)
  validateVoucher: async (code: string, branchId?: string, guestCount?: number, preOrderAmount?: number) => {
    return http.post<{ success: boolean; message: string; data: any }>('/vouchers/validate', {
      code,
      branch_id: branchId,
      guest_count: guestCount,
      pre_order_amount: preOrderAmount
    });
  },

  // Áp dụng voucher ở Waiter POS
  applyVoucherToBooking: async (bookingId: string, code: string) => {
    return http.post<{ success: boolean; message: string; data: any }>(`/bookings/${bookingId}/apply-voucher`, { code });
  }
};
