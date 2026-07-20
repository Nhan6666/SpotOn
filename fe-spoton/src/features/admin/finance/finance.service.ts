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

export interface RefundAudit {
  _id: string;
  branch_id?: { _id: string; name: string };
  customer_id?: { full_name: string; phone: string; email: string };
  refund_info?: {
    refund_amount: number;
    refund_percentage: number;
    refund_proof_url: string;
    refund_completed_at: string;
  };
  cancellation_reason: string;
  status: string;
  updatedAt: string;
}

export const financeService = {
  getRevenueStats: async (branchId = 'ALL', startDate?: string, endDate?: string) => {
    let url = `/finance/revenue?branch_id=${branchId}`;
    if (startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
    const res = await http.get<{ success: boolean; data: RevenueStats }>(url);
    return res.data;
  },

  getTransactions: async (branchId = 'ALL', startDate?: string, endDate?: string) => {
    let url = `/finance/transactions?branch_id=${branchId}`;
    if (startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
    const res = await http.get<{ success: boolean; data: Transaction[] }>(url);
    return res.data;
  },

  getRefundAudits: async (branchId = 'ALL') => {
    const res = await http.get<{ success: boolean; data: RefundAudit[] }>(`/finance/refunds?branch_id=${branchId}`);
    return res.data;
  }
};
