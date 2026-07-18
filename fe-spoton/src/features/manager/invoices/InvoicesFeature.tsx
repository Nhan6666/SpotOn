"use client";

import React from 'react';
import { Receipt, Search, Filter, AlertCircle, CheckCircle2, Clock, ArrowRight, Undo2 } from 'lucide-react';
import { useInvoices } from './useInvoices';
import { CheckoutModal } from '../check-in/components/CheckoutModal';
import { RefundModal } from '../check-in/components/RefundModal';
import { Button } from '@/components/ui/Button';

export function InvoicesFeature() {
  const {
    isLoading,
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredInvoices,
    stats,
    selectedBookingForCheckout,
    setSelectedBookingForCheckout,
    fetchInvoices
  } = useInvoices();

  const [selectedBookingForRefund, setSelectedBookingForRefund] = React.useState<any>(null);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-blue-600" /> Lịch sử Checkout & Đối soát
          </h1>
          <p className="text-gray-500 mt-1">Quản lý hóa đơn đã thanh toán và các bàn đã nhả chờ đối soát</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <label className="text-sm font-bold text-gray-700 pl-2">Chọn ngày:</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium text-sm"
          />
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'COMPLETED' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đã thanh toán ({stats.completed})
          </button>
          <button
            onClick={() => setActiveTab('PENDING_SETTLEMENT')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'PENDING_SETTLEMENT' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chờ đối soát ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab('REFUND_PENDING')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'REFUND_PENDING' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Yêu cầu hoàn tiền ({(stats as any).refundPending || 0})
          </button>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm theo tên, SĐT, mã đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full md:w-72"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Đang tải dữ liệu hóa đơn...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-500">
            <Receipt className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Không có hóa đơn nào</p>
            <p>Thử đổi ngày hoặc điều kiện tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Mã Đơn</th>
                  <th className="px-6 py-4">Khách Hàng</th>
                  <th className="px-6 py-4">Giờ Đến</th>
                  <th className="px-6 py-4">Bàn</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4 text-right">Tổng Tiền / Cần Thu</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => {
                  const customerName = invoice.customer_id?.full_name || invoice.walk_in_name || 'Khách vãng lai';
                  const phone = invoice.customer_id?.phone || invoice.walk_in_phone || 'N/A';
                  const tableNames = invoice.assigned_tables?.map(t => t.table_number).join(', ') || 'N/A';
                  
                  const items = invoice.order_items || [];
                  const calculatedTotal = items.reduce((acc, item) => acc + (item.price_at_time * item.quantity), 0);
                  const totalBill = calculatedTotal > 0 ? calculatedTotal : (invoice.pre_order_total_amount || 0);
                  const depositPaid = invoice.total_deposit_paid || 0;
                  const amountToPay = Math.max(0, totalBill - depositPaid);

                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {invoice._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{customerName}</p>
                        <p className="text-gray-500 text-xs">{phone}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {invoice.arrival_time}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-bold">
                          {tableNames}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {invoice.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã thanh toán
                          </span>
                        ) : invoice.status === 'REFUND_COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold">
                            <Undo2 className="w-3.5 h-3.5" />
                            Đã hoàn tiền
                          </span>
                        ) : invoice.status === 'CANCELLED_REFUND_PENDING' ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold">
                            <Undo2 className="w-3.5 h-3.5" />
                            Y/c hoàn tiền
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Chờ đối soát
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {invoice.status === 'COMPLETED' ? (
                          <span className="font-bold text-gray-900 text-base">
                            {invoice.final_bill_amount?.toLocaleString() || 0}đ
                          </span>
                        ) : invoice.status === 'REFUND_COMPLETED' ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-gray-900 text-base">
                              {invoice.final_bill_amount?.toLocaleString() || 0}đ
                            </span>
                            <span className="text-xs text-red-600 font-bold">
                              Hoàn: -{((invoice as any).refund_info?.refund_amount || 0).toLocaleString()}đ
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 line-through">{totalBill.toLocaleString()}đ</span>
                            <span className="font-bold text-blue-600 text-base">
                              {amountToPay.toLocaleString()}đ
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.status === 'PENDING_SETTLEMENT' ? (
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            onClick={() => setSelectedBookingForCheckout(invoice)}
                          >
                            Thanh toán <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        ) : invoice.status === 'CANCELLED_REFUND_PENDING' ? (
                          <Button 
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                            onClick={() => setSelectedBookingForRefund(invoice)}
                          >
                            Xử lý hoàn tiền <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        ) : invoice.status === 'COMPLETED' ? (
                          <Button 
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 font-semibold"
                            onClick={() => setSelectedBookingForRefund(invoice)}
                          >
                            <Undo2 className="w-3.5 h-3.5 mr-1" /> Hoàn tiền
                          </Button>
                        ) : invoice.status === 'REFUND_COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
                            <Undo2 className="w-3 h-3" /> Đã hoàn tiền
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBookingForCheckout && (
        <CheckoutModal 
          booking={selectedBookingForCheckout}
          onClose={() => setSelectedBookingForCheckout(null)}
          onSuccess={() => {
            setSelectedBookingForCheckout(null);
            fetchInvoices();
          }}
        />
      )}

      {selectedBookingForRefund && (
        <RefundModal 
          booking={selectedBookingForRefund}
          onClose={() => setSelectedBookingForRefund(null)}
          onSuccess={() => {
            setSelectedBookingForRefund(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
