import { http } from '@/lib/http';
import type { BookingResponse, BookingStatus } from './booking-list.types';

const BASE = '/bookings';

export async function fetchBookings() {
  const response = await http.get<BookingResponse>(BASE);
  return response;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const response = await http.patch<{ success: boolean; message: string; data: any }>(`${BASE}/${bookingId}/status`, {
    status
  });
  return response;
}
