import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { socket } from '@/lib/socket';
import { useToast } from '@/components/ui/Toast';
import { BookingTicket } from './kds.types';
import { kdsService } from './kds.service';

export function useKds() {
  const { user } = useAuth();
  const { showError } = useToast();
  
  const [tickets, setTickets] = useState<BookingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timer để tính thời gian cảnh báo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchActiveTickets = useCallback(async () => {
    if (!user?.branch_id) return;
    
    setIsLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeTickets = await kdsService.getActiveTickets(
      user.branch_id,
      today.toISOString(),
      tomorrow.toISOString()
    );

    setTickets(activeTickets);
    setIsLoading(false);
  }, [user?.branch_id]);

  useEffect(() => {
    fetchActiveTickets();
  }, [fetchActiveTickets]);

  // Lắng nghe Socket
  useEffect(() => {
    if (!user?.branch_id) return;
    
    socket.connect();
    socket.emit('join_branch_room', user.branch_id);

    const onOrderUpdated = () => fetchActiveTickets();
    const onNewKitchenOrder = () => {
      fetchActiveTickets();
    };

    socket.on('order_status_changed', onOrderUpdated);
    socket.on('new_order_kitchen', onNewKitchenOrder);
    socket.on('NEW_KITCHEN_ORDER', onNewKitchenOrder);

    return () => {
      socket.off('order_status_changed', onOrderUpdated);
      socket.off('new_order_kitchen', onNewKitchenOrder);
      socket.off('NEW_KITCHEN_ORDER', onNewKitchenOrder);
      socket.disconnect();
    };
  }, [user?.branch_id, fetchActiveTickets]);

  const updateItemStatus = async (bookingId: string, itemId: string, status: string) => {
    // Optimistic Update
    setTickets(prev => prev.map(t => {
      if (t._id === bookingId) {
        return {
          ...t,
          order_items: t.order_items.map(item => 
            item._id === itemId ? { ...item, prep_status: status as any } : item
          )
        };
      }
      return t;
    }));

    const isSuccess = await kdsService.updateItemStatus(bookingId, itemId, status);
    if (!isSuccess) {
      showError("Lỗi cập nhật trạng thái");
      fetchActiveTickets(); // Rollback
    }
  };

  // Logic tính màu cảnh báo (SLA)
  const getTicketColor = useCallback((arrivalTimeStr: string, reservationDate: string) => {
    const arr = arrivalTimeStr.split(':');
    const targetDate = new Date(reservationDate);
    targetDate.setHours(Number(arr[0]), Number(arr[1]), 0, 0);

    const diffMinutes = Math.floor((currentTime.getTime() - targetDate.getTime()) / 60000);

    if (diffMinutes >= 20) return 'bg-red-50 border-red-300 ring-2 ring-red-500/50'; // Đỏ rực
    if (diffMinutes >= 10) return 'bg-amber-50 border-amber-300 ring-1 ring-amber-500/50'; // Vàng cam
    return 'bg-white border-gray-200'; // Xanh/Trắng an toàn
  }, [currentTime]);

  return {
    tickets,
    isLoading,
    updateItemStatus,
    getTicketColor
  };
}
