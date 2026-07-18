'use client';

import React, { useEffect, useState } from 'react';
import { financeService, RevenueStats, Transaction, RefundAudit } from './finance.service';
import { useToast } from '@/components/ui/Toast';
import { DollarSign, TrendingUp, Undo2, ArrowDownRight, ArrowUpRight, Receipt, Activity, ShieldCheck, Eye } from 'lucide-react';
import { branchService } from '@/features/admin/branches/branches.service';

export function AdminFinanceFeature() {
  const { error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'REFUND_AUDIT'>('DASHBOARD');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<RefundAudit[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Proof Modal
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchService.getBranches();
        setBranches(data);
      } catch (err) {
        showError('Không thể tải danh sách chi nhánh');
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'DASHBOARD') {
          const data = await financeService.getRevenueStats(selectedBranch, dateRange.start, dateRange.end);
          setStats(data);
        } else if (activeTab === 'TRANSACTIONS') {
          const data = await financeService.getTransactions(selectedBranch, dateRange.start, dateRange.end);
          setTransactions(data);
        } else if (activeTab === 'REFUND_AUDIT') {
          const data = await financeService.getRefundAudits(selectedBranch);
          setRefunds(data);
        }
      } catch (err: any) {
        showError(err.message || 'Lỗi tải dữ liệu tài chính');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, selectedBranch, dateRange]);

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="bg-blue-100 p-4 rounded-full text-blue-600">
          <TrendingUp className="w-8 h-8" />
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">Tổng Thu (Gross Revenue)</p>
          <h3 className="text-2xl font-bold text-gray-900">{(stats?.total_revenue || 0).toLocaleString()}đ</h3>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="bg-red-100 p-4 rounded-full text-red-600">
          <Undo2 className="w-8 h-8" />
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">Tổng Hoàn Tiền (Refunds)</p>
          <h3 className="text-2xl font-bold text-gray-900 text-red-600">-{(stats?.total_refunds || 0).toLocaleString()}đ</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-green-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -z-10"></div>
        <div className="bg-green-100 p-4 rounded-full text-green-600">
          <DollarSign className="w-8 h-8" />
        </div>
        <div>
          <p className="text-green-800 text-sm font-medium">Doanh Thu Thuần (Net Revenue)</p>
          <h3 className="text-3xl font-bold text-green-700">{(stats?.net_revenue || 0).toLocaleString()}đ</h3>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
          <tr>
            <th className="px-6 py-4">Thời gian</th>
            <th className="px-6 py-4">Chi nhánh</th>
            <th className="px-6 py-4">Mã tham chiếu (Đơn)</th>
            <th className="px-6 py-4">Loại giao dịch</th>
            <th className="px-6 py-4 text-right">Số tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map(t => (
            <tr key={t._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-gray-500">{new Date(t.date).toLocaleString('vi-VN')}</td>
              <td className="px-6 py-4 font-medium">{t.branch_id?.name || 'N/A'}</td>
              <td className="px-6 py-4 font-mono text-xs text-gray-500">{t.booking_id?._id.slice(-6).toUpperCase() || 'N/A'}</td>
              <td className="px-6 py-4">
                {t.amount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-md text-xs font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Thu tiền
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-md text-xs font-bold">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Hoàn tiền
                  </span>
                )}
              </td>
              <td className={`px-6 py-4 text-right font-bold text-base ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}đ
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Không có giao dịch nào trong khoảng thời gian này.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderRefundAudit = () => (
    <div className="grid gap-4">
      {refunds.map(r => (
        <div key={r._id} className={`bg-white rounded-2xl border ${r.status === 'REFUND_COMPLETED' ? 'border-green-200' : 'border-amber-200'} shadow-sm p-5`}>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#{r._id.slice(-6).toUpperCase()}</span>
                <span className="text-sm font-bold text-gray-900">{r.branch_id?.name}</span>
                {r.status === 'REFUND_COMPLETED' ? (
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-bold"><ShieldCheck className="w-3.5 h-3.5"/> Đã kiểm toán (Hoàn tất)</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold"><Activity className="w-3.5 h-3.5"/> Manager chưa xử lý</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Khách hàng</p>
                  <p className="font-semibold text-gray-900">{r.customer_id?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Số tiền hoàn</p>
                  <p className="font-bold text-red-600 text-lg">{(r.refund_info?.refund_amount || 0).toLocaleString()}đ <span className="text-xs text-gray-500 font-normal">({r.refund_info?.refund_percentage}%)</span></p>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-100">
                <span className="font-semibold">Lý do/Ghi chú:</span> {r.cancellation_reason}
              </div>
            </div>
            
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
              <p className="text-xs font-bold text-gray-500 mb-2 text-center uppercase tracking-wider">Chứng từ giao dịch</p>
              {r.refund_info?.refund_proof_url ? (
                <div 
                  className="relative group cursor-pointer rounded-xl overflow-hidden border border-gray-200"
                  onClick={() => setSelectedProof(r.refund_info?.refund_proof_url || null)}
                >
                  <img src={r.refund_info.refund_proof_url} alt="Proof" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs text-center p-4">
                  Chưa có ảnh chứng từ
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {refunds.length === 0 && (
        <div className="text-center p-12 bg-white rounded-2xl border border-gray-200">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không có dữ liệu hoàn tiền nào cần kiểm toán.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-blue-600" /> Trung tâm Tài chính & Kiểm toán
          </h1>
          <p className="text-gray-500 mt-1">Giám sát doanh thu, luồng tiền và kiểm toán các giao dịch hoàn tiền (Refunds).</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {branches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          {activeTab !== 'REFUND_AUDIT' && (
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-300 shadow-sm">
              <input 
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border-none text-sm focus:ring-0"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border-none text-sm focus:ring-0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 inline-flex">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'DASHBOARD' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Doanh thu
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'TRANSACTIONS' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Sổ cái Giao dịch
        </button>
        <button
          onClick={() => setActiveTab('REFUND_AUDIT')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'REFUND_AUDIT' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Kiểm toán Hoàn tiền (Audit)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {activeTab === 'DASHBOARD' && renderDashboard()}
          {activeTab === 'TRANSACTIONS' && renderTransactions()}
          {activeTab === 'REFUND_AUDIT' && renderRefundAudit()}
        </div>
      )}

      {/* Modal Xem Ảnh Chứng Từ */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProof(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selectedProof} alt="Proof" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
            <button 
              onClick={() => setSelectedProof(null)}
              className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-xl hover:bg-gray-100"
            >
              <Eye className="w-6 h-6" />
            </button>
            <div className="text-center mt-4">
              <span className="text-white bg-black/50 px-4 py-2 rounded-full text-sm backdrop-blur-md">
                Ảnh chứng từ được Upload bởi Manager
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
