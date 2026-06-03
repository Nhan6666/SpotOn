import type { Branch, LastMinuteOffer, DiningGuide, CategoryBanner } from './home.types';

export const POPULAR_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'The Golden Fork',
    location: 'City Center',
    rating: 4.7,
    reviewCount: 127,
    priceFrom: 45,
    image: '/images/branches/golden-fork.jpg',
  },
  {
    id: '2',
    name: 'Ocean View Grill',
    location: 'Marina District',
    rating: 4.8,
    reviewCount: 311,
    priceFrom: 60,
    image: '/images/branches/ocean-view.jpg',
  },
  {
    id: '3',
    name: 'The Rustic Spoon',
    location: 'Old Town',
    rating: 4.6,
    reviewCount: 208,
    priceFrom: 35,
    image: '/images/branches/rustic-spoon.jpg',
  },
  {
    id: '4',
    name: 'Urban Spice',
    location: 'Arts Quarter',
    rating: 4.5,
    reviewCount: 180,
    priceFrom: 30,
    image: '/images/branches/urban-spice.jpg',
  },
];

export const LAST_MINUTE_OFFERS: LastMinuteOffer[] = [
  {
    id: 'lm1',
    restaurantName: 'Prime Steakhouse',
    location: 'Brooklyn',
    rating: 4.8,
    reviewCount: 1133,
    image: '/images/offers/steakhouse.jpg',
    discountPercent: 20,
    tag: '20% Today',
    tagColor: '#c8891a',
  },
  {
    id: 'lm2',
    restaurantName: 'Sakura Sushi',
    location: 'Little East',
    rating: 4.8,
    reviewCount: 980,
    image: '/images/offers/sushi.jpg',
    discountPercent: 15,
    tag: '15% Today',
    tagColor: '#c8891a',
  },
  {
    id: 'lm3',
    restaurantName: 'Trattoria Bella',
    location: 'Soho Row',
    rating: 4.7,
    reviewCount: 311,
    image: '/images/offers/trattoria.jpg',
    discountPercent: 10,
    tag: 'Free Apps',
    tagColor: '#c8891a',
  },
];

export const CATEGORY_BANNERS: CategoryBanner[] = [
  { id: 'new', label: 'New Openings', icon: '✨', bg: '#1a1208', href: '/search?category=new' },
  { id: 'fine', label: 'Fine Dining Experiences', icon: '🕯️', bg: '#2d2218', href: '/search?category=fine-dining' },
  { id: 'casual', label: 'Casual Eats', icon: '🍔', bg: '#c8891a', href: '/search?category=casual' },
];

export const DINING_GUIDES: DiningGuide[] = [
  {
    id: 'g1',
    title: 'Top 5 Places for Authentic Sushi Experiences in the City',
    excerpt: 'From hole-in-wall sushi bars to upscale omakase, these carefully selected spots will satisfy your inner sushi-loving self.',
    image: '/images/guides/sushi-guide.jpg',
    date: 'May 24, 2024',
    tag: 'GUIDE',
  },
  {
    id: 'g2',
    title: 'The Ultimate Guide to Romantic Dinners',
    excerpt: 'Set the perfect mood for a special evening with our curated list of the most romantic restaurants.',
    image: '/images/guides/romantic-guide.jpg',
    date: 'May 26, 2024',
    tag: 'GUIDE',
  },
  {
    id: 'g3',
    title: 'Exploring Vegan Options at High-End Restaurants',
    excerpt: 'Discover how top chefs are elevating plant-based cuisine into extraordinary culinary experiences.',
    image: '/images/guides/vegan-guide.jpg',
    date: 'May 18, 2024',
    tag: 'GUIDE',
  },
];
