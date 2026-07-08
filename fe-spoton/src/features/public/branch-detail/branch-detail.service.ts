import { http } from '@/lib/http';
import { PublicBranchDetail } from './branch-detail.types';

export const branchDetailService = {
  getBranchById: async (id: string): Promise<PublicBranchDetail> => {
    const res = await http.get<{ success: boolean; data: PublicBranchDetail }>(`/branches/${id}`);
    return res.data;
  },
  
  // Note: Assuming there are endpoints for this. If not, it will return 404 or empty.
  getMenu: async (branchId: string) => {
    try {
      const res = await http.get<{ success: boolean; data: any }>(`/menus/public/branch/${branchId}`);
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
    const res = await http.get<{ success: boolean; message: string; data: { shift: string; booked_table_ids: string[] } }>(`/bookings/availability?branch_id=${branchId}&date=${date}&time=${time}`);
    return res;
  },

  holdBooking: async (payload: { branch_id: string; date: string; time: string; guest_count: number; table_ids: string[] }) => {
    const res = await http.post<{ success: boolean; message: string; data: any }>('/bookings/hold', payload);
    return res;
  },

  updateBookingInfo: async (bookingId: string, payload: { walk_in_name: string; walk_in_phone: string; note?: string; order_items?: any[] }) => {
    const res = await http.put<{ success: boolean; message: string; data: any }>(`/bookings/${bookingId}/update-info`, payload);
    return res;
  }
};
