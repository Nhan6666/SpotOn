"use client";

import React from 'react';
import { Clock, ChefHat, CheckCircle2, RotateCcw, Flame } from 'lucide-react';
import { useKds } from './useKds';

export function KdsFeature() {
  const { tickets, isLoading, updateItemStatus, getTicketColor } = useKds();

  if (isLoading) return <div className="p-8 text-center text-slate-400">Đang tải hệ thống Bếp...</div>;

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="text-orange-500" /> KDS - Kitchen Display System
          </h1>
          <p className="text-slate-400 text-sm">Chế độ hiển thị: Vé từng Bàn (Ticket View)</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-slate-300"><span className="w-3 h-3 rounded-full bg-white"></span> Bình thường</div>
          <div className="flex items-center gap-1 text-slate-300"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Chờ &gt; 10p</div>
          <div className="flex items-center gap-1 text-slate-300"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> Chờ &gt; 20p</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
        {tickets.map(ticket => {
          const name = ticket.customer_id?.full_name || ticket.walk_in_name || 'Khách vãng lai';
          const tableNames = ticket.assigned_tables?.map(t => t.table_number).join(', ') || 'N/A';
          const ticketColor = getTicketColor(ticket.arrival_time, ticket.reservation_date);
          
          // Lọc ra các món chưa phục vụ, đẩy món READY xuống cuối
          const displayItems = ticket.order_items
            .filter(item => item.prep_status !== 'SERVED')
            .sort((a, b) => {
              if (a.prep_status === 'READY' && b.prep_status !== 'READY') return 1;
              if (a.prep_status !== 'READY' && b.prep_status === 'READY') return -1;
              return 0;
            });

          if (displayItems.length === 0) return null; // Ẩn thẻ nếu tất cả đã SERVED

          return (
            <div key={ticket._id} className={`rounded-xl border shadow-lg overflow-hidden transition-colors ${ticketColor}`}>
              <div className="p-3 border-b border-black/10 flex justify-between items-center bg-black/5">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Bàn {tableNames}</h3>
                  <p className="text-gray-600 text-xs">{name}</p>
                </div>
                <div className="bg-white/80 px-2 py-1 rounded text-sm font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                  <Clock className="w-3 h-3" /> {ticket.arrival_time}
                </div>
              </div>

              <div className="p-2 space-y-2">
                {displayItems.map(item => {
                  const isReady = item.prep_status === 'READY';
                  const isPrep = item.prep_status === 'PREPARING';

                  return (
                    <div 
                      key={item._id} 
                      className={`relative rounded-lg p-3 border transition-all ${
                        isReady ? 'bg-emerald-50 border-emerald-200 opacity-80' : 
                        isPrep ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className={`font-bold ${isReady ? 'text-emerald-800 line-through' : 'text-gray-900'} text-base leading-tight`}>
                            {item.quantity}x {item.name}
                          </p>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{item.type}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {item.prep_status === 'PENDING' && (
                          <button 
                            onClick={() => updateItemStatus(ticket._id, item._id, 'PREPARING')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"
                          >
                            <ChefHat className="w-3 h-3" /> Nấu
                          </button>
                        )}
                        
                        {item.prep_status === 'PREPARING' && (
                          <>
                            <button 
                              onClick={() => updateItemStatus(ticket._id, item._id, 'PENDING')}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 rounded flex items-center justify-center"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => updateItemStatus(ticket._id, item._id, 'READY')}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Xong
                            </button>
                          </>
                        )}

                        {item.prep_status === 'READY' && (
                          <button 
                            onClick={() => updateItemStatus(ticket._id, item._id, 'PREPARING')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-2 rounded flex items-center justify-center gap-1 text-xs font-medium w-full"
                          >
                            <RotateCcw className="w-3 h-3" /> Hủy hoàn thành (Undo)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {tickets.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-xl border border-white/10">
            <ChefHat className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-xl font-medium">Bếp đang rảnh rỗi</p>
            <p className="text-sm">Chưa có order nào cần chuẩn bị.</p>
          </div>
        )}
      </div>
    </div>
  );
}
