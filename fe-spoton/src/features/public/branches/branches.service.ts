import { http } from '@/lib/http';
import { PublicBranch } from './branches.types';

export const branchesService = {
  /**
   * Fetch all public branches
   */
  async getAllBranches(): Promise<PublicBranch[]> {
    const res = await http.get<{ success: boolean; data: PublicBranch[] }>('/branches');
    return res?.data || [];
  }
};
