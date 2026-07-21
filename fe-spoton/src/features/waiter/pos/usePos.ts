import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { posService } from './pos.service';
import { socket } from '@/lib/socket';
import { Zone, Booking, Table } from './pos.types';

export function usePos() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [activeShift, setActiveShift] = useState<'LUNCH'|'DINNER'>('LUNCH');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [openWalkInModal, setOpenWalkInModal] = useState<Table | null>(null);
  const [openOrderModal, setOpenOrderModal] = useState<{table: Table, bookingId: string} | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBranchData = useCallback(async () => {
    if (!user?.branch_id) return;
    try {
      setIsLoading(true);
      // Fetch Zones & Tables
      const data = await posService.getBranchData(user.branch_id);
      setZones(data.zones || []);
      if (!selectedZone && data.zones?.length > 0) {
        setSelectedZone(data.zones[0]._id);
      }

      // Fetch Today's Bookings
      const todayBookings = await posService.getTodayBookings(user.branch_id);
      const upcoming = todayBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_USE');
      upcoming.sort((a, b) => a.arrival_time.localeCompare(b.arrival_time));
      setBookings(upcoming);

    } catch (err) {
      showError("Không thể tải sơ đồ bàn.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branch_id, selectedZone, showError]);

  useEffect(() => {
    fetchBranchData();
  }, [fetchBranchData]);

  // Real-time updates
  useEffect(() => {
    if (!user?.branch_id) return;
    socket.connect();
    socket.emit('join_branch_room', user.branch_id);

    const onTableStatusChanged = () => fetchBranchData();

    socket.on('table_status_changed', onTableStatusChanged);
    return () => {
      socket.off('table_status_changed', onTableStatusChanged);
    };
  }, [user?.branch_id, fetchBranchData]);

  const handleOpenTable = async () => {
    if (!openWalkInModal || !user?.branch_id) return;
    setIsSubmitting(true);
    try {
      const zoneName = zones.find(z => z._id === selectedZone)?.name || 'N/A';
      const res = await posService.openWalkInTable(
        openWalkInModal._id, 
        openWalkInModal.table_number, 
        zoneName, 
        guestCount
      );

      if (res.success) {
        success(res.message || "Đã mở bàn thành công!");
        setOpenWalkInModal(null);
        setSelectedTable(null);
        fetchBranchData();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "Lỗi khi mở bàn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWaitingList = async (guestCount: number, customerName: string, phone: string, note: string = '') => {
    if (!user?.branch_id) return;
    setIsSubmitting(true);
    try {
      const res = await posService.createWaitingList(guestCount, customerName, phone, note);
      if (res.success) {
        success("Đã đưa khách vào Waiting List thành công!");
        fetchBranchData(); // Cập nhật lại danh sách bookings để thấy Waiting List
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "Lỗi khi thêm vào Waiting List.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTableStatus = async (status: string) => {
    if (!selectedTable || !user?.branch_id) return;
    setIsSubmitting(true);
    try {
      const res = await posService.updateTableStatus(user.branch_id, selectedTable._id, status);
      if (res.success) {
        success("Cập nhật trạng thái bàn thành công!");
        setSelectedTable(null);
      }
    } catch (err: any) {
      showError("Lỗi cập nhật trạng thái bàn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    zones,
    bookings,
    selectedZone,
    setSelectedZone,
    activeShift,
    setActiveShift,
    isLoading,
    selectedTable,
    setSelectedTable,
    openWalkInModal,
    setOpenWalkInModal,
    openOrderModal,
    setOpenOrderModal,
    guestCount,
    setGuestCount,
    isSubmitting,
    handleOpenTable,
    handleCreateWaitingList,
    handleUpdateTableStatus,
  };
}
