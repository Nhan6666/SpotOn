'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Loader2, StopCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
    fetchVouchersAction,
    deleteVoucherAction,
    endEarlyVoucherAction
} from './vouchers.actions';
import { VoucherItem, computeStatus, VoucherStatus } from './vouchers.types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function usagePercent(voucher: VoucherItem): number {
    if (!voucher.usage_limit || voucher.usage_limit <= 0) return 0;
    return Math.min(100, Math.round(((voucher.used_count ?? 0) / voucher.usage_limit) * 100));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_BADGE_STYLES: Record<VoucherStatus, { className: string; dot: string; label: string }> = {
    active: { className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Đang phát hành' },
    inactive: { className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', label: 'Bản nháp/Tạm dừng' },
    expired: { className: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Đã kết thúc' },
    scheduled: { className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Sắp diễn ra' },
};

function StatusBadge({ status }: { status: VoucherStatus }) {
    const { className, dot, label } = STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.inactive;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${className}`}>
            <span className={`size-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

export default function VouchersFeature() {
    const { toast } = useToast();
    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => toast(msg, type);

    const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tick, setTick] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 10000);
        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const res = await fetchVouchersAction();
        if (res.success && res.data) {
            setVouchers(res.data);
        } else {
            showToast(res.error || 'Lỗi tải danh sách', 'error');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const indexedVouchers = useMemo(() =>
        vouchers.map((item) => ({
            item,
            status: computeStatus(item),
            searchText: `${item.code} ${item.discount_percentage} ${item.max_discount_amount || ''} ${item.branch_id ? 'chi nhánh riêng' : 'toàn chuỗi'}`.toLowerCase(),
        })), [vouchers, tick]);

    const filteredVouchers = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        return indexedVouchers.filter(({ status, searchText }) => {
            const matchesSearch = !normalized || searchText.includes(normalized);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [indexedVouchers, searchTerm, statusFilter]);

    const totalItems = filteredVouchers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const showingTo = Math.min(currentPage * itemsPerPage, totalItems);

    const currentVouchers = useMemo(() => {
        return filteredVouchers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredVouchers, currentPage, itemsPerPage]);

    const pageNumbers = useMemo(() => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    }, [totalPages, currentPage]);

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'delete' | 'end_early' | null, voucher: VoucherItem | null }>({ isOpen: false, action: null, voucher: null });

    const handleConfirm = async () => {
        if (!confirmModal.voucher) return;
        const { action, voucher } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false });

        if (action === 'end_early') {
            const result = await endEarlyVoucherAction(voucher._id);
            if (result.success) {
                showToast('Đã kết thúc sớm voucher', 'success');
                loadData();
            } else {
                showToast(result.error || 'Lỗi khi kết thúc sớm', 'error');
            }
        } else if (action === 'delete') {
            const result = await deleteVoucherAction(voucher._id);
            if (result.success) {
                showToast('Đã xóa voucher', 'success');
                loadData();
            } else {
                showToast(result.error || 'Lỗi khi xóa', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Khuyến mãi</h1>
                    <p className="text-slate-500 text-sm mt-1">Tạo và quản lý các mã giảm giá cho nhà hàng</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/vouchers/add"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Tạo Voucher mới</span>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search size={18} className="absolute inset-y-0 left-3 my-auto text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm mã voucher..."
                            className="block w-full py-2 pl-10 pr-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="w-full sm:w-auto shrink-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full sm:w-48 py-2 px-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-500 focus:border-slate-500 cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang phát hành</option>
                            <option value="scheduled">Sắp diễn ra</option>
                            <option value="expired">Đã kết thúc</option>
                            <option value="inactive">Bản nháp / Tạm dừng</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[480px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-100">
                                <th className="px-6 py-4">Mã Voucher</th>
                                <th className="px-6 py-4">Giảm giá</th>
                                <th className="px-6 py-4">Lượt dùng</th>
                                <th className="px-6 py-4">Thời gian áp dụng</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" /> Đang tải...</td></tr>
                            ) : currentVouchers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Tag size={48} className="text-slate-300" />
                                            <h3 className="text-lg font-semibold text-slate-700">Chưa có voucher nào</h3>
                                            <p className="text-sm text-slate-500">Bạn chưa tạo voucher hoặc không có kết quả tìm kiếm.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentVouchers.map(({ item: promo, status }) => (
                                    <tr key={promo._id} className="hover:bg-slate-50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-mono text-sm font-semibold">{promo.code}</code>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{promo.branch_id ? 'Chi nhánh riêng' : 'Toàn chuỗi'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-emerald-600">{promo.discount_percentage}%</span>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Tối đa: {promo.max_discount_amount ? formatCurrency(promo.max_discount_amount) : 'Không giới hạn'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-24">
                                                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${usagePercent(promo)}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                                    {promo.used_count}/{promo.usage_limit ?? '∞'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-900">{formatDate(promo.valid_from)}</p>
                                            <p className="text-xs text-slate-500">Đến: {formatDate(promo.valid_until)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link href={`/admin/vouchers/${promo._id}`} className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer" title="Chỉnh sửa">
                                                    <Edit size={18} />
                                                </Link>
                                                {status === 'active' ? (
                                                    <button onClick={() => setConfirmModal({ isOpen: true, action: 'end_early', voucher: promo })} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer" title="Kết thúc sớm">
                                                        <StopCircle size={18} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setConfirmModal({ isOpen: true, action: 'delete', voucher: promo })} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Xóa">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        {totalItems === 0
                            ? 'Không có kết quả'
                            : `Đang hiển thị ${showingFrom} đến ${showingTo} trong tổng số ${totalItems} mã`}
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {pageNumbers.map((page, idx) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`w-8 h-8 flex items-center justify-center rounded font-medium text-sm transition-colors ${
                                            page === currentPage
                                                ? 'bg-[#e67e22] text-white shadow-sm'
                                                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} maxWidth="sm">
                <div className="p-6">
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${confirmModal.action === 'delete' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <AlertTriangle className={`h-6 w-6 ${confirmModal.action === 'delete' ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="mt-4 text-center">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {confirmModal.action === 'delete' ? 'Xóa Khuyến mãi' : 'Kết thúc sớm'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {confirmModal.action === 'delete' 
                                ? `Bạn có chắc chắn muốn xóa mã giảm giá "${confirmModal.voucher?.code}"? Hành động này không thể hoàn tác.`
                                : `Bạn có chắc chắn muốn kết thúc sớm mã "${confirmModal.voucher?.code}"? Người dùng sẽ không thể sử dụng mã này nữa.`}
                        </p>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button 
                            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors cursor-pointer ${
                                confirmModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                            }`}
                        >
                            {confirmModal.action === 'delete' ? 'Xóa' : 'Kết thúc'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
