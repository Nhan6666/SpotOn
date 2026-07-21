import apiClient from '@/lib/http';

export const BranchService = {
  async getMyBranch() {
    const response = await apiClient.get('/branches/my/branch');
    return response.data;
  },

  async updateTableStatus(branchId: string, tableId: string, status: string) {
    const response = await apiClient.patch(`/branches/${branchId}/tables/${tableId}/status`, { status });
    return response.data;
  },

  async updateBranch(id: string, data: any) {
    const response = await apiClient.put(`/branches/${id}`, data);
    return response.data;
  },

  // Map Editor APIs
  async createZone(branchId: string, data: { name: string; capacity: number }) {
    const response = await apiClient.post(`/branches/${branchId}/zones`, data);
    return response.data;
  },
  
  async createTable(
    branchId: string, 
    zoneId: string, 
    data: { table_number: string; capacity: number; x?: number; y?: number; width?: number; height?: number; shape?: string; image_url?: string | null }
  ) {
    const response = await apiClient.post(`/branches/${branchId}/zones/${zoneId}/tables`, data);
    return response.data;
  },
  
  async updateTable(
    branchId: string,
    zoneId: string,
    tableId: string,
    data: any
  ) {
    const response = await apiClient.put(`/branches/${branchId}/zones/${zoneId}/tables/${tableId}`, data);
    return response.data;
  },
  
  async deleteTable(branchId: string, zoneId: string, tableId: string) {
    const response = await apiClient.delete(`/branches/${branchId}/zones/${zoneId}/tables/${tableId}`);
    return response.data;
  },
  
  async bulkUpdateTablesLayout(
    branchId: string,
    zoneId: string,
    tables: { _id: string; x: number; y: number }[]
  ) {
    const response = await apiClient.put(`/branches/${branchId}/zones/${zoneId}/tables/layout`, { tables });
    return response.data;
  }
};
