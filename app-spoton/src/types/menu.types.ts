export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id?: string;
}

export interface MenuCategory {
  _id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}
