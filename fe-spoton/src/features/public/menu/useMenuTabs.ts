import { useState, useEffect, useCallback } from 'react';
import { menuService } from './menu.service';
import { MenuCategory, MenuItem } from './menu.types';

export function useMenuTabs(branchId?: string) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Cache for loaded items: { [categoryId]: MenuItem[] }
  const [itemsCache, setItemsCache] = useState<Record<string, MenuItem[]>>({});
  const [pagesCache, setPagesCache] = useState<Record<string, number>>({});
  const [hasMoreCache, setHasMoreCache] = useState<Record<string, boolean>>({});
  
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories initially
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await menuService.getCategories(branchId);
        setCategories(data);
        if (data.length > 0) {
          // Default to first tab (which is Combo due to sorting)
          setActiveTab(data[0].category_name);
        }
      } catch (err) {
        setError('Không thể tải danh sách thực đơn.');
        console.error(err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [branchId]);

  // Load items when active tab changes, if not already cached
  const fetchItems = useCallback(async (categoryName: string, page: number = 1) => {
    if (!branchId) return; // Prevent fetching if branchId is undefined
    
    try {
      setIsLoadingItems(true);
      const data = await menuService.getItemsByCategory(categoryName, page, 10, branchId);
      
      setItemsCache(prev => {
        // If page 1, replace. If > 1, append.
        const newItems = page === 1 
          ? data.items 
          : [...(prev[categoryName] || []), ...data.items];
        return { ...prev, [categoryName]: newItems };
      });
      
      setPagesCache(prev => ({ ...prev, [categoryName]: data.pagination.page }));
      setHasMoreCache(prev => ({ 
        ...prev, 
        [categoryName]: data.pagination.page < data.pagination.totalPages 
      }));
      
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (activeTab && !itemsCache[activeTab]) {
      fetchItems(activeTab, 1);
    }
  }, [activeTab, itemsCache, fetchItems]);

  const handleTabChange = (categoryName: string) => {
    setActiveTab(categoryName);
  };

  const loadMore = () => {
    if (activeTab && hasMoreCache[activeTab] && !isLoadingItems) {
      const nextPage = (pagesCache[activeTab] || 1) + 1;
      fetchItems(activeTab, nextPage);
    }
  };

  return {
    categories,
    activeTab,
    handleTabChange,
    items: itemsCache[activeTab] || [],
    isLoadingCategories,
    isLoadingItems,
    hasMore: hasMoreCache[activeTab] || false,
    loadMore,
    error
  };
}
