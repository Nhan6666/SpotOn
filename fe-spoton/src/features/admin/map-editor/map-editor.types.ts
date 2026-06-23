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
}

export interface EditorZone {
  _id: string;
  name: string;
  capacity: number;
  tables: EditorTable[];
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
  EMPTY:    { label: 'Trống',      color: 'text-gray-700',   bg: 'bg-gray-100',    border: 'border-gray-300' },
  HOLDING:  { label: 'Giữ chỗ',   color: 'text-yellow-700', bg: 'bg-yellow-50',   border: 'border-yellow-400' },
  LOCKED:   { label: 'Chờ cọc',   color: 'text-orange-700', bg: 'bg-orange-50',   border: 'border-orange-400' },
  RESERVED: { label: 'Đã đặt',    color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-400' },
  OCCUPIED: { label: 'Đang dùng', color: 'text-red-700',    bg: 'bg-red-50',      border: 'border-red-400' },
  CLEANING: { label: 'Dọn dẹp',   color: 'text-purple-700', bg: 'bg-purple-50',   border: 'border-purple-400' },
};
