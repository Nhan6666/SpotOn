/**
 * menu.service.ts
 * API calls for menu management (UC-7.3).
 * All calls go through lib/http → connects to /api/v1/menus
 */

import { http } from '@/lib/http';
import { MenuItem, CreateMenuItemPayload, UpdateMenuItemPayload, MasterMenuResponse, MasterMenuQueryParams } from './menu.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  warnings?: Array<{
    code: string;
    message: string;
    affected_branches?: Array<{
      branch_id: string;
      branch_name: string;
      current_price: number;
      violation: string;
    }>;
  }>;
}

interface CreateMenuCategoryPayload {
  category_name: string;
  branch_id?: string | null;
}

export const menuService = {
  // ============================================================
  // GET Master Menu (Admin) — UC-7.3 with server-side pagination
  // ============================================================
  getMasterMenus: (params?: MasterMenuQueryParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return http.get<MasterMenuResponse>(`/menus/master${qs ? `?${qs}` : ''}`);
  },

  // ============================================================
  // GET All Categories (Public, optional branch filter)
  // ============================================================
  getAll: (branchId?: string) =>
    http.get<ApiResponse<any[]>>(branchId ? `/categories?branch_id=${branchId}` : '/categories'),

  // ============================================================
  // POST Create Menu Category
  // ============================================================
  createCategory: (payload: CreateMenuCategoryPayload) =>
    http.post<ApiResponse<{ _id: string; category_name: string }>>('/categories', payload),

  // ============================================================
  // POST Add Item to Category — BR-01 validated on server
  // ============================================================
  addItem: (menuId: string, payload: CreateMenuItemPayload) =>
    http.post<ApiResponse<MenuItem>>(`/menus/${menuId}/items`, payload),

  // ============================================================
  // PUT Update Item — BR-01, BR-03, EX-7.3.2 validated on server
  // ============================================================
  updateItem: (menuId: string, itemId: string, payload: UpdateMenuItemPayload) =>
    http.put<ApiResponse<MenuItem>>(`/menus/${menuId}/items/${itemId}`, payload),

  // ============================================================
  // DELETE Item — BR-02 enforced on server
  // ============================================================
  deleteItem: (menuId: string, itemId: string) =>
    http.delete<ApiResponse<null>>(`/menus/${menuId}/items/${itemId}`),

  // ============================================================
  // PATCH Toggle Core Item Lock — BR-02
  // ============================================================
  toggleCoreLock: (menuId: string, itemId: string) =>
    http.patch<ApiResponse<{ _id: string; is_core_item: boolean }>>(`/menus/${menuId}/items/${itemId}/core-lock`, {}),

  // ============================================================
  // PATCH Toggle Visibility (Ẩn/Hiện)
  // ============================================================
  toggleVisibility: (menuId: string, itemId: string) =>
    http.patch<ApiResponse<{ _id: string; is_available: boolean }>>(`/menus/${menuId}/items/${itemId}/toggle-visibility`, {}),
};
