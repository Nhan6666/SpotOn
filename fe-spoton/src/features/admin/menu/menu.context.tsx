"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { MenuItem, CreateMenuItemPayload, UpdateMenuItemPayload, MenuCategory, PaginationInfo, MasterMenuQueryParams } from './menu.types';
import { menuService } from './menu.service';
import { AppError } from '@/lib/errors';

interface MenuContextType {
  items: MenuItem[];
  categories: MenuCategory[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  fetchMasterMenu: (params?: MasterMenuQueryParams) => Promise<void>;
  addItem: (menuId: string, payload: CreateMenuItemPayload) => Promise<void>;
  updateItem: (menuId: string, itemId: string, payload: UpdateMenuItemPayload) => Promise<void>;
  deleteItem: (menuId: string, itemId: string) => Promise<void>;
  toggleCoreLock: (menuId: string, itemId: string) => Promise<void>;
  toggleVisibility: (menuId: string, itemId: string) => Promise<void>;
  createCategory: (categoryName: string) => Promise<string>; // returns menuId
}

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 1,
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMasterMenu = useCallback(async (params?: MasterMenuQueryParams) => {
    setIsLoading(true);
    try {
      const res = await menuService.getMasterMenus(params);
      if (res?.data) {
        setItems(res.data.items || []);
        setCategories(res.data.categories || []);
        setPagination(res.data.pagination || DEFAULT_PAGINATION);
      }
      setError(null);
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách menu');
      }
      // Fallback to empty data
      setItems([]);
      setCategories([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = async (menuId: string, payload: CreateMenuItemPayload) => {
    const res = await menuService.addItem(menuId, payload);
    if (res?.data) {
      // Refresh the full list to keep in sync
      await fetchMasterMenu();
    }
  };

  const updateItem = async (menuId: string, itemId: string, payload: UpdateMenuItemPayload) => {
    const res = await menuService.updateItem(menuId, itemId, payload);
    if (res?.data) {
      setItems(prev => prev.map(item => item._id === itemId ? { ...item, ...res.data } : item));
    }
  };

  const deleteItem = async (menuId: string, itemId: string) => {
    await menuService.deleteItem(menuId, itemId);
    setItems(prev => prev.filter(item => item._id !== itemId));
  };

  const toggleCoreLock = async (menuId: string, itemId: string) => {
    const res = await menuService.toggleCoreLock(menuId, itemId);
    if (res?.data) {
      setItems(prev =>
        prev.map(item =>
          item._id === itemId ? { ...item, is_core_item: res.data.is_core_item } : item
        )
      );
    }
  };

  const toggleVisibility = async (menuId: string, itemId: string) => {
    const res = await menuService.toggleVisibility(menuId, itemId);
    if (res?.data) {
      setItems(prev =>
        prev.map(item =>
          item._id === itemId ? { ...item, is_available: res.data.is_available } : item
        )
      );
    }
  };

  const createCategory = async (categoryName: string): Promise<string> => {
    const res = await menuService.createCategory({ category_name: categoryName });
    if (res?.data) {
      await fetchMasterMenu();
      return res.data._id;
    }
    throw new Error('Failed to create category');
  };

  return (
    <MenuContext.Provider value={{
      items,
      categories,
      pagination,
      isLoading,
      error,
      fetchMasterMenu,
      addItem,
      updateItem,
      deleteItem,
      toggleCoreLock,
      toggleVisibility,
      createCategory,
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenuContext() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
}
