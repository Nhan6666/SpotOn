import apiClient from '@/lib/http';

export const BookingService = {
  // ===== CUSTOMER =====
  
  /** Get my bookings (CUSTOMER only) */
  async getMyBookings() {
    const response = await apiClient.get('/bookings/my-bookings');
    return response.data;
  },

  /** Create booking directly (legacy — used by MANAGER/WAITER) */
  async createBooking(data: any) {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  /** Get booking by ID */
  async getBookingById(id: string) {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  /** Cancel a confirmed booking and request refund (CUSTOMER only) */
  async cancelBooking(bookingId: string, data: {
    bank_account_number?: string;
    bank_name?: string;
    account_holder_name?: string;
    cancellation_reason?: string;
  }) {
    const payload = {
      bank_account_number: data.bank_account_number,
      bank_name: data.bank_name,
      account_holder_name: data.account_holder_name,
      reason: data.cancellation_reason
    };
    const response = await apiClient.post(`/bookings/${bookingId}/cancel-refund`, payload);
    return response.data;
  },

  // ===== RECEPTION FLOW (Customer Booking) =====

  /** Step 1: Check table availability for a branch/date/time */
  async checkAvailability(branch_id: string, date: string, time: string) {
    const response = await apiClient.get('/reception/availability', {
      params: { branch_id, date, time }
    });
    return response.data;
  },

  /** Step 2: Hold tables temporarily (10 min countdown) */
  async holdBooking(data: {
    branch_id: string;
    date: string;
    time: string;
    table_ids: string[];
    guest_count?: number;
  }) {
    const response = await apiClient.post('/reception/hold', data);
    return response.data;
  },

  /** Release a held booking */
  async releaseHold(bookingId: string) {
    const response = await apiClient.delete(`/reception/hold/${bookingId}`);
    return response.data;
  },

  /** Step 3: Update booking info (order_items, notes, etc.) */
  async updateBookingInfo(bookingId: string, data: {
    order_items?: Array<{
      menu_item_id: string;
      name: string;
      quantity: number;
      price_at_time: number;
      type: 'PRE_ORDER' | 'ADDITIONAL';
    }>;
    note?: string;
  }) {
    const response = await apiClient.put(`/bookings/${bookingId}/update-info`, data);
    return response.data;
  },

  // ===== PAYMENT =====

  /** Calculate deposit amount */
  async calculateDeposit(bookingId: string, voucherCode?: string) {
    const response = await apiClient.post('/payment/calculate-deposit', {
      booking_id: bookingId,
      voucher_code: voucherCode || undefined
    });
    return response.data;
  },

  /** Create VNPay/MoMo payment URL */
  async createPayment(bookingId: string, method: 'VNPAY' | 'MOMO' = 'VNPAY', voucherCode?: string) {
    const response = await apiClient.post('/payment/create-payment', {
      booking_id: bookingId,
      method,
      voucher_code: voucherCode || undefined
    });
    return response.data;
  },

  /** Mock Payment Success (App Simulation) */
  async mockConfirmPayment(bookingId: string, voucherCode?: string) {
    const response = await apiClient.post('/payment/mock-payment', {
      booking_id: bookingId,
      voucher_code: voucherCode || undefined
    });
    return response.data;
  },

  // ===== MANAGER/ADMIN =====

  /** Get all bookings (ADMIN/MANAGER/WAITER) */
  async getAllBookings(params?: { branch_id?: string; start_date?: string; end_date?: string }) {
    const response = await apiClient.get('/bookings', { params });
    return response.data;
  },

  /** Update booking status (ADMIN/MANAGER) */
  async updateBookingStatus(bookingId: string, status: string) {
    const response = await apiClient.patch(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  // ===== RECEPTION ACTIONS (MANAGER/WAITER) =====

  /** Check-in a booking */
  async checkInBooking(bookingId: string) {
    const response = await apiClient.patch(`/reception/bookings/${bookingId}/check-in`);
    return response.data;
  },

  /** Checkout a booking (final bill) */
  async checkoutBooking(bookingId: string, final_bill_amount?: number) {
    const response = await apiClient.patch(`/reception/bookings/${bookingId}/checkout`, {
      final_bill_amount
    });
    return response.data;
  },

  /** Force release a booking (cancel without checkout) */
  async forceReleaseBooking(bookingId: string) {
    const response = await apiClient.patch(`/reception/bookings/${bookingId}/force-release`);
    return response.data;
  },

  /** Create walk-in booking (WAITER/MANAGER) */
  async createWalkIn(data: {
    table_ids: string[];
    walk_in_name?: string;
    walk_in_phone?: string;
    guest_count: number;
  }) {
    const response = await apiClient.post('/reception/walk-in', data);
    return response.data;
  },
};
