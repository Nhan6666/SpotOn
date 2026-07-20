import { MenuItem } from './menu.types';
import { Table } from './branch.types';
import { User } from './user.types';

export type BookingStatus = 
  | 'HOLDING'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_USE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLED_TIMEOUT'
  | 'CANCELLED_PAYMENT_FAILED'
  | 'CANCELLED_REFUND_PENDING'
  | 'REFUND_COMPLETED'
  | 'NO_SHOW'
  | 'PENDING_SETTLEMENT'
  | 'WRITE_OFF';

export type OrderItemStatus = 'PENDING' | 'COOKING' | 'READY_TO_SERVE' | 'SERVED' | 'CANCELLED';

export interface OrderItem {
  _id?: string;
  menu_item_id: string | MenuItem;
  name: string;
  quantity: number;
  price_at_time: number;
  type: 'PRE_ORDER' | 'ADDITIONAL';
  status: OrderItemStatus;
  notes?: string;
}

export interface PaymentInfo {
  table_deposit_amount: number;
  pre_order_total_amount: number;
  pre_order_deposit_amount: number;
  voucher_discount_amount: number;
  total_deposit_paid: number;
  final_bill_amount: number;
  amount_collected?: number;
}

export interface Booking {
  _id: string;
  branch_id: string;
  customer_id?: string | User;
  guest_name: string;
  guest_phone: string;
  guest_count: number;
  reservation_date: string; // YYYY-MM-DD
  arrival_time: string; // HH:mm
  status: BookingStatus;
  assigned_tables: (string | Table)[];
  order_items: OrderItem[];
  payment_info: PaymentInfo;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
