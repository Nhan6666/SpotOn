export interface VoucherItem {
    _id: string;
    code: string;
    branch_id: string | null;
    discount_percentage: number;
    max_discount_amount?: number;
    min_order_value: number;
    min_guest_count?: number;
    valid_from: string;
    valid_until: string;
    usage_limit?: number;
    used_count: number;
    is_active: boolean;
    is_public: boolean;
}

export type VoucherStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

export function computeStatus(voucher: VoucherItem): VoucherStatus {
    if (!voucher.is_active) return 'inactive';
    const now = new Date();
    const from = new Date(voucher.valid_from);
    const until = new Date(voucher.valid_until);
    if (now < from) return 'scheduled';
    if (now > until) return 'expired';
    return 'active';
}

export interface AdminVoucherCreateRequest {
    code: string;
    branch_id?: string | null;
    discount_percentage: number;
    max_discount_amount?: number;
    min_order_value?: number;
    min_guest_count?: number;
    valid_from: string;
    valid_until: string;
    usage_limit?: number;
    is_active: boolean;
    is_public: boolean;
}

export interface AdminVoucherUpdateRequest extends Partial<AdminVoucherCreateRequest> {}
