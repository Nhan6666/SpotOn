"use client";

import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { usePos } from './usePos';
import { TableMap } from './components/TableMap';
import { BookingSidebar } from './components/BookingSidebar';
import { TableActionModal } from './components/TableActionModal';
import { WalkInModal } from './components/WalkInModal';
import { OrderMenuModal } from './components/OrderMenuModal';
import { useAuth } from '@/providers/AuthProvider';

export function PosFeature() {
  const { user } = useAuth();
  const {
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
    handleUpdateTableStatus,
  } = usePos();

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải POS...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" /> POS Phục Vụ
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Quản lý sơ đồ bàn và gọi món</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <TableMap 
          zones={zones} 
          selectedZone={selectedZone} 
          setSelectedZone={setSelectedZone} 
          setSelectedTable={setSelectedTable} 
        />

        <BookingSidebar 
          bookings={bookings} 
          zones={zones}
          activeShift={activeShift} 
          setActiveShift={setActiveShift} 
        />
      </div>

      {selectedTable && (
        <TableActionModal 
          table={selectedTable}
          activeBooking={
            bookings.find(b => 
              b.status === 'IN_USE' && 
              (b.table_ids?.includes(selectedTable._id) || b.assigned_tables?.some(t => t.table_number === selectedTable.table_number))
            ) || null
          }
          onClose={() => setSelectedTable(null)}
          onOpenWalkIn={(table) => {
            setGuestCount(table.capacity);
            setOpenWalkInModal(table);
          }}
          onOpenMenu={(table) => {
            const activeBooking = bookings.find(b => 
              b.status === 'IN_USE' && 
              (b.table_ids?.includes(table._id) || b.assigned_tables?.some(t => t.table_number === table.table_number))
            );
            
            if (activeBooking) {
              setOpenOrderModal({ table, bookingId: activeBooking._id });
              setSelectedTable(null);
            } else {
              alert("Không tìm thấy Booking đang hoạt động cho bàn này. Vui lòng F5 lại trang.");
              console.log("Current bookings:", bookings);
              console.log("Target table:", table);
            }
          }}
          onUpdateStatus={handleUpdateTableStatus}
          isSubmitting={isSubmitting}
        />
      )}

      {openWalkInModal && (
        <WalkInModal
          table={openWalkInModal}
          guestCount={guestCount}
          setGuestCount={setGuestCount}
          onClose={() => setOpenWalkInModal(null)}
          onSubmit={handleOpenTable}
          isSubmitting={isSubmitting}
        />
      )}

      {openOrderModal && user?.branch_id && (() => {
        const activeBooking = bookings.find(b => b._id === openOrderModal.bookingId);
        return (
          <OrderMenuModal
            booking={activeBooking}
            tableNumber={openOrderModal.table.table_number}
            branchId={user.branch_id}
            onClose={() => setOpenOrderModal(null)}
            onSubmitSuccess={() => {}}
          />
        );
      })()}
    </div>
  );
}
