import { Category, CategoryBanner } from '../types/category';

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Gadgets, devices, and tech accessories.',
    image: '/api/placeholder/400/400',
    bannerImage: '/api/placeholder/1200/400',
    productCount: 18,
    featured: true,
    displayOrder: 1,
    subcategories: [
      { id: '1-1', name: 'Audio', slug: 'audio', productCount: 8, image: '/api/placeholder/200/200' },
      { id: '1-2', name: 'Wearables', slug: 'wearables', productCount: 6, image: '/api/placeholder/200/200' },
      { id: '1-3', name: 'Photography', slug: 'photography', productCount: 4, image: '/api/placeholder/200/200' },
    ],
    seoTitle: 'Electronics - Gadgets & Tech',
    seoDescription: 'Find the latest electronic gadgets and tech accessories.'
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, accessories, and style essentials.',
    image: '/api/placeholder/400/400',
    bannerImage: '/api/placeholder/1200/400',
    productCount: 6,
    featured: true,
    displayOrder: 2,
    subcategories: [
      { id: '2-1', name: 'Clothing', slug: 'clothing', productCount: 3, image: '/api/placeholder/200/200' },
      { id: '2-2', name: 'Accessories', slug: 'accessories', productCount: 3, image: '/api/placeholder/200/200' },
    ]
  },
  {
    id: '3',
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Furniture, decor, and household essentials.',
    image: '/api/placeholder/400/400',
    bannerImage: '/api/placeholder/1200/400',
    productCount: 13,
    featured: false,
    displayOrder: 3,
    subcategories: [
      { id: '3-1', name: 'Furniture', slug: 'furniture', productCount: 7, image: '/api/placeholder/200/200' },
      { id: '3-2', name: 'Decor', slug: 'decor', productCount: 6, image: '/api/placeholder/200/200' },
    ]
  },
  {
    id: '4',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Sports equipment and fitness gear.',
    image: '/api/placeholder/400/400',
    bannerImage: '/api/placeholder/1200/400',
    productCount: 1,
    featured: false,
    displayOrder: 4,
    subcategories: [
      { id: '4-1', name: 'Fitness', slug: 'fitness', productCount: 1, image: '/api/placeholder/200/200' },
    ]
  },
  {
    id: '5',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Bags, watches, jewelry, and more.',
    image: '/api/placeholder/400/400',
    bannerImage: '/api/placeholder/1200/400',
    productCount: 2,
    featured: false,
    displayOrder: 5,
    subcategories: [
      { id: '5-1', name: 'Bags', slug: 'bags', productCount: 1, image: '/api/placeholder/200/200' },
      { id: '5-2', name: 'Jewelry', slug: 'jewelry', productCount: 1, image: '/api/placeholder/200/200' },
    ]
  }
];

export const categoryBanner: CategoryBanner = {
  title: 'Shop by Category',
  subtitle: 'Discover Our Collections',
  description: 'Explore our wide range of products organized into carefully curated categories. Find exactly what you need with our intuitive category navigation.',
  image: '/api/placeholder/1200/400',
  ctaText: 'View All Products',
  ctaLink: '/products',
  overlayColor: 'rgba(0,0,0,0.4)',
  textColor: 'text-white'
};

export const layoutOptions = [
  { value: 'grid', label: 'Grid View', icon: 'Grid' },
  { value: 'masonry', label: 'Masonry View', icon: 'Layout' },
  { value: 'featured', label: 'Featured First', icon: 'Star' }
];