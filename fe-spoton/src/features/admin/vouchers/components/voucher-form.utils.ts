import { AdminVoucherCreateRequest } from '../vouchers.types';

export const parsePriceInput = (value: string): string => value.replace(/\D/g, '');

export const formatPriceInput = (value: string): string => {
    if (!value) return '';
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return '';
    return new Intl.NumberFormat('vi-VN').format(parsed);
};

export function formatDatetimeLocal(isoString: string | undefined): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseNullableNumber(value: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export function parseNullablePrice(value: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(parsePriceInput(value));
    return Number.isNaN(parsed) ? undefined : parsed;
}

export const EMPTY_FORM = {
    code: '', 
    branch_id: '',
    discount_percentage: '', 
    max_discount_amount: '', 
    min_order_value: '0', 
    min_guest_count: '',
    usage_limit: '', 
    startDate: '', startTime: '00:00', 
    endDate: '', endTime: '23:59',
    is_active: true,
    is_public: true,
};

export type VoucherFormState = typeof EMPTY_FORM;

export function validateForm(formData: VoucherFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    const code = formData.code.trim();

    if (!code) errors.code = 'Mã voucher là bắt buộc';
    else if (!/^[A-Z0-9_-]{3,50}$/.test(code)) errors.code = 'Mã chỉ chứa chữ in hoa, số, gạch nối';

    const dp = Number(formData.discount_percentage);
    if (isNaN(dp) || dp <= 0 || dp > 100) errors.discount_percentage = 'Mức giảm giá phải từ 1% đến 100%';

    if (!formData.startDate) errors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) errors.endDate = 'Ngày kết thúc là bắt buộc';

    if (formData.startDate && formData.endDate) {
        const start = new Date(`${formData.startDate}T${formData.startTime}:00.000Z`);
        const end = new Date(`${formData.endDate}T${formData.endTime}:00.000Z`);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start)
            errors.endDate = 'Thời gian kết thúc phải sau thời gian bắt đầu';
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
        min_guest_count: parseNullableNumber(formData.min_guest_count),
        usage_limit: parseNullableNumber(formData.usage_limit),
        valid_from: new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString(),
        valid_until: new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString(),
        is_active: formData.is_active,
        is_public: formData.is_public,
    };
}
