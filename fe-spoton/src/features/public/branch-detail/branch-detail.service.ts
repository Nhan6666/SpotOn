import { http } from '@/lib/http';
import { PublicBranchDetail } from './branch-detail.types';

export const branchDetailService = {
  getBranchById: async (id: string): Promise<PublicBranchDetail> => {
    const res = await http.get<{ success: boolean; data: PublicBranchDetail }>(`/branches/${id}`);
    return res.data;
  },
  
  getMenu: async (branchId: string) => {
    try {
      const res = await http.get<{ success: boolean; data: any }>(`/menus/public/branch/${branchId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  getCategories: async (branchId: string) => {
    try {
      const res = await http.get<{ success: boolean; data: any[] }>(`/menus/public/${branchId}/categories`);
      return res.data;
    } catch {
      return [];
    }
  },

  getMenuItems: async (branchId: string, category_name: string, page: number = 1, limit: number = 10) => {
    try {
      const res = await http.get<{ success: boolean; data: any }>(`/menus/public/${branchId}/items?category_name=${encodeURIComponent(category_name)}&page=${page}&limit=${limit}`);
      return res.data;
    } catch {
      return null;
    }
  },

  getVouchers: async (branchId: string) => {
    try {
      const res = await http.get<{ success: boolean; data: any }>(`/vouchers/public/branch/${branchId}`);
      return res.data;
    } catch {
      return [];
    }
  },

  checkAvailability: async (branchId: string, date: string, time: string) => {
    const res = await http.get<{ success: boolean; message: string; data: { shift: string; booked_table_ids: string[] } }>(`/reception/availability?branch_id=${branchId}&date=${date}&time=${time}`);
    return res;
  },

  holdBooking: async (payload: { branch_id: string; date: string; time: string; guest_count: number; table_ids: string[] }) => {
    const res = await http.post<{ success: boolean; message: string; data: any }>('/reception/hold', payload);
    return res;
  },

  releaseBooking: async (bookingId: string) => {
    try {
      const res = await http.delete<{ success: boolean; message: string }>(`/reception/hold/${bookingId}`);
      return res;
    } catch {
      return { success: false, message: 'Lỗi nhả bàn' };
    }
  },

  updateBookingInfo: async (bookingId: string, payload: { walk_in_name: string; walk_in_phone: string; note?: string; order_items?: any[] }) => {
    const res = await http.put<{ success: boolean; message: string; data: any }>(`/bookings/${bookingId}/update-info`, payload);
    return res;
  },

  // ============================================================
  // PAYMENT APIs — UC-C12: Thanh toán cọc VNPay/MoMo
  // ============================================================

  calculateDeposit: async (bookingId: string, voucherCode?: string) => {
    const res = await http.post<{ success: boolean; message: string; data: any }>('/payment/calculate-deposit', {
      booking_id: bookingId,
      voucher_code: voucherCode || undefined,
    });
    return res;
  },

  createPayment: async (bookingId: string, method: 'VNPAY' | 'MOMO', voucherCode?: string) => {
    const res = await http.post<{ success: boolean; message: string; data: any }>('/payment/create-payment', {
      booking_id: bookingId,
      method,
      voucher_code: voucherCode || undefined,
    });
    return res;
  },

  getBookingById: async (bookingId: string) => {
    try {
      const res = await http.get<{ success: boolean; data: any }>(`/bookings/${bookingId}`);
      return res.data;
    } catch {
      return null;
    }
  },
};
