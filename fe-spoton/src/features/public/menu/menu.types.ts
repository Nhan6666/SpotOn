export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  base_price?: number;
  price?: number;
  image_url: string;
}

export interface MenuCategory {
  _id: string;
  category_name: string;
  items?: MenuItem[]; // Optional if we only fetch category names first
}

export interface PaginatedItems {
  items: MenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
