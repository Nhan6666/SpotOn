export interface PublicTable {
  table_number: string;
  capacity: number;
}

export interface PublicZone {
  _id: string;
  name: string;
  capacity: number;
  tables: PublicTable[];
}

export interface PublicBranch {
  _id: string;
  name: string;
  address: {
    full: string;
    city: string;
    district: string;
    ward: string;
    street: string;
  } | string;
  location?: {
    type: string;
    coordinates: number[];
  };
  hotline?: string;
  service_periods?: {
    lunch?: { start: string; end: string; last_booking: string; last_order: string; };
    dinner?: { start: string; end: string; last_booking: string; last_order: string; };
  };
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'SETUP';
  current_capacity_percent: number;
  images?: string[];
  zones?: PublicZone[];
}
