import apiClient from '@/lib/axios';

export const BranchService = {
  async getMyBranch() {
    const response = await apiClient.get('/branches/my/branch');
    return response.data;
  },

  async updateTableStatus(branchId: string, tableId: string, status: string) {
    const response = await apiClient.patch(`/branches/${branchId}/tables/${tableId}/status`, { status });
    return response.data;
  }
};
