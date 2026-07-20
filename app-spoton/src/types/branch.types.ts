export interface Table {
  _id: string;
  table_number: string;
  capacity: number;
  status: 'EMPTY' | 'HOLDING' | 'LOCKED' | 'RESERVED' | 'OCCUPIED' | 'CLEANING';
  shape?: 'square' | 'round' | 'rectangle';
  position?: { x: number; y: number };
}

export interface Zone {
  _id: string;
  name: string;
  tables: Table[];
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  status: 'OPEN' | 'CLOSED' | 'FULL' | 'MAINTENANCE';
  open_time: string;
  close_time: string;
  image?: string;
  amenities?: string[];
  zones?: Zone[];
}
