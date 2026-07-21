import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { socket } from '@/lib/socket';
import { BranchData, Booking, Table } from './bookings.types';
import { managerBookingsService } from './bookings.service';

export function useManagerBookings() {
  const { user } = useAuth();
  
  const [branch, setBranch] = useState<BranchData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('LUNCH');
  const [isLoading, setIsLoading] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

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
    const branchId = user?.branch_id;
    if (!branchId) return;
    const data = await managerBookingsService.getBranchData(branchId);
    if (data) {
      setBranch(data);
      if (data.zones?.length > 0) {
        setSelectedZone(data.zones[0]._id);
      }
    }
  }, [user?.branch_id]);

  const fetchBookings = useCallback(async () => {
    const branchId = user?.branch_id;
    if (!branchId) return;
    setIsLoading(true);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const data = await managerBookingsService.getBookings(
      branchId,
      targetDate.toISOString(),
      nextDate.toISOString()
    );

    let list = data;
    if (shift) {
      list = list.filter(b => b.shift === shift);
    }
    setBookings(list.filter(b => 
      b.status !== 'COMPLETED' && 
      !(b.status && b.status.startsWith('CANCELLED')) && 
      b.status !== 'NO_SHOW' &&
      b.status !== 'REFUND_COMPLETED' &&
      b.status !== 'WRITE_OFF'
    ));
    
    setIsLoading(false);
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
      fetchBookings(); 
      fetchBranchData(); 
    };

    socket.on('table_status_changed', onTableStatusChanged);

    return () => {
      socket.off('table_status_changed', onTableStatusChanged);
      socket.disconnect();
    };
  }, [user?.branch_id, fetchBookings, fetchBranchData]);

  // Helper function to determine table status based on bookings
  const getTableStatus = useCallback((table: Table) => {
    const tableBookings = bookings.filter(b => b.table_ids?.some((id: any) => id.toString() === table._id.toString()) && b.shift === shift);
    if (tableBookings.length > 0) {
      if (tableBookings.some(b => b.status === 'IN_USE')) return 'OCCUPIED';
      if (tableBookings.some(b => b.status === 'CLEANING')) return 'CLEANING';
      if (tableBookings.some(b => b.status === 'CONFIRMED')) return 'RESERVED';
      if (tableBookings.some(b => ['PENDING_PAYMENT', 'PENDING_DEPOSIT'].includes(b.status))) return 'LOCKED';
      if (tableBookings.some(b => b.status === 'HOLDING')) return 'HOLDING';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date === todayStr) {
      return (shift === 'LUNCH' ? table.status_lunch : table.status_dinner) || table.status || 'EMPTY';
    }
    
    return 'EMPTY';
  }, [bookings, shift, date]);

  return {
    branch,
    bookings,
    selectedZone,
    setSelectedZone,
    date,
    setDate,
    shift,
    setShift,
    isLoading,
    isPanning,
    selectedTable,
    setSelectedTable,
    canvasRef,
    containerRef,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    fetchBookings,
    getTableStatus
  };
}
