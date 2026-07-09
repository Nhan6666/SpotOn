"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { socket } from '@/lib/socket';
import { RunnerList } from '../pos/components/RunnerList';
import { Booking } from '../pos/pos.types';

export function RunnerFeature() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user?.branch_id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await http.get<{ data: Booking[] }>(
        `/bookings?branch_id=${user.branch_id}&start_date=${today.toISOString()}&end_date=${tomorrow.toISOString()}`
      );
      setBookings(res.data);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user?.branch_id]);

  useEffect(() => {
    if (!user?.branch_id) return;
    socket.connect();
    socket.emit('join_branch_room', user.branch_id);

    const handleUpdate = () => fetchBookings();
    
    socket.on('table_status_changed', handleUpdate);
    socket.on('BOOKING_STATUS_CHANGED', handleUpdate);
    socket.on('order_status_changed', handleUpdate);
    socket.on('new_order_kitchen', handleUpdate);
    socket.on('NEW_KITCHEN_ORDER', handleUpdate);

    return () => {
      socket.off('table_status_changed', handleUpdate);
      socket.off('BOOKING_STATUS_CHANGED', handleUpdate);
      socket.off('order_status_changed', handleUpdate);
      socket.off('new_order_kitchen', handleUpdate);
      socket.off('NEW_KITCHEN_ORDER', handleUpdate);
    };
  }, [user?.branch_id]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải danh sách phục vụ...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)]">
      <RunnerList bookings={bookings} onRefresh={fetchBookings} />
    </div>
  );
}
