'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { Store, TrendingUp, Users, AlertCircle, RefreshCw, BarChart3, LineChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface ChainStats {
  revenueToday: number;
  ordersToday: number;
  activeBranches: number;
  overloadedBranches: number;
  totalBranches: number;
}

const mockRevenueData = [
  { name: 'T2', Doanh_thu: 12500000 },
  { name: 'T3', Doanh_thu: 15200000 },
  { name: 'T4', Doanh_thu: 14800000 },
  { name: 'T5', Doanh_thu: 18500000 },
  { name: 'T6', Doanh_thu: 24000000 },
  { name: 'T7', Doanh_thu: 32500000 },
  { name: 'CN', Doanh_thu: 28000000 },
];

const mockOrderData = [
  { name: 'Sáng', Đơn_hàng: 45 },
  { name: 'Trưa', Đơn_hàng: 120 },
  { name: 'Chiều', Đơn_hàng: 60 },
  { name: 'Tối', Đơn_hàng: 155 },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await http.get<{ success: boolean; data: ChainStats }>('/stats/chain/dashboard');
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch chain dashboard stats", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan toàn chuỗi</h1>
          <p className="text-gray-500 mt-1">Xin chào {user?.full_name}, đây là số liệu hoạt động của hệ thống hôm nay.</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Doanh thu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-600">Doanh thu hôm nay</span>
            </div>
            <div className="mt-auto relative z-10">
              <span className="text-3xl font-bold text-gray-900">
                {formatVND(stats.revenueToday)}
              </span>
            </div>
          </div>

          {/* Số đơn */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-blue-500" />
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-600">Tổng số đơn (đã hoàn thành)</span>
            </div>
            <div className="mt-auto relative z-10">
              <span className="text-3xl font-bold text-gray-900">
                {stats.ordersToday}
              </span>
            </div>
          </div>

          {/* Chi nhánh đang hoạt động */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Store className="w-16 h-16 text-[#ea580c]" />
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2.5 bg-orange-50 text-[#ea580c] rounded-lg">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-600">Chi nhánh đang mở</span>
            </div>
            <div className="mt-auto relative z-10 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {stats.activeBranches}
              </span>
              <span className="text-sm font-medium text-gray-500">/ {stats.totalBranches}</span>
            </div>
          </div>

          {/* Cảnh báo chi nhánh quá tải */}
          <div className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow ${stats.overloadedBranches > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertCircle className={`w-16 h-16 ${stats.overloadedBranches > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className={`p-2.5 rounded-lg ${stats.overloadedBranches > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className={`font-semibold ${stats.overloadedBranches > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                Chi nhánh báo động (FULL)
              </span>
            </div>
            <div className="mt-auto relative z-10 flex items-center justify-between">
              <span className={`text-3xl font-bold ${stats.overloadedBranches > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.overloadedBranches}
              </span>
              {stats.overloadedBranches > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 bg-red-600 text-white rounded-full uppercase tracking-wider animate-pulse">
                  Cần chú ý
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Biểu đồ */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Doanh thu 7 ngày qua (Mock data) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Doanh thu 7 ngày qua</h3>
                <p className="text-xs text-gray-500">Dữ liệu tham khảo (Mock Data)</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={mockRevenueData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `${value / 1000000}M`} />
                  <RechartsTooltip
                    formatter={(value: number) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Doanh thu']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="Doanh_thu" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Phân bổ đơn hàng trong ngày (Mock data) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Đơn hàng theo khung giờ</h3>
                <p className="text-xs text-gray-500">Dữ liệu tham khảo (Mock Data)</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockOrderData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <RechartsTooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Đơn_hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
