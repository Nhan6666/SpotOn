'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { VoucherForm } from '@/features/admin/vouchers/components/VoucherForm';
import { createVoucherAction } from '@/features/admin/vouchers/vouchers.actions';
import { AdminVoucherCreateRequest } from '@/features/admin/vouchers/vouchers.types';

export default function AddVoucherPage() {
    const router = useRouter();
    const { success, error } = useToast();

    const handleSubmit = async (payload: AdminVoucherCreateRequest) => {
        const result = await createVoucherAction(payload);
        if (result.success) {
            success('Đã tạo voucher thành công');
            router.push('/admin/vouchers');
        } else {
            error(result.error || 'Đã xảy ra lỗi khi tạo voucher');
            throw new Error(result.error || 'Lỗi');
        }
    };

    return (
        <div className="p-6">
            <VoucherForm onSubmit={handleSubmit} />
        </div>
    );
}
