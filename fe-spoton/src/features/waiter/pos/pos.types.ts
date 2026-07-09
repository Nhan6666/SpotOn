export interface Booking {
  _id: string;
  customer_id?: { full_name: string; phone: string };
  walk_in_name?: string;
  arrival_time: string;
  guest_count: number;
  table_ids?: string[];
  assigned_tables: { table_number: string }[];
  status: string;
  shift: string;
  order_items?: any[];
  table_deposit_amount?: number;
  pre_order_total_amount?: number;
  pre_order_deposit_amount?: number;
  voucher_discount_amount?: number;
  total_deposit_paid?: number;
  final_bill_amount?: number;
  ipad_pin?: string;
}

export interface Table {
  _id: string;
  table_number: string;
  capacity: number;
  status: string;
  shape?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Zone {
  _id: string;
  name: string;
  tables: Table[];
}
