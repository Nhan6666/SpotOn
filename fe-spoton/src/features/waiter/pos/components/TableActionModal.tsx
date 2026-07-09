import React from 'react';
import { UserPlus, Eraser, Coffee, Wrench, UtensilsCrossed, ScanLine, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Table, Booking } from '../pos.types';
import { QRCodeSVG } from 'qrcode.react';

interface TableActionModalProps {
  table: Table;
  activeBooking?: Booking | null;
  onClose: () => void;
  onOpenWalkIn: (table: Table) => void;
  onOpenMenu: (table: Table) => void;
  onUpdateStatus: (status: string) => void;
  isSubmitting: boolean;
}

export function TableActionModal({ 
  table,
  activeBooking,
  onClose, 
  onOpenWalkIn, 
  onOpenMenu,
  onUpdateStatus, 
  isSubmitting 
}: TableActionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Bàn {table.table_number}</h3>
        <p className="text-sm text-gray-500 mb-6">Bạn muốn thực hiện thao tác gì?</p>

        <div className="space-y-3 mb-6">
          {(table.status === 'EMPTY' || !table.status) && (
            <>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex justify-start items-center gap-3 h-12"
                onClick={() => onOpenWalkIn(table)}
                disabled={isSubmitting}
              >
                <UserPlus className="w-5 h-5" /> Mở bàn cho khách vãng lai
              </Button>
              <Button 
                variant="outline"
                className="w-full text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 flex justify-start items-center gap-3 h-12"
                onClick={() => onUpdateStatus('CLEANING')}
                disabled={isSubmitting}
              >
                <Eraser className="w-5 h-5" /> Đánh dấu Đang dọn dẹp
              </Button>
            </>
          )}

          {(table.status === 'CLEANING' || table.status === 'MAINTENANCE') && (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white flex justify-start items-center gap-3 h-12"
              onClick={() => onUpdateStatus('EMPTY')}
              disabled={isSubmitting}
            >
              <Coffee className="w-5 h-5" /> Đánh dấu Bàn Trống (Sẵn sàng)
            </Button>
          )}

          {table.status === 'EMPTY' && (
            <Button 
              variant="outline"
              className="w-full text-red-700 border-red-200 bg-red-50 hover:bg-red-100 flex justify-start items-center gap-3 h-12"
              onClick={() => onUpdateStatus('MAINTENANCE')}
              disabled={isSubmitting}
            >
              <Wrench className="w-5 h-5" /> Đánh dấu Đang bảo trì
            </Button>
          )}

          {table.status === 'OCCUPIED' && (
            <>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex justify-start items-center gap-3 h-12"
                onClick={() => onOpenMenu(table)}
                disabled={isSubmitting}
              >
                <UtensilsCrossed className="w-5 h-5" /> Gọi món bổ sung
              </Button>

              {activeBooking && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                    <ScanLine className="w-5 h-5 text-blue-600" />
                    Menu Self-Ordering (Khách tự gọi)
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <QRCodeSVG 
                      value={`${window.location.origin}/ipad/table/${table._id}`} 
                      size={140}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="text-center w-full mt-2">
                    <p className="text-sm text-slate-500 mb-1">Dùng mã PIN nội bộ để mở khóa</p>
                    <div className="bg-slate-200/50 rounded-lg py-2 px-4 flex items-center justify-center gap-3">
                      <span className="text-sm font-bold text-slate-800">
                        (Hỏi Quản lý chi nhánh)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Hủy / Đóng
        </Button>
      </div>
    </div>
  );
}
