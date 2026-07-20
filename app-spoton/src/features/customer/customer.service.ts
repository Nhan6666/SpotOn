import apiClient from '@/lib/http';

export const CustomerService = {
  async getBranches() {
    const response = await apiClient.get('/branches');
    return response.data;
  },

  async getBranchById(id: string) {
    const response = await apiClient.get(`/branches/${id}`);
    return response.data;
  },

  async getPublicMenu(branchId: string) {
    const response = await apiClient.get(`/menus/public/branch/${branchId}`);
    return response.data;
  },

  async getBestSellers() {
    const response = await apiClient.get('/menus/public/best-sellers');
    return response.data;
  },

  async getPublicVouchers() {
    const response = await apiClient.get('/vouchers/public/global');
    return response.data;
  },

  async getMyWallet() {
    const response = await apiClient.get('/vouchers/my-wallet');
    return response.data;
  }
};
