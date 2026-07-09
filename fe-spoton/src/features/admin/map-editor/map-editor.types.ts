export type TableStatus = 'EMPTY' | 'HOLDING' | 'LOCKED' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

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

export const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; color: string; bg: string; border: string; extraClass?: string }> = {
  EMPTY:       { label: 'Trống',      color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-400' }, // Xanh lá
  HOLDING:     { label: 'Giữ chỗ',    color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-400' }, // Cam
  LOCKED:      { label: 'Chờ cọc',    color: 'text-gray-700',    bg: 'bg-gray-200',    border: 'border-gray-400' }, // Xám
  RESERVED:    { label: 'Đã đặt',     color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-400' }, // Xanh nước biển
  OCCUPIED:    { label: 'Đang dùng',  color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-400' }, // Đỏ
  CLEANING:    { label: 'Dọn dẹp',    color: 'text-yellow-700',  bg: 'bg-yellow-100',  border: 'border-yellow-400' }, // Vàng
  MAINTENANCE: { label: 'Bảo trì',    color: 'text-gray-100',    bg: 'bg-gray-800',    border: 'border-black', extraClass: 'line-through opacity-80' }, // Đen/Gạch chéo
};
