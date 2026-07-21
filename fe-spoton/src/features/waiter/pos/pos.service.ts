import { http } from '@/lib/http';
import { Zone, Booking } from './pos.types';

export const posService = {
  getBranchData: async (branchId: string) => {
    const res = await http.get<{ data: { zones: Zone[] } }>(`/branches/${branchId}`);
    return res.data;
  },

  getTodayBookings: async (branchId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await http.get<{ data: Booking[] }>(
      `/bookings?branch_id=${branchId}&start_date=${today.toISOString()}&end_date=${tomorrow.toISOString()}`
    );
    return res.data;
  },

  openWalkInTable: async (tableId: string, tableNumber: string, zoneName: string, guestCount: number) => {
    const res = await http.post<{ success: boolean; message: string }>('/reception/walk-in', {
      table_ids: [tableId],
      assigned_tables: [{ table_number: tableNumber, zone_name: zoneName }],
      guest_count: guestCount,
      note: 'Khách Walk-in (Mở bởi Waiter)'
    });
    return res;
  },

  createWaitingList: async (guestCount: number, customerName: string, phone: string, note: string = '') => {
    const res = await http.post<{ success: boolean; message: string }>('/reception/walk-in', {
      table_ids: [],
      assigned_tables: [],
      guest_count: guestCount,
      walk_in_name: customerName || 'Khách vãng lai',
      walk_in_phone: phone || '',
      note: note ? `Waiting List: ${note}` : 'Khách Walk-in (Waiting List)'
    });
    return res;
  },

  updateTableStatus: async (branchId: string, tableId: string, status: string) => {
    const res = await http.patch<{ success: boolean; message: string }>(
      `/branches/${branchId}/tables/${tableId}/status`, 
      { status }
    );
    return res;
  },

  getMenuItems: async (branchId: string) => {
    // Tái sử dụng API menu công khai của chi nhánh
    const res = await http.get(`/menus/public/branch/${branchId}`);
    return res.data;
  },

  addAdditionalOrder: async (bookingId: string, items: { menu_item_id: string; name: string; quantity: number; price: number }[]) => {
    const res = await http.post<{ success: boolean; message: string }>(
      `/orders/${bookingId}/items`,
      { items }
    );
    return res.data;
  },

  markItemServed: async (bookingId: string, itemId: string) => {
    const res = await http.patch<{ success: boolean; message: string }>(
      `/orders/${bookingId}/items/${itemId}/status`,
      { status: 'SERVED' }
    );
    return res.data;
  }
};
