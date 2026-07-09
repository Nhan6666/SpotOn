import { http } from '@/lib/http';
import { MenuCategory, PaginatedItems } from './menu.types';

export const menuService = {
  /**
   * Fetch all categories (without items) to build the Tabs
   */
  getCategories: async (branchId: string): Promise<MenuCategory[]> => {
    // Gọi API Backend chuẩn lấy danh mục
    const res = await http.get<{ success: boolean; data: MenuCategory[] }>(
      `/menus/public/${branchId}/categories`
    );
    
    return res?.data || [];
  },

  /**
   * Fetch items for a specific category with pagination
   */
  getItemsByCategory: async (
    categoryName: string, 
    page: number = 1, 
    limit: number = 10,
    branchId: string
  ): Promise<PaginatedItems> => {
    // Gọi API Backend chuẩn phân trang lấy món
    const res = await http.get<{ success: boolean; data: PaginatedItems }>(
      `/menus/public/${branchId}/items?category_name=${encodeURIComponent(categoryName)}&page=${page}&limit=${limit}`
    );
    
    if (res?.data) {
      return res.data;
    }
    
    return {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 }
    };
  }
};
