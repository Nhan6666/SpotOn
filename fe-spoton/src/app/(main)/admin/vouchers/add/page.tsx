'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { VoucherForm } from '@/features/admin/vouchers/components/VoucherForm';
import { createVoucherAction } from '@/features/admin/vouchers/vouchers.actions';
import { AdminVoucherCreateRequest } from '@/features/admin/vouchers/vouchers.types';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

export default function AddVoucherPage() {
    const router = useRouter();
    const { success, error } = useToast();

    const handleSubmit = async (payload: AdminVoucherCreateRequest) => {
        const result = await createVoucherAction(payload);
        if (result.success) {
            success(ADMIN_TEXTS.vouchers.page.addSuccess);
            router.push('/admin/vouchers');
        } else {
            error(result.error || ADMIN_TEXTS.vouchers.page.addError);
            throw new Error(result.error || ADMIN_TEXTS.vouchers.form.errGeneric);
        }
    };

    return (
        <div className="p-6">
            <VoucherForm onSubmit={handleSubmit} />
        </div>
    );
}
