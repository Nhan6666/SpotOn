import { http } from '@/lib/http';
import { BranchData, Booking } from './bookings.types';

export const managerBookingsService = {
  getBranchData: async (branchId: string): Promise<BranchData | null> => {
    try {
      const res = await http.get<{ success: boolean; data: BranchData }>(`/branches/${branchId}`);
      if (res.success) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Lỗi lấy chi nhánh:', err);
      return null;
    }
  },

  getBookings: async (branchId: string, startDate: string, endDate: string): Promise<Booking[]> => {
    try {
      const res = await http.get<{ success: boolean; data: Booking[] }>(
        `/bookings?branch_id=${branchId}&start_date=${startDate}&end_date=${endDate}`
      );
      if (res.success) {
        return res.data;
      }
      return [];
    } catch (err) {
      console.error('Lỗi lấy bookings:', err);
      return [];
    }
  }
};
