"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { socket } from '@/lib/socket';
import { RefreshCw } from 'lucide-react';
import { TABLE_STATUS_CONFIG, TableStatus } from '@/features/admin/map-editor/map-editor.types';

interface Table {
  _id: string;
  table_number: string;
  capacity: number;
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: string;
  image_url?: string | null;
}

interface Zone {
  _id: string;
  name: string;
  tables: Table[];
}

interface BranchData {
  _id: string;
  name: string;
  zones: Zone[];
}

interface Booking {
  _id: string;
  table_ids: string[];
  status: string;
  customer_id?: { _id: string; full_name: string; phone: string; };
  walk_in_name?: string;
  walk_in_phone?: string;
  guest_count: number;
  reservation_date: string;
  arrival_time: string;
  shift: string;
}

const BOOKING_STATUS_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  HOLDING: { label: 'Giữ chỗ', color: 'text-gray-700', bg: 'bg-gray-100' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'text-amber-700', bg: 'bg-amber-100' },
  PENDING_DEPOSIT: { label: 'Chờ cọc', color: 'text-amber-700', bg: 'bg-amber-100' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-blue-700', bg: 'bg-blue-100' },
  OCCUPIED: { label: 'Đang dùng bữa', color: 'text-green-700', bg: 'bg-green-100' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  CANCELLED: { label: 'Đã hủy', color: 'text-red-700', bg: 'bg-red-100' },
  NO_SHOW: { label: 'Không đến', color: 'text-red-700', bg: 'bg-red-100' },
};

export function ManagerBookingsFeature() {
  const { user } = useAuth();
  const [branch, setBranch] = useState<BranchData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('LUNCH');
  const [isLoading, setIsLoading] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stop panning if mouse leaves window
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Only pan if clicking directly on canvas background
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('pointer-events-none')) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current?.scrollLeft || 0,
      scrollTop: containerRef.current?.scrollTop || 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      containerRef.current.scrollLeft = panStart.scrollLeft - dx;
      containerRef.current.scrollTop = panStart.scrollTop - dy;
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const fetchBranchData = useCallback(async () => {
    if (!user?.branch_id) return;
    try {
      // Assuming GET /api/v1/branches/:id returns branch details
      const res = await http.get<{ success: boolean; data: BranchData }>(`/branches/${user.branch_id}`);
      if (res.success) {
        setBranch(res.data);
        if (res.data.zones?.length > 0) {
          setSelectedZone(res.data.zones[0]._id);
        }
      }
    } catch (err) {
      console.error('Lỗi lấy chi nhánh:', err);
    }
  }, [user?.branch_id]);

  const fetchBookings = useCallback(async () => {
    if (!user?.branch_id) return;
    setIsLoading(true);
    try {
      // Create date filters
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // GET bookings for branch
      const res = await http.get<{ success: boolean; data: Booking[] }>(
        `/bookings?branch_id=${user.branch_id}&start_date=${targetDate.toISOString()}&end_date=${nextDate.toISOString()}`
      );
      if (res.success) {
        let list = res.data;
        if (shift) {
            list = list.filter(b => b.shift === shift);
        }
        setBookings(list.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && b.status !== 'NO_SHOW'));
      }
    } catch (err) {
      console.error('Lỗi lấy bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branch_id, date, shift]);

  useEffect(() => {
    fetchBranchData();
  }, [fetchBranchData]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Real-time Sync
  useEffect(() => {
    if (!user?.branch_id) return;

    socket.connect();
    socket.emit('join_branch_room', user.branch_id);

    const onTableStatusChanged = (data: any) => {
      console.log('Manager Real-time event:', data);
      fetchBookings(); // Tải lại bookings khi có thay đổi
      fetchBranchData(); // Tải lại dữ liệu chi nhánh để cập nhật table.status
    };

    socket.on('table_status_changed', onTableStatusChanged);

    return () => {
      socket.off('table_status_changed', onTableStatusChanged);
      socket.disconnect();
    };
  }, [user?.branch_id, fetchBookings]);

  if (!branch) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu chi nhánh...</div>;
  }

  const currentZone = branch.zones.find(z => z._id === selectedZone);

  // Helper function to determine table status based on bookings
  const getTableStatus = (table: Table) => {
    const tableBookings = bookings.filter(b => b.table_ids.includes(table._id));
    if (tableBookings.length > 0) {
      if (tableBookings.some(b => b.status === 'OCCUPIED')) return 'OCCUPIED';
      if (tableBookings.some(b => b.status === 'CLEANING')) return 'CLEANING';
      if (tableBookings.some(b => b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT' || b.status === 'PENDING_DEPOSIT')) return 'RESERVED';
      if (tableBookings.some(b => b.status === 'HOLDING')) return 'HOLDING';
    }
    return table.status || 'EMPTY';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Quản lý Đặt bàn & Sơ đồ</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Theo dõi trạng thái bàn theo thời gian thực (Real-time).
          </p>
        </div>
        <button 
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ngày</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ca phục vụ</label>
          <select 
            value={shift} 
            onChange={(e) => setShift(e.target.value)}
            className="border-gray-300 rounded-md text-sm py-2"
          >
            <option value="LUNCH">Ca Trưa</option>
            <option value="DINNER">Ca Tối</option>
          </select>
        </div>
      </div>

      {/* Map Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Cột trái: Booking List */}
        <div className="xl:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[700px] flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Danh sách đặt bàn ({bookings.length})
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Không có đơn đặt bàn nào trong ca này.</p>
            ) : (
              bookings.map((booking) => {
                const customerName = booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai';
                const customerPhone = booking.customer_id?.phone || booking.walk_in_phone || 'N/A';
                const bStatus = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.HOLDING;
                
                return (
                  <div key={booking._id} className="p-3 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{customerName}</p>
                        <p className="text-xs text-gray-500">{customerPhone}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bStatus.bg} ${bStatus.color}`}>
                        {bStatus.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div className="bg-white p-1.5 rounded border border-gray-100">
                        <span className="text-gray-500 block mb-0.5">Thời gian</span>
                        <span className="font-medium">{booking.arrival_time || 'N/A'}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-gray-100">
                        <span className="text-gray-500 block mb-0.5">Số khách</span>
                        <span className="font-medium">{booking.guest_count || 1} người</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cột phải: Map Area */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-[700px] flex flex-col">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
            {/* Zones */}
            <div className="flex gap-2">
              {branch.zones.map(z => (
                <button
                  key={z._id}
                  onClick={() => setSelectedZone(z._id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[17px] transition-colors ${selectedZone === z._id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {z.name}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3">
              {Object.entries(TABLE_STATUS_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${config.bg} ${config.border} border`}></div>
                  <span className="text-xs text-gray-500">{config.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            ref={containerRef}
            className="flex-1 relative w-full overflow-auto rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"
          >
            <div
              ref={canvasRef}
              className="relative bg-[#f8fafc] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] select-none"
              style={{
                width: "2000px",
                height: "2000px",
                backgroundSize: "16px 16px",
                cursor: isPanning ? "grabbing" : "grab",
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {currentZone?.tables.map(table => {
                const status = getTableStatus(table) as TableStatus;
                const statusConfig = TABLE_STATUS_CONFIG[status] || TABLE_STATUS_CONFIG.EMPTY;
                const isCircle = table.shape === 'CIRCLE';
                const shapeClasses = isCircle ? 'rounded-full' : 'rounded-lg';

                return (
                  <div
                    key={table._id}
                    className={`absolute flex flex-col items-center justify-center transition-all group pointer-events-none
                      ${table.image_url ? 'bg-transparent border-transparent' : `border-2 shadow-sm ${statusConfig.bg} ${statusConfig.border}`}
                      ${shapeClasses}
                    `}
                    style={{
                      left: `${table.x}px`,
                      top: `${table.y}px`,
                      width: `${table.width}px`,
                      height: `${isCircle ? table.width : table.height}px`,
                    }}
                    title={`Bàn ${table.table_number} - Trạng thái: ${statusConfig.label}`}
                  >
                    {table.image_url ? (
                      <>
                        <img src={table.image_url} alt="" className={`w-full h-full object-contain p-1 ${shapeClasses}`} />
                        <div className={`absolute top-0 left-0 ${statusConfig.bg} ${statusConfig.border} border-b border-r text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md rounded-br-md shadow-sm pointer-events-none`}>
                          {table.table_number}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={`font-bold ${statusConfig.color} ${isCircle && table.width < 50 ? 'text-sm' : 'text-lg'}`}>
                          {table.table_number}
                        </span>
                        {(!isCircle || table.width >= 50) && (
                          <span className={`text-xs ${statusConfig.color} opacity-80 mt-1 pointer-events-none`}>
                            {table.capacity} chỗ
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* Status Label underneath */}
                    <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2.5 py-0.5 rounded-full border shadow-[0_2px_10px_rgba(0,0,0,0.06)] z-10 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} font-bold uppercase tracking-wider pointer-events-none`}>
                      {statusConfig.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
