import apiClient from '@/lib/http';

export const OrderService = {
  async getBookings() {
    // Fetches bookings for manager/waiter's branch
    const response = await apiClient.get('/bookings');
    return response.data;
  },

  async updateItemStatus(bookingId: string, itemId: string, status: string) {
    const response = await apiClient.patch(`/orders/${bookingId}/items/${itemId}/status`, { status });
    return response.data;
  }
};
