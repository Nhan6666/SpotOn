"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { TABLE_STATUS_CONFIG, TableStatus } from '@/features/admin/map-editor/map-editor.types';
import { useManagerBookings } from './useManagerBookings';
import { BOOKING_STATUS_CONFIG } from './bookings.constants';

export function ManagerBookingsFeature() {
  const {
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
  } = useManagerBookings();

  if (!branch) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu chi nhánh...</div>;
  }

  const currentZone = branch.zones.find(z => z._id === selectedZone);

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
                        <p className="text-xs text-gray-500">SĐT: {customerPhone}</p>
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
                      <div className="bg-white p-1.5 rounded border border-gray-100 col-span-2">
                        <span className="text-gray-500 block mb-0.5">Bàn phục vụ</span>
                        <span className="font-medium">
                          {booking.table_ids?.map((tId: string) => {
                            for (const z of branch.zones) {
                              const t = z.tables.find((tbl: any) => tbl._id === tId || (tbl._id && tbl._id.toString() === tId.toString()));
                              if (t) return t.table_number;
                            }
                            return null;
                          }).filter(Boolean).join(', ') || 'Chưa xếp'}
                        </span>
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
                      pointerEvents: 'auto',
                      cursor: 'pointer'
                    }}
                    title={`Bàn ${table.table_number} - Trạng thái: ${statusConfig.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTable(table);
                    }}
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

      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTable(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Bàn {selectedTable.table_number}</h3>
            <p className="text-sm text-gray-500 mb-4">Giao diện gọi món (Self-Ordering)</p>
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                {/* Dynamically import QRCodeSVG since this is a client component */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/ipad/table/' + selectedTable._id)}`} 
                  alt="QR Code" 
                  className="w-[140px] h-[140px]"
                />
              </div>

              <div className="text-center w-full mt-2">
                <p className="text-sm text-slate-500 mb-1">Dùng mã PIN nội bộ để mở khóa</p>
                <div className="bg-slate-200/50 rounded-lg py-2 px-4 flex items-center justify-center gap-3">
                  <span className="text-sm font-bold text-slate-800">
                    (Nhân viên cung cấp PIN)
                  </span>
                </div>
              </div>
            </div>

            <button 
              className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-bold"
              onClick={() => setSelectedTable(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
