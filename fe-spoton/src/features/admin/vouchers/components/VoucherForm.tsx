'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VoucherItem, AdminVoucherCreateRequest, computeStatus } from '../vouchers.types';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

// ─── Helpers ────────────────────────────────────────────────────────────────

const parsePriceInput = (value: string): string => value.replace(/\D/g, '');

const formatPriceInput = (value: string): string => {
    if (!value) return '';
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return '';
    return new Intl.NumberFormat('vi-VN').format(parsed);
};

function formatDatetimeLocal(isoString: string | undefined): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function TimeSelect({ value, onChange, options, disabled }: { value: string, onChange: (val: string) => void, options: string[], disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className="bg-transparent border-none focus:ring-0 text-sm disabled:text-slate-500 outline-none cursor-pointer text-center hover:bg-slate-100 rounded px-1 py-1 min-w-[2rem]"
            >
                {value}
            </button>
            {open && !disabled && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-14 bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto z-50 py-1 no-scrollbar">
                    {options.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-center px-2 py-1.5 text-sm hover:bg-slate-100 transition-colors ${value === opt ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function CustomTimePicker({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) {
    const [h, m] = value ? value.split(':') : ['00', '00'];
    const hours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="relative flex items-center shrink-0 border-l border-slate-200 px-2 py-1">
            <TimeSelect disabled={disabled} value={h} options={hours} onChange={newH => onChange(`${newH}:${m}`)} />
            <span className="text-slate-400 font-medium mx-0.5">:</span>
            <TimeSelect disabled={disabled} value={m} options={minutes} onChange={newM => onChange(`${h}:${newM}`)} />
            <Clock size={16} className="text-slate-400 ml-1 pointer-events-none" />
        </div>
    );
}

// ─── Form State ─────────────────────────────────────────────────────────────

export const EMPTY_FORM = {
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

export type VoucherFormState = typeof EMPTY_FORM;

function validateForm(formData: VoucherFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    const code = formData.code.trim();

    if (!code) errors.code = ADMIN_TEXTS.vouchers.form.errCodeReq;
    else if (!/^[A-Z0-9_-]{3,50}$/.test(code)) errors.code = ADMIN_TEXTS.vouchers.form.errCodeFormat;

    const dp = Number(formData.discount_percentage);
    if (isNaN(dp) || dp <= 0 || dp > 100) errors.discount_percentage = ADMIN_TEXTS.vouchers.form.errDiscountValue;

    if (!formData.startDate) errors.startDate = ADMIN_TEXTS.vouchers.form.errStartReq;
    if (!formData.endDate) errors.endDate = ADMIN_TEXTS.vouchers.form.errEndReq;

    if (formData.startDate && formData.endDate) {
        const start = new Date(`${formData.startDate}T${formData.startTime}:00.000Z`);
        const end = new Date(`${formData.endDate}T${formData.endTime}:00.000Z`);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start)
            errors.endDate = ADMIN_TEXTS.vouchers.form.errEndBeforeStart;
    }

    return errors;
}

export function buildPayload(formData: VoucherFormState): AdminVoucherCreateRequest {
    return {
        code: formData.code.trim(),
        branch_id: formData.branch_id || null,
        discount_percentage: Number(formData.discount_percentage) || 0,
        max_discount_amount: parseNullablePrice(formData.max_discount_amount),
        min_order_value: parseNullablePrice(formData.min_order_value) || 0,
        usage_limit: parseNullableNumber(formData.usage_limit),
        valid_from: new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString(),
        valid_until: new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString(),
        is_active: formData.is_active,
    };
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

// ─── Component ──────────────────────────────────────────────────────────────

interface VoucherFormProps {
    initialData?: VoucherItem;
    onSubmit: (payload: AdminVoucherCreateRequest) => Promise<void>;
}

export function VoucherForm({ initialData, onSubmit }: VoucherFormProps) {
    const router = useRouter();
    const [data, setData] = useState<VoucherFormState>(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setTick] = useState(0);

    const nowLocalStr = formatDatetimeLocal(new Date().toISOString());

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 10000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (initialData) {
            const startLocal = initialData.valid_from ? formatDatetimeLocal(initialData.valid_from) : '';
            const endLocal = initialData.valid_until ? formatDatetimeLocal(initialData.valid_until) : '';
            setData({
                code: initialData.code,
                branch_id: initialData.branch_id || '',
                discount_percentage: String(initialData.discount_percentage),
                max_discount_amount: initialData.max_discount_amount ? String(initialData.max_discount_amount) : '',
                min_order_value: String(initialData.min_order_value),
                usage_limit: initialData.usage_limit ? String(initialData.usage_limit) : '',
                startDate: startLocal ? startLocal.split('T')[0] : '',
                startTime: startLocal ? startLocal.split('T')[1] : '00:00',
                endDate: endLocal ? endLocal.split('T')[0] : '',
                endTime: endLocal ? endLocal.split('T')[1] : '23:59',
                is_active: initialData.is_active,
            });
        }
    }, [initialData]);

    function updateForm<K extends keyof VoucherFormState>(key: K, value: VoucherFormState[K]) {
        setData((prev) => ({ ...prev, [key]: value }));
        setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    }

    const handleSubmitClick = async () => {
        const errors = validateForm(data);

        // Validate that dates are not in the past (only if they are new or being changed)
        const now = new Date();
        const start = new Date(`${data.startDate}T${data.startTime}:00`);
        const end = new Date(`${data.endDate}T${data.endTime}:00`);
        
        // Trừ đi 1 phút cho now để tránh lỗi khi người dùng vừa chọn thời gian hiện tại
        const nowMinus1Min = new Date(now.getTime() - 60000);

        const initialStart = initialData ? new Date(initialData.valid_from).getTime() : null;
        const initialEnd = initialData ? new Date(initialData.valid_until).getTime() : null;

        const isNewOrChangedStart = !initialData || initialStart !== start.getTime();
        if (isNewOrChangedStart && !isNaN(start.getTime()) && start < nowMinus1Min) {
            errors.startDate = ADMIN_TEXTS.vouchers.form.errStartPast;
        }

        const isNewOrChangedEnd = !initialData || initialEnd !== end.getTime();
        if (isNewOrChangedEnd && !isNaN(end.getTime()) && end < nowMinus1Min) {
            errors.endDate = ADMIN_TEXTS.vouchers.form.errEndPast;
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(buildPayload(data));
        } catch (err: any) {
            setError(err.message || ADMIN_TEXTS.vouchers.form.errGeneric);
            setIsSubmitting(false); // Only set false if error, on success we navigate away
        }
    };

    const isRunning = initialData ? computeStatus(initialData) === 'active' : false;
    const isScheduled = initialData ? computeStatus(initialData) === 'scheduled' : false;
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/vouchers" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {initialData ? ADMIN_TEXTS.vouchers.form.titleEdit : ADMIN_TEXTS.vouchers.form.titleAdd}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {initialData ? ADMIN_TEXTS.vouchers.form.descEdit : ADMIN_TEXTS.vouchers.form.descAdd}
                    </p>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-6 space-y-6">
                    {isRunning && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg text-sm flex gap-3 items-start">
                            <div className="mt-0.5">⚠️</div>
                            <div>
                                <strong>{ADMIN_TEXTS.vouchers.form.lblStatusActive}</strong>
                                <p className="mt-1 opacity-90">{ADMIN_TEXTS.vouchers.form.descStatusActive}</p>
                            </div>
                        </div>
                    )}
                    {isScheduled && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm flex gap-3 items-start">
                            <div className="mt-0.5">🗓️</div>
                            <div>
                                <strong>{ADMIN_TEXTS.vouchers.form.lblStatusScheduled}</strong>
                                <p className="mt-1 opacity-90">{ADMIN_TEXTS.vouchers.form.descStatusScheduled}</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label={ADMIN_TEXTS.vouchers.form.lblCode} required>
                            <input disabled={isRunning} value={data.code} onChange={(e) => updateForm('code', e.target.value.toUpperCase())} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder={ADMIN_TEXTS.vouchers.form.placeholderCode} />
                            {fieldErrors.code && <p className="text-red-500 text-xs mt-1">{fieldErrors.code}</p>}
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblBranch}>
                            <select disabled={isRunning} value={data.branch_id} onChange={(e) => updateForm('branch_id', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900">
                                <option value="">{ADMIN_TEXTS.vouchers.form.valAllBranch}</option>
                                <option value="6600a98f1234567890abcdef">Chi nhánh Quận 1 (Mock)</option>
                                <option value="6600a98f1234567890abcded">Chi nhánh Quận 3 (Mock)</option>
                            </select>
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblDiscount} required>
                            <input disabled={isRunning} type="number" min="1" max="100" value={data.discount_percentage} onChange={(e) => updateForm('discount_percentage', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="VD: 20" />
                            {fieldErrors.discount_percentage && <p className="text-red-500 text-xs mt-1">{fieldErrors.discount_percentage}</p>}
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblMaxDiscount}>
                            <input disabled={isRunning} type="text" inputMode="numeric" value={formatPriceInput(data.max_discount_amount)} onChange={(e) => updateForm('max_discount_amount', parsePriceInput(e.target.value))} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder={ADMIN_TEXTS.vouchers.form.placeholderMaxDiscount} />
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblMinOrder}>
                            <input disabled={isRunning} type="text" inputMode="numeric" value={formatPriceInput(data.min_order_value)} onChange={(e) => updateForm('min_order_value', parsePriceInput(e.target.value))} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Mặc định: 0đ" />
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblUsageLimit}>
                            <input type="number" min="1" value={data.usage_limit} onChange={(e) => updateForm('usage_limit', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder={ADMIN_TEXTS.vouchers.form.placeholderUsageLimit} />
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblStart} required>
                            <div className={`flex items-center w-full border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900 ${isRunning ? 'bg-slate-50' : 'bg-white'}`}>
                                <input disabled={isRunning} type="date" min={nowLocalStr.split('T')[0]} value={data.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="w-full px-4 py-2 bg-transparent border-none focus:ring-0 text-sm disabled:text-slate-500 outline-none rounded-l-lg" />
                                <CustomTimePicker disabled={isRunning} value={data.startTime} onChange={(val) => updateForm('startTime', val)} />
                            </div>
                            {fieldErrors.startDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.startDate}</p>}
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblEnd} required>
                            <div className="flex items-center w-full bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900">
                                <input type="date" min={data.startDate || nowLocalStr.split('T')[0]} value={data.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="w-full px-4 py-2 bg-transparent border-none focus:ring-0 text-sm outline-none rounded-l-lg" />
                                <CustomTimePicker value={data.endTime} onChange={(val) => updateForm('endTime', val)} />
                            </div>
                            {fieldErrors.endDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.endDate}</p>}
                        </Field>
                        <Field label={ADMIN_TEXTS.vouchers.form.lblActive}>
                            <select value={data.is_active ? 'true' : 'false'} onChange={(e) => updateForm('is_active', e.target.value === 'true')} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900">
                                <option value="true">Bật (Active)</option>
                                <option value="false">Tạm dừng / Bản nháp</option>
                            </select>
                        </Field>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <Link href="/admin/vouchers" className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        {ADMIN_TEXTS.vouchers.form.btnCancel}
                    </Link>
                    <button onClick={handleSubmitClick} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 inline-flex items-center gap-2 shadow-sm">
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        {isSubmitting ? ADMIN_TEXTS.vouchers.form.submitting : (initialData ? ADMIN_TEXTS.vouchers.form.btnSave : ADMIN_TEXTS.vouchers.form.btnCreate)}
                    </button>
                </div>
            </div>
        </div>
    );
}
