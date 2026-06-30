export type TableStatus = 'EMPTY' | 'HOLDING' | 'LOCKED' | 'RESERVED' | 'OCCUPIED' | 'CLEANING';

export type TableShape = 'RECTANGLE' | 'CIRCLE';

export interface EditorTable {
  _id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: TableShape;
  image_url?: string;
}

export interface EditorZone {
  _id: string;
  name: string;
  capacity: number;
  status?: 'OPEN' | 'CLOSED';
  tables: EditorTable[];
}

export interface TableTemplate {
  label: string;
  capacity: number;
  width: number;
  height: number;
  shape: TableShape;
  image_url?: string | null;
}

export interface ZonesResponse {
  success: boolean;
  message: string;
  data: {
    branch_name: string;
    zones: EditorZone[];
  };
}

export interface SingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; color: string; bg: string; border: string }> = {
  EMPTY:    { label: 'Trống',      color: 'text-blue-700',   bg: 'bg-blue-100',    border: 'border-blue-400' },
  HOLDING:  { label: 'Giữ chỗ',   color: 'text-amber-700', bg: 'bg-amber-100',   border: 'border-amber-400' },
  LOCKED:   { label: 'Chờ cọc',   color: 'text-orange-700', bg: 'bg-orange-100',   border: 'border-orange-400' },
  RESERVED: { label: 'Đã đặt',    color: 'text-emerald-700',   bg: 'bg-emerald-100',     border: 'border-emerald-400' },
  OCCUPIED: { label: 'Đang dùng', color: 'text-red-700',    bg: 'bg-red-100',      border: 'border-red-400' },
  CLEANING: { label: 'Dọn dẹp',   color: 'text-gray-700', bg: 'bg-gray-200',   border: 'border-gray-400' },
};
