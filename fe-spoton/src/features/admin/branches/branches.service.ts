import { http } from '@/lib/http';

export const branchService = {
  getBranches: async () => {
    const res = await http.get<{ success: boolean; data: any[] }>('/branches');
    return res.data || [];
  }
};
