export interface BranchTable {
  table_number: string;
  capacity: number;
  status: 'EMPTY' | 'HOLDING' | 'LOCKED' | 'RESERVED' | 'OCCUPIED' | 'CLEANING';
}

export interface BranchZone {
  _id: string;
  name: string;
  capacity: number;
  tables: BranchTable[];
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
  hotline: string;
  open_time: string;
  close_time: string;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'SETUP';
  overload_threshold: number;
  manager_name?: string;
  manager_avatar?: string;
  current_capacity_percent: number;
  zones?: BranchZone[];
}
