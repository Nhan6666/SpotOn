export interface TableAssigned {
  zone_name: string;
  table_number: string;
  _id: string;
}

export interface Booking {
  _id: string;
  branch_id?: string;
  customer_id?: { _id: string; full_name: string; phone: string };
  walk_in_name?: string;
  walk_in_phone?: string;
  arrival_time: string;
  reservation_date: string;
  guest_count: number;
  status: string;
  note?: string;
  assigned_tables: TableAssigned[];
  order_items?: any[];
  pre_order_total_amount?: number;
  total_deposit_paid?: number;
  table_ids?: string[];
  payment_info?: {
    status?: string;
    transaction_id?: string;
    voucher_code?: string;
  };
}
