import { http } from '@/lib/http';

export interface RevenueStats {
  total_revenue: number;
  total_refunds: number;
  net_revenue: number;
  count: number;
}

export interface Transaction {
  _id: string;
  branch_id?: { _id: string; name: string };
  booking_id?: { _id: string; reservation_date: string; status: string; customer_id?: any; walk_in_name?: string };
  date: string;
  amount: number;
  status: string;
}

export const transactionsService = {
  getRevenueStats: async (startDate?: string, endDate?: string) => {
    let url = `/finance/revenue?branch_id=ALL`;
    if (startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
    const res = await http.get<{ success: boolean; data: RevenueStats }>(url);
    return res.data;
  },

  getTransactions: async (startDate?: string, endDate?: string) => {
    let url = `/finance/transactions?branch_id=ALL`;
    if (startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
    const res = await http.get<{ success: boolean; data: Transaction[] }>(url);
    return res.data;
  },
};
