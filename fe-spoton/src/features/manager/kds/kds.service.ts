import { http } from '@/lib/http';
import { BookingTicket } from './kds.types';

export const kdsService = {
  getActiveTickets: async (branchId: string, startDate: string, endDate: string): Promise<BookingTicket[]> => {
    try {
      const res = await http.get<{ data: BookingTicket[] }>(
        `/bookings?branch_id=${branchId}&start_date=${startDate}&end_date=${endDate}`
      );
      
      // Lấy đơn đang IN_USE (hiện tại) hoặc CONFIRMED (đặt trước) có món ăn
      const active = res.data.filter(b => 
        ['IN_USE', 'CONFIRMED'].includes(b.status) && 
        b.order_items && 
        b.order_items.some(item => item.prep_status !== 'SERVED')
      );
      return active;
    } catch (err) {
      console.error('Lỗi tải dữ liệu KDS:', err);
      return [];
    }
  },

  updateItemStatus: async (bookingId: string, itemId: string, status: string): Promise<boolean> => {
    try {
      await http.patch(`/orders/${bookingId}/items/${itemId}/status`, { status });
      return true;
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      return false;
    }
  }
};
