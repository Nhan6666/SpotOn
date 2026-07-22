'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { VoucherForm } from '@/features/admin/vouchers/components/VoucherForm';
import { getVoucherByIdAction, updateVoucherAction } from '@/features/admin/vouchers/vouchers.actions';
import { AdminVoucherCreateRequest, VoucherItem } from '@/features/admin/vouchers/vouchers.types';
import Link from 'next/link';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { success, error } = useToast();

    const [voucher, setVoucher] = useState<VoucherItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        if (!id) return;
        
        const loadVoucher = async () => {
            setIsLoading(true);
            const res = await getVoucherByIdAction(id);
            if (res.success && res.data) {
                setVoucher(res.data);
            } else {
                setFetchError(res.error || ADMIN_TEXTS.vouchers.page.notFound);
            }
            setIsLoading(false);
        };
        
        loadVoucher();
    }, [id]);

    const handleSubmit = async (payload: AdminVoucherCreateRequest) => {
        const result = await updateVoucherAction(id, payload);
        if (result.success) {
            success(ADMIN_TEXTS.vouchers.page.editSuccess);
            router.push('/admin/vouchers');
        } else {
            error(result.error || ADMIN_TEXTS.vouchers.page.editError);
            throw new Error(result.error || ADMIN_TEXTS.vouchers.form.errGeneric);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
                <Loader2 className="animate-spin w-8 h-8 mb-4 text-slate-400" />
                <p>{ADMIN_TEXTS.vouchers.page.loading}</p>
            </div>
        );
    }

    if (fetchError || !voucher) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center flex flex-col items-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                    <h2 className="text-lg font-bold text-slate-900 mb-2">{ADMIN_TEXTS.vouchers.page.notFound}</h2>
                    <p className="text-slate-600 mb-6">{fetchError}</p>
                    <Link href="/admin/vouchers" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <VoucherForm initialData={voucher} onSubmit={handleSubmit} />
        </div>
    );
}
