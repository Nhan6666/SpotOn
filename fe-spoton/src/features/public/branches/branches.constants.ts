export const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1934&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?q=80&w=1934&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1934&auto=format&fit=crop',
];

export const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Đang mở', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  FULL: { label: 'Đã đầy', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  CLOSED: { label: 'Đã đóng', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  SETUP: { label: 'Đang thiết lập', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};
