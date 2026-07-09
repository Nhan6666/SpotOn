export interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  prep_status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  type: 'PRE_ORDER' | 'ADDITIONAL';
}

export interface BookingTicket {
  _id: string;
  customer_id?: { full_name: string };
  walk_in_name?: string;
  assigned_tables: { table_number: string }[];
  arrival_time: string;
  reservation_date: string;
  status: string;
  order_items: OrderItem[];
}
