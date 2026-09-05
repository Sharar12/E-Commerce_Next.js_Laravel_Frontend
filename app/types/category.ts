export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  bannerImage?: string;
  productCount: number;
  subcategories: Subcategory[];
  featured: boolean;
  parentCategory?: string;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder: number;
  // Hierarchy fields (from API)
  parent_id?: number | null;
  products_count?: number;
  children?: Category[];
  parent?: Category;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  image: string;
}

export interface CategoryBanner {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  overlayColor: string;
  textColor: string;
}

export interface CategoryGridConfig {
  columns: number;
  gap: number;
  aspectRatio: string;
  showProductCount: boolean;
  showDescription: boolean;
  layout: 'grid' | 'masonry' | 'featured';
}

/** Compute category level from parent_id presence.
 *  Requires `parent` to be loaded for Level-3 detection.
 */
export function getCategoryLevel(cat: {
  parent_id?: number | null;
  parent?: { parent_id?: number | null } | null;
}): 1 | 2 | 3 {
  if (!cat.parent_id) return 1;
  if (cat.parent && !cat.parent.parent_id) return 2;
  return 3;
}