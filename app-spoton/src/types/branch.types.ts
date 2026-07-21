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
  address: any; // Can be string or object
  phone?: string;
  hotline?: string;
  status: 'OPEN' | 'CLOSED' | 'FULL' | 'MAINTENANCE';
  open_time?: string;
  close_time?: string;
  image?: string;
  images?: string[];
  amenities?: any[]; // Array of strings or objects
  zones?: Zone[];
  manager_id?: any; // String or object
  service_periods?: {
    lunch?: { start: string; end: string };
    dinner?: { start: string; end: string };
  };
  location?: {
    type: string;
    coordinates: number[];
  };
}
