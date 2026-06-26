'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    Plus, Search, Edit, Trash2, Tag, CheckCircle, Clock, XCircle, Copy, Filter, X, Loader2, StopCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast'; // Assuming Toast context exists in SpotOn
import {
    fetchVouchersAction,
    createVoucherAction,
    updateVoucherAction,
    deleteVoucherAction,
    endEarlyVoucherAction
} from './vouchers.actions';
import { VoucherItem, AdminVoucherCreateRequest, AdminVoucherUpdateRequest, computeStatus, VoucherStatus } from './vouchers.types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const parsePriceInput = (value: string): string => value.replace(/\D/g, '');

const formatPriceInput = (value: string): string => {
    if (!value) return '';
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return '';
    return new Intl.NumberFormat('vi-VN').format(parsed);
};

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
}

function usagePercent(voucher: VoucherItem): number {
    if (!voucher.usage_limit || voucher.usage_limit <= 0) return 0;
    return Math.min(100, Math.round(((voucher.used_count ?? 0) / voucher.usage_limit) * 100));
}

function parseLocalDate(value: string): Date | undefined {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return undefined;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatLocalDate(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function extractDatePart(value?: string): string {
    if (!value) return '';
    return value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? '';
}

function extractTimePart(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    return value.match(/T(\d{2}:\d{2})/)?.[1] ?? fallback;
}

function combineDateTime(date: string, time: string): string {
    if (!date) return '';
    const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
    return `${date}T${safeTime}:00.000Z`;
}

function parseNullableNumber(value: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function parseNullablePrice(value: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(parsePriceInput(value));
    return Number.isNaN(parsed) ? undefined : parsed;
}

// ─── Form State ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
    code: '', 
    branch_id: '',
    discount_percentage: '', 
    max_discount_amount: '', 
    min_order_value: '0', 
    usage_limit: '', 
    startDate: '', startTime: '00:00', 
    endDate: '', endTime: '23:59',
    is_active: true,
};

type VoucherFormState = typeof EMPTY_FORM;
type IndexedPromotion = {
    item: VoucherItem;
    status: VoucherStatus;
    searchText: string;
};

function validateForm(formData: VoucherFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    const code = formData.code.trim();

    if (!code) errors.code = 'Mã voucher là bắt buộc';
    else if (!/^[A-Z0-9_-]{3,50}$/.test(code)) errors.code = 'Mã chỉ chứa chữ in hoa, số, gạch nối';

    const dp = Number(formData.discount_percentage);
    if (isNaN(dp) || dp <= 0 || dp > 100) errors.discount_percentage = 'Mức giảm giá phải từ 1% đến 100%';

    if (!formData.startDate) errors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) errors.endDate = 'Ngày kết thúc là bắt buộc';

    if (formData.startDate && formData.endDate) {
        const start = new Date(combineDateTime(formData.startDate, formData.startTime));
        const end = new Date(combineDateTime(formData.endDate, formData.endTime));
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start)
            errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    return errors;
}

function buildPayload(formData: VoucherFormState): AdminVoucherCreateRequest {
    return {
        code: formData.code.trim(),
        branch_id: formData.branch_id || null,
        discount_percentage: Number(formData.discount_percentage) || 0,
        max_discount_amount: parseNullablePrice(formData.max_discount_amount),
        min_order_value: parseNullablePrice(formData.min_order_value) || 0,
        usage_limit: parseNullableNumber(formData.usage_limit),
        valid_from: combineDateTime(formData.startDate, formData.startTime),
        valid_until: combineDateTime(formData.endDate, formData.endTime),
        is_active: formData.is_active,
    };
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

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
    return (
        <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="text-xs font-medium text-slate-500">
                {label} {required && <span className="text-red-500">*</span>}
            </span>
            {children}
        </label>
    );
}

export default function VouchersFeature() {
    const { toast } = useToast();
    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => toast(msg, type);

    const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formState, setFormState] = useState<{
        isOpen: boolean;
        isSubmitting: boolean;
        error: string | null;
        data: VoucherFormState;
        editingItem: VoucherItem | null;
        fieldErrors: Record<string, string>;
    }>({
        isOpen: false,
        isSubmitting: false,
        error: null,
        data: EMPTY_FORM,
        editingItem: null,
        fieldErrors: {},
    });

    const loadData = async () => {
        setIsLoading(true);
        const res = await fetchVouchersAction();
        if (res.success && res.data) {
            setVouchers(res.data);
        } else {
            // Error loading
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
            searchText: `${item.code}`.toLowerCase(),
        })), [vouchers]);

    const filteredVouchers = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        return indexedVouchers.filter(({ status, searchText }) => {
            const matchesSearch = !normalized || searchText.includes(normalized);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [indexedVouchers, searchTerm, statusFilter]);

    function updateForm<K extends keyof VoucherFormState>(key: K, value: VoucherFormState[K]) {
        setFormState((prev) => ({
            ...prev,
            data: { ...prev.data, [key]: value },
            fieldErrors: { ...prev.fieldErrors, [key]: '' }
        }));
    }

    const openCreateForm = () => {
        setFormState((prev) => ({
            ...prev,
            editingItem: null,
            data: EMPTY_FORM,
            error: null,
            fieldErrors: {},
            isOpen: true,
        }));
    };

    const openEditForm = (voucher: VoucherItem) => {
        setFormState((prev) => ({
            ...prev,
            editingItem: voucher,
            error: null,
            fieldErrors: {},
            data: {
                code: voucher.code,
                branch_id: voucher.branch_id || '',
                discount_percentage: String(voucher.discount_percentage),
                max_discount_amount: voucher.max_discount_amount ? String(voucher.max_discount_amount) : '',
                min_order_value: String(voucher.min_order_value),
                usage_limit: voucher.usage_limit ? String(voucher.usage_limit) : '',
                startDate: extractDatePart(voucher.valid_from),
                startTime: extractTimePart(voucher.valid_from, '00:00'),
                endDate: extractDatePart(voucher.valid_until),
                endTime: extractTimePart(voucher.valid_until, '23:59'),
                is_active: voucher.is_active,
            },
            isOpen: true,
        }));
    };

    const closeForm = () => {
        setFormState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleSubmit = async () => {
        const errors = validateForm(formState.data);
        if (Object.keys(errors).length > 0) {
            setFormState((prev) => ({ ...prev, fieldErrors: errors }));
            return;
        }

        setFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

        const payload = buildPayload(formState.data);
        let result;
        if (formState.editingItem) {
            result = await updateVoucherAction(formState.editingItem._id, payload);
        } else {
            result = await createVoucherAction(payload);
        }

        if (result.success) {
            showToast(formState.editingItem ? 'Đã cập nhật voucher' : 'Đã tạo voucher thành công', 'success');
            closeForm();
            loadData();
        } else {
            setFormState((prev) => ({ ...prev, error: result.error || 'Đã xảy ra lỗi' }));
        }
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
    };

    const handleEndEarly = async (voucher: VoucherItem) => {
        if (!window.confirm(`Bạn có chắc chắn muốn kết thúc sớm mã ${voucher.code}?`)) return;
        const result = await endEarlyVoucherAction(voucher._id);
        if (result.success) {
            showToast('Đã kết thúc sớm voucher', 'success');
            loadData();
        } else {
            showToast(result.error || 'Lỗi khi kết thúc sớm', 'error');
        }
    };

    const handleDelete = async (voucher: VoucherItem) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa mã ${voucher.code}? Hành động này không thể hoàn tác.`)) return;
        const result = await deleteVoucherAction(voucher._id);
        if (result.success) {
            showToast('Đã xóa voucher', 'success');
            loadData();
        } else {
            showToast(result.error || 'Lỗi khi xóa', 'error');
        }
    };

    // Business rule checks
    const isRunning = formState.editingItem ? computeStatus(formState.editingItem) === 'active' : false;
    const isScheduled = formState.editingItem ? computeStatus(formState.editingItem) === 'scheduled' : false;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Khuyến mãi</h1>
                    <p className="text-slate-500 text-sm mt-1">Tạo và quản lý các mã giảm giá cho nhà hàng</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm active:scale-95 cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Tạo Voucher mới</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {['all', 'active', 'scheduled', 'expired', 'inactive'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {status === 'all' ? 'Tất cả' : STATUS_BADGE_STYLES[status as VoucherStatus].label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute inset-y-0 left-3 my-auto text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm mã voucher..."
                            className="block w-full py-2 pl-10 pr-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
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
                            ) : filteredVouchers.length === 0 ? (
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
                                filteredVouchers.map(({ item: promo, status }) => (
                                    <tr key={promo._id} className="hover:bg-slate-50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <code className="px-2 py-1 bg-primary-50 text-primary-700 rounded font-mono text-sm font-semibold">{promo.code}</code>
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
                                                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${usagePercent(promo)}%` }} />
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
                                                <button onClick={() => openEditForm(promo)} className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 transition-colors" title="Chỉnh sửa">
                                                    <Edit size={18} />
                                                </button>
                                                {status === 'active' ? (
                                                    <button onClick={() => handleEndEarly(promo)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Kết thúc sớm">
                                                        <StopCircle size={18} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleDelete(promo)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Xóa">
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
            </div>

            {/* Modal Form */}
            {formState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{formState.editingItem ? 'Sửa Khuyến mãi' : 'Tạo Khuyến mãi mới'}</h3>
                            </div>
                            <button onClick={closeForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {isRunning && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg text-sm mb-4">
                                    <strong>Lưu ý:</strong> Voucher này đang chạy, bạn chỉ có thể chỉnh sửa thời gian kết thúc hoặc tăng giới hạn sử dụng.
                                </div>
                            )}
                            {isScheduled && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm mb-4">
                                    Voucher này đã được lên lịch. Bạn có thể chỉnh sửa thông tin trước khi nó bắt đầu.
                                </div>
                            )}
                            {formState.error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 text-sm">{formState.error}</div>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Mã Voucher" required>
                                    <input disabled={isRunning} value={formState.data.code} onChange={(e) => updateForm('code', e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100" placeholder="VD: SUMMER20" />
                                    {formState.fieldErrors.code && <p className="text-red-500 text-xs mt-1">{formState.fieldErrors.code}</p>}
                                </Field>
                                <Field label="Chi nhánh áp dụng">
                                    <select disabled={isRunning} value={formState.data.branch_id} onChange={(e) => updateForm('branch_id', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100">
                                        <option value="">Toàn chuỗi</option>
                                        <option value="6600a98f1234567890abcdef">Chi nhánh Quận 1 (Mock)</option>
                                        <option value="6600a98f1234567890abcded">Chi nhánh Quận 3 (Mock)</option>
                                    </select>
                                </Field>
                                <Field label="Giảm giá (%)" required>
                                    <input disabled={isRunning} type="number" min="1" max="100" value={formState.data.discount_percentage} onChange={(e) => updateForm('discount_percentage', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100" placeholder="VD: 20" />
                                    {formState.fieldErrors.discount_percentage && <p className="text-red-500 text-xs mt-1">{formState.fieldErrors.discount_percentage}</p>}
                                </Field>
                                <Field label="Giảm tối đa (VNĐ)">
                                    <input disabled={isRunning} type="text" inputMode="numeric" value={formatPriceInput(formState.data.max_discount_amount)} onChange={(e) => updateForm('max_discount_amount', parsePriceInput(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100" placeholder="Không giới hạn" />
                                </Field>
                                <Field label="Đơn tối thiểu (VNĐ)">
                                    <input disabled={isRunning} type="text" inputMode="numeric" value={formatPriceInput(formState.data.min_order_value)} onChange={(e) => updateForm('min_order_value', parsePriceInput(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100" placeholder="Mặc định: 0đ" />
                                </Field>
                                <Field label="Tổng lượt dùng">
                                    <input type="number" min="1" value={formState.data.usage_limit} onChange={(e) => updateForm('usage_limit', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Không giới hạn" />
                                </Field>
                                <Field label="Bắt đầu từ" required>
                                    <div className="flex gap-2">
                                        <input disabled={isRunning} type="date" value={formState.data.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100" />
                                        <input disabled={isRunning} type="time" value={formState.data.startTime} onChange={(e) => updateForm('startTime', e.target.value)} className="w-24 shrink-0 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100" />
                                    </div>
                                    {formState.fieldErrors.startDate && <p className="text-red-500 text-xs mt-1">{formState.fieldErrors.startDate}</p>}
                                </Field>
                                <Field label="Kết thúc vào" required>
                                    <div className="flex gap-2">
                                        <input type="date" value={formState.data.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                        <input type="time" value={formState.data.endTime} onChange={(e) => updateForm('endTime', e.target.value)} className="w-24 shrink-0 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                    </div>
                                    {formState.fieldErrors.endDate && <p className="text-red-500 text-xs mt-1">{formState.fieldErrors.endDate}</p>}
                                </Field>
                                <Field label="Trạng thái">
                                    <select value={formState.data.is_active ? 'true' : 'false'} onChange={(e) => updateForm('is_active', e.target.value === 'true')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                        <option value="true">Bật (Active)</option>
                                        <option value="false">Tạm dừng / Bản nháp</option>
                                    </select>
                                </Field>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={closeForm} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
                            <button onClick={handleSubmit} disabled={formState.isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 inline-flex items-center gap-2">
                                {formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                Lưu Voucher
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
