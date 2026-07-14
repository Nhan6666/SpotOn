import { http } from '@/lib/http';
import { Booking } from '../check-in/check-in.types';

export const invoicesService = {
  getInvoices: async (branchId: string, startDate: string, endDate: string): Promise<Booking[]> => {
    const res = await http.get<{ success: boolean; data: Booking[] }>(
      `/bookings?branch_id=${branchId}&start_date=${startDate}&end_date=${endDate}`
    );
    // Lọc lấy những hóa đơn đã xong hoặc đang chờ đối soát
    return res.data.filter(b => ['COMPLETED', 'PENDING_SETTLEMENT'].includes(b.status));
  }
};
