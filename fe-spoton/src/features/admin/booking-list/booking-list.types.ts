export type BookingStatus = 'PENDING_DEPOSIT' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';

export interface AssignedTable {
  zone_name: string;
  table_number: string;
  _id: string;
}

export interface Booking {
  _id: string;
  customer_id: {
    _id: string;
    full_name: string;
    phone: string;
    email: string;
  } | null;
  walk_in_name?: string;
  walk_in_phone?: string;
  branch_id: string;
  reservation_date: string;
  arrival_time: string;
  guest_count: number;
  status: BookingStatus;
  cancellation_reason?: string;
  note?: string;
  assigned_tables: AssignedTable[];
  created_at: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: Booking[];
}
