"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { http } from '@/lib/http';
import { Users, DollarSign, Receipt, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

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
  const [isHandling, setIsHandling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  const fetchStats = async () => {
    if (!user?.branch_id) return;
    try {
      const data = await http.get<{ success: boolean; data: DashboardStats }>(`/stats/branch/${user.branch_id}/dashboard`);
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverloadClick = () => {
    setShowConfirmModal(true);
  };

  const handleOverload = async () => {
    if (!user?.branch_id) return;
    setIsHandling(true);
    try {
      await http.put(`/branches/${user.branch_id}`, { status: 'FULL' });
      // Force refresh stats after handle
      await fetchStats();
      setShowConfirmModal(false);
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái chi nhánh.");
    } finally {
      setIsHandling(false);
    }
  };

  const handleReopenClick = () => {
    setShowReopenModal(true);
  };

  const handleReopen = async () => {
    if (!user?.branch_id) return;
    setIsHandling(true);
    try {
      await http.put(`/branches/${user.branch_id}`, { status: 'ACTIVE' });
      // Force refresh stats after handle
      await fetchStats();
      setShowReopenModal(false);
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái chi nhánh.");
    } finally {
      setIsHandling(false);
    }
  };

  useEffect(() => {
    if (!user?.branch_id) return;
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
              {stats?.isOverloaded && stats?.branchStatus !== 'FULL' && (
                <button 
                  onClick={handleOverloadClick}
                  disabled={isHandling}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Xử lý quá tải (Set FULL)
                </button>
              )}
              {stats?.branchStatus === 'FULL' && (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-md border border-red-200">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    Đã chuyển trạng thái FULL
                  </span>
                  <button 
                    onClick={handleReopenClick}
                    disabled={isHandling}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isHandling ? 'Đang xử lý...' : 'Mở nhận khách lại'}
                  </button>
                </div>
              )}
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

      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="sm">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Xác nhận Đóng cửa?</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Chi nhánh của bạn sẽ được chuyển sang trạng thái <b>FULL</b> (Hết chỗ). Mọi kênh đặt bàn mới sẽ bị vô hiệu hóa tạm thời.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition-colors text-sm"
              disabled={isHandling}
            >
              Hủy
            </button>
            <button 
              onClick={handleOverload}
              disabled={isHandling}
              className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center"
            >
              {isHandling ? 'Đang xử lý...' : 'Đồng ý chuyển'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReopenModal} onClose={() => setShowReopenModal(false)} maxWidth="sm">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4 mx-auto">
            <AlertCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Xác nhận Mở lại?</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Chi nhánh sẽ được chuyển về trạng thái <b>Hoạt động (ACTIVE)</b> và bắt đầu nhận khách trở lại.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowReopenModal(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition-colors text-sm"
              disabled={isHandling}
            >
              Hủy
            </button>
            <button 
              onClick={handleReopen}
              disabled={isHandling}
              className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center"
            >
              {isHandling ? 'Đang xử lý...' : 'Mở cửa lại'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
