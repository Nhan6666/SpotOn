"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { socket } from '@/lib/socket';
import { RefreshCw } from 'lucide-react';

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
}

export function ManagerBookingsFeature() {
  const { user } = useAuth();
  const [branch, setBranch] = useState<BranchData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('LUNCH');
  const [isLoading, setIsLoading] = useState(true);

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
        setBookings(res.data.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && b.status !== 'NO_SHOW'));
      }
    } catch (err) {
      console.error('Lỗi lấy bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branch_id, date]);

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
  const getTableStatus = (tableId: string) => {
    const tableBookings = bookings.filter(b => b.table_ids.includes(tableId));
    if (tableBookings.length === 0) return 'EMPTY';

    // Priority of status mapping
    // If ANY booking is OCCUPIED -> OCCUPIED
    if (tableBookings.some(b => b.status === 'OCCUPIED')) return 'OCCUPIED';
    // If ANY booking is CLEANING -> CLEANING
    if (tableBookings.some(b => b.status === 'CLEANING')) return 'CLEANING';
    // If ANY booking is CONFIRMED -> RESERVED
    if (tableBookings.some(b => b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT' || b.status === 'PENDING_DEPOSIT')) return 'RESERVED';
    // If ANY booking is HOLDING -> HOLDING
    if (tableBookings.some(b => b.status === 'HOLDING')) return 'HOLDING';

    return 'EMPTY';
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'EMPTY': return 'bg-emerald-100 border-emerald-400 text-emerald-700'; // Xanh lá
      case 'HOLDING': return 'bg-gray-200 border-gray-400 text-gray-700 opacity-80 cursor-not-allowed'; // Xám mờ
      case 'RESERVED': return 'bg-blue-100 border-blue-400 text-blue-700'; // Xanh nước biển
      case 'OCCUPIED': return 'bg-red-100 border-red-400 text-red-700'; // Đỏ
      case 'CLEANING': return 'bg-yellow-100 border-yellow-400 text-yellow-700'; // Vàng
      case 'MAINTENANCE': return 'bg-gray-800 border-black text-gray-100 line-through opacity-80 cursor-not-allowed'; // Đen
      default: return 'bg-emerald-100 border-emerald-400 text-emerald-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đặt bàn & Sơ đồ</h1>
          <p className="text-gray-500 text-sm mt-1">
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
        {/* You can add Shift filter here if needed */}
      </div>

      <div className="flex gap-4">
        {/* Legend */}
        <div className="w-64 shrink-0 bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-fit space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Chú giải trạng thái</h3>
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-400"></div><span className="text-sm">Trống (Sẵn sàng)</span></div>
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-gray-200 border border-gray-400 opacity-80"></div><span className="text-sm">Khách đang đặt</span></div>
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-blue-100 border border-blue-400"></div><span className="text-sm">Đã đặt trước</span></div>
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-red-100 border border-red-400"></div><span className="text-sm">Đang có khách</span></div>
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400"></div><span className="text-sm">Đang dọn dẹp</span></div>
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-gray-800 border border-black"></div><span className="text-sm">Bảo trì</span></div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex gap-2 border-b border-gray-100 mb-6">
            {branch.zones.map(z => (
              <button
                key={z._id}
                onClick={() => setSelectedZone(z._id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedZone === z._id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {z.name}
              </button>
            ))}
          </div>

          <div className="relative bg-gray-50 border-2 border-dashed border-gray-200 mx-auto overflow-auto min-h-[500px]" style={{ width: '100%', maxWidth: '800px', height: '600px' }}>
            {currentZone?.tables.map(table => {
              const status = getTableStatus(table._id);
              const tableClass = getTableColor(status);

              return (
                <div
                  key={table._id}
                  className={`absolute border-2 shadow-sm flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
                    ${table.shape === 'round' ? 'rounded-full' : 'rounded-md'}
                    ${tableClass}
                  `}
                  style={{
                    left: `${table.x}px`,
                    top: `${table.y}px`,
                    width: `${table.width}px`,
                    height: `${table.height}px`,
                  }}
                  title={`Bàn ${table.table_number} - Trạng thái: ${status}`}
                >
                  <span className="font-bold">{table.table_number}</span>
                  <span className="text-xs">{table.capacity} chỗ</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
