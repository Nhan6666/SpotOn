export type MenuItemCategory =
  | 'Appetizers'
  | 'Main Course'
  | 'Main Courses'
  | 'Drinks'
  | 'Desserts'
  | 'Sides'
  | 'Specials';

export type MenuItemStatus = 'ACTIVE' | 'DRAFT' | 'HIDDEN';

export interface MenuItem {
  _id: string;
  menu_id: string;          // ID of the parent Menu (category) document
  name: string;
  sku?: string;
  description?: string;
  category: string;         // category_name from parent Menu document
  base_price: number;
  min_price: number;
  max_price: number;
  dietary_tags?: string[];
  status: MenuItemStatus;
  image_url?: string;
  is_core_item: boolean;    // BR-02: Core Item Lock
  is_available: boolean;
  branches?: string[];      // Branch IDs this item is distributed to
  created_at?: string;
  updated_at?: string;

  // Backward compatibility alias
  is_core?: boolean;
  price_range?: {
    min: number | null;
    max: number | null;
    flexible: boolean;
  };
}

export interface CreateMenuItemPayload {
  name: string;
  description?: string;
  base_price: number;
  min_price?: number;
  max_price?: number;
  dietary_tags?: string[];
  is_core_item?: boolean;
  image_url?: string;
  status?: MenuItemStatus;
  branches?: string[];
  sku?: string;
}

export type UpdateMenuItemPayload = Partial<CreateMenuItemPayload>;

export type MenuCategoryFilter = 'All Items' | string;

export interface MenuCategory {
  _id: string;
  category_name: string;
  item_count: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MasterMenuResponse {
  success: boolean;
  message: string;
  data: {
    categories: MenuCategory[];
    items: MenuItem[];
    pagination: PaginationInfo;
  };
}

export interface MasterMenuQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export const MENU_CATEGORIES: string[] = [
  'Appetizers',
  'Main Courses',
  'Drinks',
  'Desserts',
  'Sides',
  'Specials',
];

export const CATEGORY_FILTER_TABS: MenuCategoryFilter[] = [
  'All Items',
  'Appetizers',
  'Main Courses',
  'Drinks',
  'Desserts',
];
