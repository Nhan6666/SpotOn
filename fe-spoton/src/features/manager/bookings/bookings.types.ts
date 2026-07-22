export interface Table {
  _id: string;
  table_number: string;
  capacity: number;
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: string;
  status_lunch?: string;
  status_dinner?: string;
  image_url?: string | null;
}

export interface Zone {
  _id: string;
  name: string;
  tables: Table[];
}

export interface BranchData {
  _id: string;
  name: string;
  zones: Zone[];
}

export interface Booking {
  _id: string;
  table_ids: string[];
  status: string;
  customer_id?: { _id: string; full_name: string; phone: string; };
  walk_in_name?: string;
  walk_in_phone?: string;
  guest_count: number;
  reservation_date: string;
  arrival_time: string;
  shift: string;
}
