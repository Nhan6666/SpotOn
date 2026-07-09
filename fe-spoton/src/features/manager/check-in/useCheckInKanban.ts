import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { Booking } from './check-in.types';
import { checkInService } from './check-in.service';
import { managerBookingsService } from '../bookings/bookings.service';
import { Zone } from '@/features/admin/map-editor/map-editor.types';

export function useCheckInKanban() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleDateString('en-CA');
  });

  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState<Booking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.branch_id) return;
    
    try {
      setIsLoading(true);
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const [data, branchData] = await Promise.all([
        checkInService.getBookings(
          user.branch_id, 
          targetDate.toISOString(), 
          nextDate.toISOString()
        ),
        managerBookingsService.getBranchData(user.branch_id)
      ]);

      if (branchData) setZones(branchData.zones);

      // Chỉ lấy những đơn quan tâm cho Kanban
      const activeBookings = data.filter(b => ['CONFIRMED', 'IN_USE'].includes(b.status));
      setBookings(activeBookings);
    } catch (err) {
      showError("Không thể tải danh sách đặt bàn.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branch_id, selectedDate, showError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Chia cột Kanban
  const { incoming, late, inUse } = useMemo(() => {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const todayStr = now.toLocaleDateString('en-CA');

    return bookings.reduce(
      (acc, booking) => {
        if (booking.status === 'IN_USE') {
          acc.inUse.push(booking);
        } else if (booking.status === 'CONFIRMED') {
          if (selectedDate < todayStr) {
            acc.late.push(booking);
          } else if (selectedDate > todayStr) {
            acc.incoming.push(booking);
          } else {
            // Today
            if (booking.arrival_time < currentTimeStr) {
              acc.late.push(booking);
            } else {
              acc.incoming.push(booking);
            }
          }
        }
        return acc;
      },
      { incoming: [] as Booking[], late: [] as Booking[], inUse: [] as Booking[] }
    );
  }, [bookings, selectedDate]);

  const handleCheckIn = async (bookingId: string) => {
    // Optimistic UI update
    setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'IN_USE' } : b));

    try {
      const isSuccess = await checkInService.checkInBooking(bookingId);
      if (isSuccess) {
        success("Đã Check-in thành công!");
      } else {
        throw new Error("Lỗi từ server");
      }
    } catch (err) {
      showError("Lỗi Check-in. Đã khôi phục trạng thái cũ.");
      fetchBookings();
    }
  };

  return {
    isLoading,
    selectedDate,
    setSelectedDate,
    incoming,
    late,
    inUse,
    handleCheckIn,
    selectedBookingForCheckout,
    setSelectedBookingForCheckout,
    selectedBookingForDetails,
    setSelectedBookingForDetails,
    fetchBookings,
    zones
  };
}
