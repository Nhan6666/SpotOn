'use client';

import React, { useEffect, useState } from 'react';
import { transactionsService, RevenueStats, Transaction } from './transactions.service';
import { useToast } from '@/components/ui/Toast';
import { DollarSign, TrendingUp, Undo2, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

export function ManagerTransactionsFeature() {
  const { error: showError } = useToast();

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, txData] = await Promise.all([
          transactionsService.getRevenueStats(dateRange.start, dateRange.end),
          transactionsService.getTransactions(dateRange.start, dateRange.end),
        ]);
        setStats(statsData);
        setTransactions(txData);
      } catch (err: any) {
        showError(err.message || 'Lỗi tải dữ liệu giao dịch');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-orange-600" /> Lịch sử Giao dịch
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Tổng hợp các dòng tiền vào/ra tại chi nhánh của bạn.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          <input 
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="border-none text-sm focus:ring-0 bg-transparent"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input 
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="border-none text-sm focus:ring-0 bg-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Tổng Thu</p>
            <h3 className="text-xl font-bold text-gray-900">{(stats?.total_revenue || 0).toLocaleString()}đ</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <Undo2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Tổng Hoàn tiền</p>
            <h3 className="text-xl font-bold text-red-600">-{(stats?.total_refunds || 0).toLocaleString()}đ</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-green-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-green-700 text-xs font-medium uppercase tracking-wider">Doanh Thu Thuần</p>
            <h3 className="text-2xl font-bold text-green-700">{(stats?.net_revenue || 0).toLocaleString()}đ</h3>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Sổ cái Giao dịch</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{transactions.length} giao dịch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Thời gian</th>
                <th className="px-6 py-3 font-semibold">Mã tham chiếu</th>
                <th className="px-6 py-3 font-semibold">Loại</th>
                <th className="px-6 py-3 font-semibold text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map(t => (
                <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-gray-500 text-xs">{new Date(t.date).toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-gray-400">{t.booking_id?._id?.slice(-6).toUpperCase() || '—'}</td>
                  <td className="px-6 py-3.5">
                    {t.amount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-bold">
                        <ArrowUpRight className="w-3 h-3" /> Thu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs font-bold">
                        <ArrowDownRight className="w-3 h-3" /> Hoàn tiền
                      </span>
                    )}
                  </td>
                  <td className={`px-6 py-3.5 text-right font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}đ
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                    <Wallet className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    Không có giao dịch nào trong khoảng thời gian này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
