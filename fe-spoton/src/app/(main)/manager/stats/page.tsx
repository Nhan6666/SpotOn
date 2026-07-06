"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { Users, DollarSign, Receipt, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  revenueToday: number;
  ordersToday: number;
  waitingCustomers: number;
  currentCapacityPercent: number;
  isOverloaded: boolean;
  overloadThreshold: number;
  branchStatus: string;
}

export default function ManagerStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.branch_id) return;

    const fetchStats = async () => {
      try {
        const data = await http.get(`/stats/branch/${user.branch_id}/dashboard`);
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Tự động refresh mỗi phút
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ef5914]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Thống kê Tổng quan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Báo cáo thời gian thực về tình hình hoạt động của chi nhánh.
          </p>
        </div>
        {stats?.isOverloaded && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            Chi nhánh đang quá tải!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Doanh thu */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Doanh thu hôm nay</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.revenueToday ? stats.revenueToday.toLocaleString('vi-VN') : '0'} ₫
            </h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Số đơn */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Số đơn hôm nay</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.ordersToday || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <Receipt className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Khách chờ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Khách đang chờ</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.waitingCustomers || 0}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <Users className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Công suất */}
        <div className={`bg-white rounded-2xl p-6 shadow-sm border ${stats?.isOverloaded ? 'border-red-300' : 'border-gray-100'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Tải hiện tại</p>
              <h3 className={`text-2xl font-bold ${stats?.isOverloaded ? 'text-red-600' : 'text-gray-900'}`}>
                {stats?.currentCapacityPercent?.toFixed(1) || 0}%
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${stats?.isOverloaded ? 'bg-red-50' : 'bg-purple-50'}`}>
              <TrendingUp className={`w-6 h-6 ${stats?.isOverloaded ? 'text-red-600' : 'text-purple-600'}`} />
            </div>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${stats?.isOverloaded ? 'bg-red-500' : 'bg-purple-500'}`} 
              style={{ width: `${Math.min(stats?.currentCapacityPercent || 0, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Ngưỡng quá tải: {stats?.overloadThreshold}%</p>
        </div>
      </div>
    </div>
  );
}
