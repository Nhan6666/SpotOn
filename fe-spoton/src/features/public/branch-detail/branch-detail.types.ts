export interface PublicBranchDetail {
  _id: string;
  name: string;
  description?: string;
  address: {
    full: string;
    city: string;
    district: string;
    ward?: string;
    street?: string;
  };
  hotline?: string;
  images?: string[];
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'SETUP';
  service_periods: {
    lunch: { start: string; end: string; last_booking: string; last_order: string; };
    dinner: { start: string; end: string; last_booking: string; last_order: string; };
  };
  amenities: any[];
  zones: {
    _id: string;
    name: string;
    tables: {
      _id: string;
      table_number: string;
      capacity: number;
      x: number;
      y: number;
      width: number;
      height: number;
      shape: string;
      status: string;
    }[];
  }[];
}
