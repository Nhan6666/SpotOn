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
    tag: 'Giảm 20% hôm nay',
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
    tag: 'Giảm 15% hôm nay',
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
    tag: 'Miễn phí món khai vị',
    tagColor: '#c8891a',
  },
];

export const CATEGORY_BANNERS: CategoryBanner[] = [
  { id: 'new', label: 'Địa điểm mới', icon: '✨', bg: '#1a1208', href: '/search?category=new' },
  { id: 'fine', label: 'Ẩm thực cao cấp', icon: '🕯️', bg: '#2d2218', href: '/search?category=fine-dining' },
  { id: 'casual', label: 'Ăn uống bình dân', icon: '🍔', bg: '#c8891a', href: '/search?category=casual' },
];

export const DINING_GUIDES: DiningGuide[] = [
  {
    id: 'g1',
    title: 'Top 5 địa điểm thưởng thức Sushi chuẩn vị tại Thành phố',
    excerpt: 'Từ những quán sushi nhỏ bé đến những nhà hàng omakase sang trọng, những địa điểm được lựa chọn cẩn thận này sẽ làm hài lòng tâm hồn yêu sushi của bạn.',
    image: '/images/guides/sushi-guide.jpg',
    date: '24 Tháng 5, 2024',
    tag: 'CẨM NANG',
  },
  {
    id: 'g2',
    title: 'Cẩm nang tối ưu cho những bữa tối lãng mạn',
    excerpt: 'Tạo nên bầu không khí hoàn hảo cho một buổi tối đặc biệt với danh sách các nhà hàng lãng mạn nhất được chúng tôi tuyển chọn.',
    image: '/images/guides/romantic-guide.jpg',
    date: '26 Tháng 5, 2024',
    tag: 'CẨM NANG',
  },
  {
    id: 'g3',
    title: 'Khám phá các lựa chọn ăn chay tại nhà hàng cao cấp',
    excerpt: 'Khám phá cách các đầu bếp hàng đầu nâng tầm ẩm thực thuần chay thành những trải nghiệm ẩm thực phi thường.',
    image: '/images/guides/vegan-guide.jpg',
    date: '18 Tháng 5, 2024',
    tag: 'CẨM NANG',
  },
];
