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
  }
};
