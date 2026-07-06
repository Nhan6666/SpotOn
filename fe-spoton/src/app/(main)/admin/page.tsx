'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { Store, TrendingUp, Users, AlertCircle, RefreshCw } from 'lucide-react';

interface ChainStats {
  revenueToday: number;
  ordersToday: number;
  activeBranches: number;
  overloadedBranches: number;
  totalBranches: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await http.get<{success: boolean; data: ChainStats}>('/stats/chain/dashboard');
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
    </div>
  );
}
