export interface Branch {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  image: string;
  tag?: string;
  tagColor?: string;
}

export interface LastMinuteOffer {
  id: string;
  restaurantName: string;
  location: string;
  rating: number;
  reviewCount: number;
  image: string;
  discountPercent: number;
  tag: string;
  tagColor: string;
}

export interface DiningGuide {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  tag: string;
}

export interface CategoryBanner {
  id: string;
  label: string;
  icon: string;
  bg: string;
  href: string;
}
