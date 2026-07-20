export const BOOKING_STATUS_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  HOLDING: { label: 'Giữ chỗ', color: 'text-orange-700', bg: 'bg-orange-100' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'text-slate-700', bg: 'bg-slate-100' },
  PENDING_DEPOSIT: { label: 'Chờ cọc', color: 'text-slate-700', bg: 'bg-slate-100' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-blue-700', bg: 'bg-blue-100' },
  IN_USE: { label: 'Đang dùng bữa', color: 'text-red-700', bg: 'bg-red-100' },
  OCCUPIED: { label: 'Đang dùng bữa', color: 'text-red-700', bg: 'bg-red-100' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  CANCELLED: { label: 'Đã hủy', color: 'text-gray-500', bg: 'bg-gray-100' },
  NO_SHOW: { label: 'Không đến', color: 'text-gray-500', bg: 'bg-gray-100' },
};
