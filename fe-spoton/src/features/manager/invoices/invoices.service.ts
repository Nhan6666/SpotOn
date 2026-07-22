import { http } from '@/lib/http';
import { Booking } from '../check-in/check-in.types';

export const invoicesService = {
  getInvoices: async (branchId: string, startDate: string, endDate: string): Promise<Booking[]> => {
    const res = await http.get<{ success: boolean; data: Booking[] }>(
      `/bookings?branch_id=${branchId}&start_date=${startDate}&end_date=${endDate}&include_refund_pending=true`
    );
    // Lọc lấy những hóa đơn đã xong, đang chờ đối soát, hoặc liên quan hoàn tiền
    return res.data.filter(b => [
      'COMPLETED', 
      'PENDING_SETTLEMENT', 
      'CANCELLED_REFUND_PENDING',
      'REFUND_COMPLETED'
    ].includes(b.status));
  },

  processRefund: async (bookingId: string, payload: { refund_amount: number; reason: string; refund_proof_url: string }) => {
    const res = await http.post<{ success: boolean; message: string; data: any }>(
      `/reception/bookings/${bookingId}/refund`, 
      payload
    );
    return res;
  }
};
