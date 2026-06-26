import { http } from '@/lib/http';
import { VoucherItem, AdminVoucherCreateRequest, AdminVoucherUpdateRequest } from './vouchers.types';

const ENDPOINT = '/vouchers';

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function fetchVouchersAction() {
    try {
        const res = await http.get<ApiListResponse<VoucherItem>>(ENDPOINT);
        return { success: true, data: res?.data || [] };
    } catch (error: any) {
        return { success: false, error: error.message || 'Lỗi khi tải danh sách voucher' };
    }
}

export async function createVoucherAction(payload: AdminVoucherCreateRequest) {
    try {
        const res = await http.post<ApiSingleResponse<VoucherItem>>(ENDPOINT, payload);
        return { success: true, data: res.data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Lỗi khi tạo voucher' };
    }
}

export async function updateVoucherAction(id: string, payload: AdminVoucherUpdateRequest) {
    try {
        const res = await http.put<ApiSingleResponse<VoucherItem>>(`${ENDPOINT}/${id}`, payload);
        return { success: true, data: res.data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Lỗi khi cập nhật voucher' };
    }
}

export async function endEarlyVoucherAction(id: string) {
    try {
        // "Kết thúc sớm" tức là gán valid_until về thời điểm hiện tại và tắt active
        const payload = {
            is_active: false,
            valid_until: new Date().toISOString()
        };
        const res = await http.put<ApiSingleResponse<VoucherItem>>(`${ENDPOINT}/${id}`, payload);
        return { success: true, data: res.data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Lỗi khi kết thúc sớm voucher' };
    }
}

export async function deleteVoucherAction(id: string) {
    try {
        await http.delete(`${ENDPOINT}/${id}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Lỗi khi xóa voucher' };
    }
}
