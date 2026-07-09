import { useState, useEffect } from 'react';
import { PublicBranchDetail } from './branch-detail.types';
import { branchDetailService } from './branch-detail.service';

export function useBranchDetail(branchId: string) {
  const [branch, setBranch] = useState<PublicBranchDetail | null>(null);
  const [menu, setMenu] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [branchData, menuData, vouchersData] = await Promise.all([
          branchDetailService.getBranchById(branchId),
          branchDetailService.getMenu(branchId),
          branchDetailService.getVouchers()
        ]);

        if (isMounted) {
          setBranch(branchData);
          setMenu(menuData);
          setVouchers(vouchersData || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to fetch branch detail:', err);
          setError('Không thể tải thông tin chi nhánh. Vui lòng thử lại.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (branchId) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  return { branch, menu, vouchers, isLoading, error };
}
