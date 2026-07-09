import { http } from '@/lib/http';

export const ipadService = {
  unlockIpad: async (tableId: string, pin: string) => {
    const res = await http.post<{ success: boolean; message: string; token: string; data: any }>(
      '/orders/ipad/unlock-by-table',
      { table_id: tableId, pin }
    );
    return res;
  },

  getCategories: async (branchId: string) => {
    const res = await http.get<{ success: boolean; data: any[] }>(`/menus/public/${branchId}/categories`);
    return res.data;
  },

  getItems: async (branchId: string, categoryName: string, page: number = 1) => {
    const res = await http.get<{ success: boolean; data: any }>(
      `/menus/public/${branchId}/items?category_name=${encodeURIComponent(categoryName)}&page=${page}&limit=12&show_all=true`
    );
    return res.data;
  },

  placeOrder: async (bookingId: string, items: any[], token: string) => {
    // Override the Authorization header to use the IPAD token instead of the Waiter/Manager token
    const res = await http.post<{ success: boolean; message: string }>(
      `/orders/${bookingId}/items`,
      { items },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res;
  }
};
