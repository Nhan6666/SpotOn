"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { fetchBookings, updateBookingStatus } from "./booking-list.service";
import type { Booking, BookingStatus } from "./booking-list.types";
import { Loader2, Calendar, Search, Users, Phone, Clock, FileText } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  PENDING_DEPOSIT: { label: "Chờ cọc", color: "text-amber-700", bg: "bg-amber-100" },
  CONFIRMED: { label: "Đã xác nhận", color: "text-blue-700", bg: "bg-blue-100" },
  COMPLETED: { label: "Hoàn thành", color: "text-emerald-700", bg: "bg-emerald-100" },
  CANCELLED: { label: "Đã hủy", color: "text-red-700", bg: "bg-red-100" },
  NO_SHOW: { label: "Vắng mặt", color: "text-gray-700", bg: "bg-gray-200" },
};

interface BookingListFeatureProps {
  branchId: string;
}

export function BookingListFeature({ branchId }: BookingListFeatureProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const { success, error: showError } = useToast();

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const res = await fetchBookings();
      if (res.success && res.data) {
        // Lọc booking thuộc về chi nhánh hiện tại
        const branchBookings = res.data.filter((b: Booking) => b.branch_id === branchId);
        setBookings(branchBookings);
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      showError("Không thể tải danh sách đặt bàn.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [branchId]);

  useEffect(() => {
    let result = bookings;

    // Lọc theo ngày
    if (selectedDate) {
      const targetDate = new Date(selectedDate);
      result = result.filter(b => isSameDay(parseISO(b.reservation_date), targetDate));
    }

    // Lọc theo trạng thái
    if (statusFilter !== "ALL") {
      result = result.filter(b => b.status === statusFilter);
    }

    // Tìm kiếm theo tên/SĐT
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => {
        const name = b.customer_id?.full_name || b.walk_in_name || "";
        const phone = b.customer_id?.phone || b.walk_in_phone || "";
        return name.toLowerCase().includes(q) || phone.includes(q);
      });
    }

    setFilteredBookings(result);
  }, [bookings, selectedDate, statusFilter, searchQuery]);

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const res = await updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        success(`Cập nhật trạng thái thành công.`);
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
      } else {
        showError("Cập nhật thất bại.");
      }
    } catch (err) {
      console.error("Failed to update booking status", err);
      showError("Đã có lỗi xảy ra.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Danh sách đặt bàn (Hàng ngày)</h1>
          <p className="text-gray-500 text-sm">Quản lý và theo dõi khách hàng đến quán.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên khách hoặc số điện thoại..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm cursor-pointer"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_DEPOSIT">Chờ cọc</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="NO_SHOW">Vắng mặt</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 border-b border-gray-200 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Bàn & Khách</th>
                <th className="px-6 py-4">Ghi chú</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-600">Không có đơn đặt bàn nào</p>
                    <p className="text-sm mt-1">Thử thay đổi ngày hoặc bộ lọc trạng thái</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const name = booking.customer_id?.full_name || booking.walk_in_name || "Khách Vãng Lai";
                  const phone = booking.customer_id?.phone || booking.walk_in_phone || "Không có SĐT";
                  const config = STATUS_CONFIG[booking.status];

                  return (
                    <tr key={booking._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                          <Clock className="w-4 h-4 text-blue-500" />
                          {booking.arrival_time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{name}</div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                          <Phone className="w-3 h-3" />
                          {phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 mb-1 text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">{booking.guest_count}</span> khách
                        </div>
                        {booking.assigned_tables && booking.assigned_tables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {booking.assigned_tables.map((t, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {t.table_number} ({t.zone_name})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">Chưa xếp bàn</span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={booking.note || "Không có"}>
                        {booking.note ? (
                          <span className="text-gray-600">{booking.note}</span>
                        ) : (
                          <span className="text-gray-400 italic">Không có</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg} ${config.color} border-${config.color.split('-')[1]}-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none text-center`}
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking._id, e.target.value as BookingStatus)}
                        >
                          <option value="PENDING_DEPOSIT">Chờ cọc</option>
                          <option value="CONFIRMED">Đã xác nhận</option>
                          <option value="COMPLETED">Hoàn thành</option>
                          <option value="CANCELLED">Đã hủy</option>
                          <option value="NO_SHOW">Vắng mặt</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
