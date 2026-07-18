import { http } from '@/lib/http';
import { Booking } from './check-in.types';

export const checkInService = {
  getBookings: async (branchId: string, startDate: string, endDate: string): Promise<Booking[]> => {
    const res = await http.get<{ success: boolean; data: Booking[] }>(
      `/bookings?branch_id=${branchId}&start_date=${startDate}&end_date=${endDate}`
    );
    return res.data;
  },

  checkInBooking: async (bookingId: string): Promise<boolean> => {
    const res = await http.patch<{ success: boolean }>(`/reception/bookings/${bookingId}/check-in`, {});
    return res.success;
  },

  forceReleaseBooking: async (bookingId: string): Promise<boolean> => {
    const res = await http.patch<{ success: boolean }>(`/reception/bookings/${bookingId}/force-release`, {});
    return res.success;
  },

  addBillAdjustment: async (bookingId: string, data: Omit<import('./check-in.types').BillAdjustment, '_id' | 'actor_id' | 'created_at'>): Promise<import('./check-in.types').Booking> => {
    const res = await http.post<{ success: boolean; data: import('./check-in.types').Booking }>(`/reception/bookings/${bookingId}/adjustments`, data);
    return res.data;
  },

  removeBillAdjustment: async (bookingId: string, adjId: string): Promise<import('./check-in.types').Booking> => {
    const res = await http.delete<{ success: boolean; data: import('./check-in.types').Booking }>(`/reception/bookings/${bookingId}/adjustments/${adjId}`);
    return res.data;
  },

  uploadRefundProof: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await http.post<{ success: boolean; data: { url: string } }>('/uploads/refund', formData);
    return res.data.url;
  },

  processRefund: async (bookingId: string, data: { refund_amount: number; reason: string; refund_proof_url: string }): Promise<import('./check-in.types').Booking> => {
    const res = await http.post<{ success: boolean; data: import('./check-in.types').Booking }>(`/reception/bookings/${bookingId}/refund`, data);
    return res.data;
  }
};
