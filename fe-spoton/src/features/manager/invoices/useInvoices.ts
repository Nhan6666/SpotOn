import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { Booking } from '../check-in/check-in.types';
import { invoicesService } from './invoices.service';

export function useInvoices() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  
  const [invoices, setInvoices] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleDateString('en-CA');
  });

  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLETED' | 'PENDING_SETTLEMENT' | 'REFUND_PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState<Booking | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!user?.branch_id) return;
    
    try {
      setIsLoading(true);
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const data = await invoicesService.getInvoices(
        user.branch_id, 
        targetDate.toISOString(), 
        nextDate.toISOString()
      );

      setInvoices(data);
    } catch (err) {
      showError("Không thể tải danh sách hóa đơn.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branch_id, selectedDate, showError]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Filter by tab
      if (activeTab === 'COMPLETED' && !['COMPLETED', 'REFUND_COMPLETED'].includes(inv.status)) {
        return false;
      }
      if (activeTab === 'PENDING_SETTLEMENT' && inv.status !== 'PENDING_SETTLEMENT') {
        return false;
      }
      if (activeTab === 'REFUND_PENDING' && inv.status !== 'CANCELLED_REFUND_PENDING') {
        return false;
      }
      
      // Filter by search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (inv.customer_id?.full_name || inv.walk_in_name || '').toLowerCase().includes(q);
        const phoneMatch = (inv.customer_id?.phone || inv.walk_in_phone || '').toLowerCase().includes(q);
        const idMatch = inv._id.toLowerCase().includes(q);
        
        if (!nameMatch && !phoneMatch && !idMatch) return false;
      }
      
      return true;
    });
  }, [invoices, activeTab, searchQuery]);

  return {
    isLoading,
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredInvoices,
    stats: {
      total: invoices.length,
      completed: invoices.filter(i => ['COMPLETED', 'REFUND_COMPLETED'].includes(i.status)).length,
      pending: invoices.filter(i => i.status === 'PENDING_SETTLEMENT').length,
      refundPending: invoices.filter(i => i.status === 'CANCELLED_REFUND_PENDING').length,
    },
    selectedBookingForCheckout,
    setSelectedBookingForCheckout,
    fetchInvoices
  };
}
