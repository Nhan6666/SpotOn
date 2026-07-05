import { useState, useEffect } from 'react';
import { PublicBranch } from './branches.types';
import { branchesService } from './branches.service';

export function useBranches() {
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await branchesService.getAllBranches();
        if (isMounted) {
          setBranches(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to fetch branches:', err);
          setError('Không thể tải danh sách chi nhánh. Vui lòng thử lại.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBranches();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    branches,
    isLoading,
    error
  };
}
