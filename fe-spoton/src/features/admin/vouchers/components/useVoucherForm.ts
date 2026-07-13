import { useState, useEffect } from 'react';
import { VoucherItem, AdminVoucherCreateRequest, computeStatus } from '../vouchers.types';
import { 
    VoucherFormState, 
    EMPTY_FORM, 
    formatDatetimeLocal, 
    validateForm, 
    buildPayload 
} from './voucher-form.utils';

export function useVoucherForm(
    initialData?: VoucherItem, 
    onSubmit?: (payload: AdminVoucherCreateRequest) => Promise<void>
) {
    const [data, setData] = useState<VoucherFormState>(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setTick] = useState(0);
    const [tableCapacities, setTableCapacities] = useState<number[]>([]);

    useEffect(() => {
        const fetchCapacities = async () => {
            try {
                const { http } = await import('@/lib/http');
                const res = await http.get<{success: boolean, data: number[]}>('/branches/table-capacities');
                if (res.success && res.data) {
                    setTableCapacities(res.data);
                }
            } catch (err) {}
        };
        fetchCapacities();

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
                min_guest_count: initialData.min_guest_count ? String(initialData.min_guest_count) : '',
                usage_limit: initialData.usage_limit ? String(initialData.usage_limit) : '',
                startDate: startLocal ? startLocal.split('T')[0] : '',
                startTime: startLocal ? startLocal.split('T')[1] : '00:00',
                endDate: endLocal ? endLocal.split('T')[0] : '',
                endTime: endLocal ? endLocal.split('T')[1] : '23:59',
                is_active: initialData.is_active,
                is_public: initialData.is_public ?? true,
            });
        }
    }, [initialData]);

    function updateForm<K extends keyof VoucherFormState>(key: K, value: VoucherFormState[K]) {
        setData((prev) => ({ ...prev, [key]: value }));
        setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    }

    const handleSubmitClick = async () => {
        if (!onSubmit) return;
        
        const errors = validateForm(data);

        // Validate that dates are not in the past (only if they are new or being changed)
        const now = new Date();
        const start = new Date(`${data.startDate}T${data.startTime}:00`);
        const end = new Date(`${data.endDate}T${data.endTime}:00`);
        
        const nowMinus1Min = new Date(now.getTime() - 60000);

        const initialStart = initialData ? new Date(initialData.valid_from).getTime() : null;
        const initialEnd = initialData ? new Date(initialData.valid_until).getTime() : null;

        const isNewOrChangedStart = !initialData || initialStart !== start.getTime();
        if (isNewOrChangedStart && !isNaN(start.getTime()) && start < nowMinus1Min) {
            errors.startDate = 'Thời gian bắt đầu không được trong quá khứ';
        }

        const isNewOrChangedEnd = !initialData || initialEnd !== end.getTime();
        if (isNewOrChangedEnd && !isNaN(end.getTime()) && end < nowMinus1Min) {
            errors.endDate = 'Thời gian kết thúc không được trong quá khứ';
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
            setError(err.message || 'Đã xảy ra lỗi');
            setIsSubmitting(false);
        }
    };

    const isRunning = initialData ? computeStatus(initialData) === 'active' : false;
    const isScheduled = initialData ? computeStatus(initialData) === 'scheduled' : false;
    
    const nowLocalStr = formatDatetimeLocal(new Date().toISOString());

    return {
        data,
        fieldErrors,
        isSubmitting,
        error,
        updateForm,
        handleSubmitClick,
        isRunning,
        isScheduled,
        nowLocalStr,
        tableCapacities
    };
}
