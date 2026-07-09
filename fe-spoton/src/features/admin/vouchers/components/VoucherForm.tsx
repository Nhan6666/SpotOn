'use client';

import type { ReactNode } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { VoucherItem, AdminVoucherCreateRequest } from '../vouchers.types';
import { formatPriceInput, parsePriceInput } from './voucher-form.utils';
import { CustomTimePicker } from './CustomTimePicker';
import { useVoucherForm } from './useVoucherForm';

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

interface VoucherFormProps {
    initialData?: VoucherItem;
    onSubmit: (payload: AdminVoucherCreateRequest) => Promise<void>;
}

export function VoucherForm({ initialData, onSubmit }: VoucherFormProps) {
    const {
        data,
        fieldErrors,
        isSubmitting,
        error,
        updateForm,
        handleSubmitClick,
        isRunning,
        isScheduled,
        nowLocalStr
    } = useVoucherForm(initialData, onSubmit);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/vouchers" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{initialData ? 'Sửa Khuyến mãi' : 'Tạo Khuyến mãi mới'}</h1>
                    <p className="text-slate-500 text-sm mt-1">Thiết lập cấu hình chi tiết cho mã giảm giá</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-6 space-y-6">
                    {isRunning && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg text-sm flex gap-3 items-start">
                            <div className="mt-0.5">⚠️</div>
                            <div>
                                <strong>Voucher đang chạy!</strong>
                                <p className="mt-1 opacity-90">Bạn chỉ có thể sửa thời gian kết thúc hoặc thay đổi giới hạn lượt dùng. Các trường khác đã bị khóa để đảm bảo an toàn dữ liệu.</p>
                            </div>
                        </div>
                    )}
                    {isScheduled && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm flex gap-3 items-start">
                            <div className="mt-0.5">🗓️</div>
                            <div>
                                <strong>Voucher đã được lên lịch.</strong>
                                <p className="mt-1 opacity-90">Bạn có thể chỉnh sửa mọi thông tin một cách an toàn trước khi thời gian áp dụng bắt đầu.</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Mã Voucher" required>
                            <input disabled={isRunning} value={data.code} onChange={(e) => updateForm('code', e.target.value.toUpperCase())} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="VD: SUMMER20" />
                            {fieldErrors.code && <p className="text-red-500 text-xs mt-1">{fieldErrors.code}</p>}
                        </Field>
                        <Field label="Chi nhánh áp dụng">
                            <select disabled={isRunning} value={data.branch_id} onChange={(e) => updateForm('branch_id', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900">
                                <option value="">Toàn chuỗi</option>
                                <option value="6600a98f1234567890abcdef">Chi nhánh Quận 1 (Mock)</option>
                                <option value="6600a98f1234567890abcded">Chi nhánh Quận 3 (Mock)</option>
                            </select>
                        </Field>
                        <Field label="Giảm giá (%)" required>
                            <input disabled={isRunning} type="number" min="1" max="100" value={data.discount_percentage} onChange={(e) => updateForm('discount_percentage', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="VD: 20" />
                            {fieldErrors.discount_percentage && <p className="text-red-500 text-xs mt-1">{fieldErrors.discount_percentage}</p>}
                        </Field>
                        <Field label="Giảm tối đa (VNĐ)">
                            <input disabled={isRunning} type="text" inputMode="numeric" value={formatPriceInput(data.max_discount_amount)} onChange={(e) => updateForm('max_discount_amount', parsePriceInput(e.target.value))} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Không giới hạn" />
                        </Field>
                        <Field label="Đơn tối thiểu (VNĐ)">
                            <input disabled={isRunning} type="text" inputMode="numeric" value={formatPriceInput(data.min_order_value)} onChange={(e) => updateForm('min_order_value', parsePriceInput(e.target.value))} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Mặc định: 0đ" />
                        </Field>
                        <Field label="Tổng lượt dùng">
                            <input type="number" min="1" value={data.usage_limit} onChange={(e) => updateForm('usage_limit', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Không giới hạn" />
                        </Field>
                        <Field label="Bắt đầu từ" required>
                            <div className={`flex items-center w-full border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900 ${isRunning ? 'bg-slate-50' : 'bg-white'}`}>
                                <input disabled={isRunning} type="date" min={nowLocalStr.split('T')[0]} value={data.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="w-full px-4 py-2 bg-transparent border-none focus:ring-0 text-sm disabled:text-slate-500 outline-none rounded-l-lg" />
                                <CustomTimePicker disabled={isRunning} value={data.startTime} onChange={(val) => updateForm('startTime', val)} />
                            </div>
                            {fieldErrors.startDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.startDate}</p>}
                        </Field>
                        <Field label="Kết thúc vào" required>
                            <div className="flex items-center w-full bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900">
                                <input type="date" min={data.startDate || nowLocalStr.split('T')[0]} value={data.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="w-full px-4 py-2 bg-transparent border-none focus:ring-0 text-sm outline-none rounded-l-lg" />
                                <CustomTimePicker value={data.endTime} onChange={(val) => updateForm('endTime', val)} />
                            </div>
                            {fieldErrors.endDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.endDate}</p>}
                        </Field>
                        <Field label="Trạng thái">
                            <select value={data.is_active ? 'true' : 'false'} onChange={(e) => updateForm('is_active', e.target.value === 'true')} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900">
                                <option value="true">Bật (Active)</option>
                                <option value="false">Tạm dừng / Bản nháp</option>
                            </select>
                        </Field>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <Link href="/admin/vouchers" className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        Hủy
                    </Link>
                    <button onClick={handleSubmitClick} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 inline-flex items-center gap-2 shadow-sm">
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        Lưu Voucher
                    </button>
                </div>
            </div>
        </div>
    );
}
