"use client";
export const dynamic = "force-dynamic";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { addToWishlist } from "../common/wishlist";
import { useRouter, useSearchParams } from "next/navigation";
import { SaleProduct, FilterState, ViewMode, CountdownTimer } from "../types/sale";
import { saleBanners } from "../data/mockSale";

const sortOptions = [
  { value: "discount-high", label: "Discount: High to Low", field: "discount", order: "desc" },
  { value: "discount-low", label: "Discount: Low to High", field: "discount", order: "asc" },
  { value: "price-low", label: "Price: Low to High", field: "price", order: "asc" },
  { value: "price-high", label: "Price: High to Low", field: "price", order: "desc" },
  { value: "ending-soon", label: "Ending Soonest", field: "saleEndDate", order: "asc" },
  { value: "bestseller", label: "Most Popular", field: "unitsSold", order: "desc" },
  { value: "rating", label: "Highest Rated", field: "rating", order: "desc" },
];
import SaleProductCard from "../components/SaleProductCard";
import SaleBanner from "../components/SaleBanner";
import SaleFilter from "../components/SaleFilter";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  LayoutGrid,
  Tag,
  Sparkles,
  Clock,
  Flame,
  Crown,
  ShieldCheck,
  Gem,
  RotateCcw,
  Compass,
  X,
  ChevronRight,
} from "lucide-react";
import MainLayout from "../components/Layouts";
import { useCart } from "../contexts/CartContext";
import { apiUrl, adminToken } from "../common/http";

interface ApiProduct {
  id: number;
  name: string;
  base_price: number;
  stock_quantity: number;
  category_id?: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  images?: { image_url: string }[];
  reviews?: { id: number; rating: number }[];
  description?: string;
}

const SaleContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    priceRange: [0, 100000],
    discountRange: [0, 100],
    ratings: [],
    tags: [],
    availability: "all",
    discountType: ["percentage", "fixed", "clearance"],
    saleType: "all",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = adminToken();
        const headers: HeadersInit = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const [res, catRes, discRes] = await Promise.all([
          fetch(`${apiUrl}/products`, { headers }),
          fetch(`${apiUrl}/categories`, { headers }),
          fetch(`${apiUrl}/discounts`, { headers }).catch(() => null),
        ]);

        const data = await res.json();
        const catData = await catRes.json();
        const discData = discRes ? await discRes.json().catch(() => ({})) : {};
        const productList = data.data || data;
        const catList = catData.data || catData;
        const discountList = discData.data || discData || [];

        if (Array.isArray(catList)) {
          setCategoriesList(catList.map((c: any) => c.name));
        }

        if (Array.isArray(productList)) {
          const activeProducts = productList.filter((p: any) => p.status === 'active' || p.status === undefined);
          const saleProducts: SaleProduct[] = [];
          const now = new Date();

          activeProducts.forEach((p: ApiProduct, index: number) => {
            // Find active valid discount matching product_id or category_id
            const matchedDiscount = Array.isArray(discountList)
              ? discountList.find((d: any) => {
                  const matchesTarget = (d.product_id && Number(d.product_id) === Number(p.id)) ||
                    (d.category_id && Number(d.category_id) === Number(p.category_id || p.category?.id));
                  
                  if (!matchesTarget) return false;
                  
                  // Check date validity
                  if (d.valid_from) {
                    const validFrom = new Date(d.valid_from);
                    if (typeof d.valid_from === 'string' && d.valid_from.length <= 10) {
                      validFrom.setHours(0, 0, 0, 0);
                    }
                    if (!isNaN(validFrom.getTime()) && validFrom > now) return false;
                  }
                  if (d.valid_to) {
                    const validTo = new Date(d.valid_to);
                    // If valid_to is date-only (like 2026-07-31), set to end of day
                    if (typeof d.valid_to === 'string' && d.valid_to.length <= 10) {
                      validTo.setHours(23, 59, 59, 999);
                    }
                    if (!isNaN(validTo.getTime()) && validTo < now) return false;
                  }

                  return true;
                })
              : null;

            if (matchedDiscount) {
              const firstImage = p.images?.[0]?.image_url || "";
              const basePrice = Number(p.base_price);
              const discountValue = Number(matchedDiscount.discount_value || 0);
              const discountPercent = matchedDiscount.discount_type === 'percentage' 
                ? discountValue 
                : Math.max(1, Math.round((discountValue / basePrice) * 100));
              
              if (discountPercent > 0 || discountValue > 0) {
                const salePrice = matchedDiscount.discount_type === 'percentage'
                  ? Math.round(basePrice * (1 - discountPercent / 100))
                  : Math.max(0, basePrice - discountValue);
                
                const originalPrice = basePrice;
                const saleEndDate = matchedDiscount.valid_to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                const productReviews = p.reviews || [];
                const reviewCount = productReviews.length;
                const avgRating = reviewCount > 0
                  ? productReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviewCount
                  : 0;

                saleProducts.push({
                  id: String(p.id),
                  name: p.name,
                  brand: p.brand?.name || "Lumina",
                  price: salePrice,
                  originalPrice: originalPrice,
                  image: firstImage,
                  category: p.category?.name || "Curation",
                  categoryId: p.category_id || p.category?.id,
                  subcategory: "Outlet",
                  rating: avgRating,
                  reviewCount: reviewCount,
                  stock: Number(p.stock_quantity),
                  discount: discountPercent,
                  discountType: matchedDiscount.discount_type || "percentage",
                  saleEndDate: saleEndDate,
                  isBestseller: true,
                  isNew: false,
                  tags: ["sale", "concession"],
                  description: p.description || "",
                  variants: [],
                  unitsSold: Number((p as any).sales_count || 0),
                  discountTier: discountPercent >= 25 ? "hot" : "popular",
                });
              }
            }
          });

          setProducts(saleProducts);

          const maxPrice = saleProducts.length > 0 ? Math.max(...saleProducts.map((p) => p.price)) : 100000;
          setFilters((prev) => ({
            ...prev,
            priceRange: [prev.priceRange[0], Math.max(prev.priceRange[1], maxPrice)],
          }));

          // If category query param is present, pre-select category
          if (categoryParam) {
            const matchedCategory = saleProducts.find(
              (p: any) => String(p.categoryId) === String(categoryParam) || p.category.toLowerCase() === categoryParam.toLowerCase()
            );
            const categoryName = matchedCategory ? matchedCategory.category : null;
            if (categoryName) {
              setFilters((prev) => ({ ...prev, categories: [categoryName] }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch products for sale page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryParam]);
  const [sortBy, setSortBy] = useState<string>("discount-high");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>({ type: "grid", columns: 3 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate countdown timer for a product
  const getCountdownTimer = (endDate: string): CountdownTimer => {
    const end = new Date(endDate).getTime();
    const now = currentTime.getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isEndingSoon: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const isEndingSoon = days === 0 && hours < 24;

    return { days, hours, minutes, seconds, isEndingSoon };
  };

  const [categoriesTree, setCategoriesTree] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategoriesTree = async () => {
      try {
        const res = await fetch(`${apiUrl}/categories/tree`);
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) setCategoriesTree(data);
      } catch (err) {}
    };
    fetchCategoriesTree();
  }, []);

  const getSelectedCategoryNames = useMemo(() => {
    if (filters.categories.length === 0) return new Set<string>();
    const names = new Set<string>(filters.categories);

    const collectDescendants = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (names.has(node.name)) {
          const addAll = (n: any) => {
            names.add(n.name);
            if (n.children && n.children.length > 0) n.children.forEach(addAll);
          };
          if (node.children && node.children.length > 0) node.children.forEach(addAll);
        } else if (node.children && node.children.length > 0) {
          collectDescendants(node.children);
        }
      });
    };

    collectDescendants(categoriesTree);
    return names;
  }, [filters.categories, categoriesTree]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Search filter
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.brand.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }

      // Category filter (includes descendant subcategories)
      if (filters.categories.length > 0 && !getSelectedCategoryNames.has(product.category)) {
        return false;
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Price range filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      // Discount range filter
      if (
        product.discount < filters.discountRange[0] ||
        product.discount > filters.discountRange[1]
      ) {
        return false;
      }

      // Rating filter (only filter if user explicitly selected a rating range)
      if (filters.ratings.length > 0 && !filters.ratings.some((r) => product.rating >= r)) {
        return false;
      }

      // Tag filter
      if (filters.tags.length > 0 && !filters.tags.some((tag) => product.tags.includes(tag))) {
        return false;
      }

      // Availability filter
      if (filters.availability === "in-stock" && product.stock === 0) {
        return false;
      }
      if (filters.availability === "out-of-stock" && product.stock > 0) {
        return false;
      }

      // Discount type filter
      if (
        filters.discountType.length > 0 &&
        !filters.discountType.includes(product.discountType)
      ) {
        return false;
      }

      // Sale type filter
      if (filters.saleType !== "all") {
        if (filters.saleType === "flash-sale") {
          // Flash sale: items ending within 7 days or explicitly tagged
          const endMs = new Date(product.saleEndDate).getTime();
          const isEndingSoon = !isNaN(endMs) && (endMs - currentTime.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          if (!isEndingSoon && !product.tags.includes("flash-sale")) {
            return false;
          }
        }
        if (filters.saleType === "clearance") {
          // Clearance: items with 40%+ discount or low stock or explicitly tagged
          if (product.discount < 40 && product.stock > 3 && !product.tags.includes("clearance")) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort products
    const sortOption = sortOptions.find((option) => option.value === sortBy) || sortOptions[0];
    filtered.sort((a, b) => {
      const aValue = a[sortOption.field as keyof SaleProduct];
      const bValue = b[sortOption.field as keyof SaleProduct];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOption.order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOption.order === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Special handling for saleEndDate
      if (sortOption.field === "saleEndDate") {
        const aDate = new Date(a.saleEndDate).getTime();
        const bDate = new Date(b.saleEndDate).getTime();
        return sortOption.order === "asc" ? aDate - bDate : bDate - aDate;
      }

      return 0;
    });

    return filtered;
  }, [filters, sortBy, searchQuery, currentTime, products]);

  // Calculate sale statistics
  const saleStats = useMemo(() => {
    const totalProducts = products.length;
    const totalDiscount = products.reduce((sum, product) => sum + product.discount, 0);
    const averageDiscount = totalProducts > 0 ? (totalDiscount / totalProducts).toFixed(1) : "0";
    const endingSoon = products.filter((product) => {
      const timer = getCountdownTimer(product.saleEndDate);
      return timer.isEndingSoon;
    }).length;
    const totalSavings = products.reduce((sum, product) => {
      return sum + (product.originalPrice - product.price) * product.unitsSold;
    }, 0);

    return {
      totalProducts,
      averageDiscount,
      endingSoon,
      totalSavings: Math.round(totalSavings),
    };
  }, [currentTime, products]);

  const dynamicFilterOptions = useMemo(() => {
    const categories = Array.from(new Set([...categoriesList, ...products.map((p) => p.category)])).filter(Boolean);
    const brands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);
    const maxPrice = products.length > 0 ? Math.max(...products.map((p) => p.price)) : 100000;
    return {
      categories,
      brands,
      priceRange: { min: 0, max: maxPrice },
      discountRange: { min: 0, max: 100 },
      ratings: [1, 2, 3, 4, 5],
      tags: ["sale", "concession", "clearance", "flash-sale"],
      discountType: ["percentage", "fixed", "clearance"],
    };
  }, [products, categoriesList]);

  const { addToCart } = useCart();

  const handleAddToCart = (product: SaleProduct) => {
    const numericId = typeof product.id === "number" 
      ? product.id 
      : parseInt(product.id, 10) || Date.now();

    addToCart({
      id: numericId,
      category_id: 1,
      brand_id: 1,
      name: product.name,
      sku: `SALE-${numericId}`,
      description: product.description || "",
      base_price: product.price,
      stock_quantity: product.stock,
      weight: 1,
      is_seasonal: true,
      seasonal_start_date: new Date(),
      seasonal_end_date: new Date(product.saleEndDate),
      images: [{ image_url: product.image }],
    });
  };

  const handleQuickView = (product: SaleProduct) => {
    router.push(`/products/${product.id}`);
  };

  const handleAddToWishlist = async (product: SaleProduct) => {
    const ok = await addToWishlist(product.id);
    if (ok) alert(`"${product.name}" added to your wishlist!`);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 100000],
      discountRange: [0, 100],
      ratings: [],
      tags: [],
      availability: "all",
      discountType: ["percentage", "fixed", "clearance"],
      saleType: "all",
    });
    setSearchQuery("");
  };

  const handleBannerCtaClick = (bannerLink: string) => {
    console.log("Banner CTA clicked:", bannerLink);
  };

  // Safe Grid Class Mapper
  const gridClasses = useMemo(() => {
    if (viewMode.type === "list") return "grid gap-8 grid-cols-1";
    if (viewMode.type === "compact")
      return "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

    const colMap: Record<number, string> = {
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    };

    return `grid gap-8 ${colMap[viewMode.columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`;
  }, [viewMode]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.ratings.length > 0 ||
      filters.tags.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 100000 ||
      filters.discountRange[0] > 0 ||
      filters.discountRange[1] < 100 ||
      filters.availability !== "all" ||
      filters.discountType.length < 3 ||
      filters.saleType !== "all" ||
      Boolean(searchQuery)
    );
  }, [filters, searchQuery]);

  const mainBanner = saleBanners[0];
  
  // Find the product/discount with the latest expiration date (or fallback to banner)
  const maxSaleEndDate = useMemo(() => {
    const targetProducts = filteredAndSortedProducts.length > 0 ? filteredAndSortedProducts : products;
    if (targetProducts.length === 0) return mainBanner?.endDate;
    let maxTime = 0;
    let maxDateStr = "";
    targetProducts.forEach((p) => {
      if (p.saleEndDate) {
        const time = new Date(p.saleEndDate).getTime();
        if (!isNaN(time) && time > maxTime) {
          maxTime = time;
          maxDateStr = p.saleEndDate;
        }
      }
    });
    return maxDateStr || mainBanner?.endDate;
  }, [filteredAndSortedProducts, products, mainBanner]);

  // Compute highest product discount percentage
  const maxDiscountPercent = useMemo(() => {
    if (products.length === 0) return 70;
    return Math.max(...products.map((p) => p.discount || 0), 0);
  }, [products]);

  const dynamicBanner = useMemo(() => {
    if (!mainBanner) return undefined;
    return {
      ...mainBanner,
      discount: maxDiscountPercent > 0 ? `${maxDiscountPercent}% OFF` : mainBanner.discount,
    };
  }, [mainBanner, maxDiscountPercent]);

  const mainBannerCountdown = useMemo(() => {
    return maxSaleEndDate ? getCountdownTimer(maxSaleEndDate) : null;
  }, [maxSaleEndDate, currentTime]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">

        {/* ==================== 1. PRIVATE SALON OUTLET HEADER ==================== */}
        <header className="relative bg-gradient-to-b from-[#F7F3EC] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#E8E2D5] py-12 overflow-hidden">
          {/* 🎥 Background Video Effect Behind Banner */}
          <div 
            className="absolute inset-0 left-1/2 -translate-x-1/2 w-screen h-full overflow-hidden pointer-events-none z-0"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
            }}
          >
            <video
              src="/videos/bg_effect.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-75 filter brightness-115 contrast-95 transform translate-z-0"
            />
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[3px]" />
          </div>

          {/* Subtle Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

            {/* Editorial Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#7A7468] mb-6">
              <button
                onClick={() => router.push("/")}
                className="hover:text-[#1C1A17] transition-colors"
              >
                Maison
              </button>
              <span className="text-[#C5A059]">•</span>
              <span className="text-[#1C1A17] font-semibold">Private Salon Outlet</span>
            </nav>

            {/* Main Sale Banner Wrapper */}
            {products.length > 0 && dynamicBanner && mainBannerCountdown && (
              <SaleBanner
                banner={dynamicBanner}
                countdownTimer={mainBannerCountdown}
                onCtaClick={() => handleBannerCtaClick(dynamicBanner.ctaLink || "/")}
              />
            )}

            {/* Glassmorphic Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Stat 1: Total Products */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B]">
                    Privileged Offers
                  </span>
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5]">
                    <Tag className="w-4 h-4 text-[#8C6D2B]" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-bold text-[#1C1A17]">
                  {saleStats.totalProducts}
                </div>
                <div className="text-[10px] text-[#7A7468] uppercase tracking-wider mt-1">
                  Available in Salon
                </div>
              </div>

              {/* Stat 2: Avg Discount */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B]">
                    Mean Concession
                  </span>
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5]">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-bold text-[#1C1A17]">
                  {saleStats.averageDiscount}% OFF
                </div>
                <div className="text-[10px] text-[#7A7468] uppercase tracking-wider mt-1">
                  Guaranteed Sourced
                </div>
              </div>

              {/* Stat 3: Ending Soon */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B]">
                    Vault Closing Soon
                  </span>
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5]">
                    <Clock className="w-4 h-4 text-[#C5A059]" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-bold text-[#1C1A17]">
                  {saleStats.endingSoon}
                </div>
                <div className="text-[10px] text-[#7A7468] uppercase tracking-wider mt-1">
                  Final Hours Remaining
                </div>
              </div>

              {/* Stat 4: Total Savings */}
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B]">
                    Cumulative Value
                  </span>
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5]">
                    <Gem className="w-4 h-4 text-[#8C6D2B]" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-bold text-[#1C1A17]">
                  ৳{saleStats.totalSavings.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#7A7468] uppercase tracking-wider mt-1">
                  Clientèle Savings
                </div>
              </div>

            </div>

          </div>
        </header>

        {/* ==================== 2. MAIN CATALOG LAYOUT ==================== */}
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

          {/* 🎥 1. Behind the Banner Background Video Banner Effect */}
          <div 
            className="absolute top-[240px] left-1/2 -translate-x-1/2 w-screen h-[25%] overflow-hidden pointer-events-none z-0"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
            }}
          >
            <video
              src="/videos/bg_effect.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-75 filter brightness-115 contrast-95 transform translate-z-0"
            />
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[3px]" />
          </div>

          {/* 🎥 2. Middle Background Video Banner Effect */}
          <div 
            className="absolute top-[68%] left-1/2 -translate-x-1/2 w-screen h-[25%] overflow-hidden pointer-events-none z-0"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
            }}
          >
            <video
              src="/videos/bg_effect.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-75 filter brightness-115 contrast-95 transform translate-z-0"
            />
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[3px]" />
          </div>



          <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-3xl border border-[#E8E2D5] shadow-xl p-6 lg:p-8 flex flex-col lg:flex-row gap-10 items-start">

            {/* FILTER SIDEBAR */}
            <aside className="lg:w-72 flex-shrink-0 w-full sticky top-8 z-20">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm p-2">
                <SaleFilter
                  filters={filters}
                  filterOptions={dynamicFilterOptions}
                  onFilterChange={setFilters}
                  onClearFilters={handleClearFilters}
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                />
              </div>
            </aside>

            {/* MAIN CATALOG PANEL */}
            <section className="flex-1 w-full">

              {/* TOOLBAR CONTROLS */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-5 shadow-sm mb-8 space-y-4">

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                  {/* Left Side: Mobile Filter & Counter */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1A17] text-white text-xs font-bold uppercase tracking-widest rounded-none shadow-sm hover:bg-[#C5A059] transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Filter Salon</span>
                    </button>

                    <div className="text-xs font-medium text-[#6E685E] tracking-wide">
                      Showing{" "}
                      <span className="font-serif font-bold text-[#1C1A17] text-sm">
                        {filteredAndSortedProducts.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-serif font-bold text-[#1C1A17] text-sm">
                        {saleStats.totalProducts}
                      </span>{" "}
                      concessions
                    </div>

                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] transition-colors ml-2"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Right Side: Search, View Mode & Sort */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">

                    {/* Search Field */}
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-3.5 h-3.5" />
                      <input
                        type="text"
                        placeholder="Search outlet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-lg focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
                      />
                    </div>

                    {/* View Mode Toggle Switch */}
                    <div className="flex items-center p-1 bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg">
                      <button
                        onClick={() => setViewMode((prev) => ({ ...prev, type: "grid" }))}
                        title="Grid View"
                        className={`p-1.5 rounded transition-all ${viewMode.type === "grid"
                            ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                            : "text-[#9E988D] hover:text-[#1C1A17]"
                          }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode((prev) => ({ ...prev, type: "list" }))}
                        title="List View"
                        className={`p-1.5 rounded transition-all ${viewMode.type === "list"
                            ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                            : "text-[#9E988D] hover:text-[#1C1A17]"
                          }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode((prev) => ({ ...prev, type: "compact" }))}
                        title="Compact View"
                        className={`p-1.5 rounded transition-all ${viewMode.type === "compact"
                            ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                            : "text-[#9E988D] hover:text-[#1C1A17]"
                          }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Columns Selector (Grid Mode Only) */}
                    {viewMode.type === "grid" && (
                      <div className="relative">
                        <select
                          value={viewMode.columns}
                          onChange={(e) =>
                            setViewMode((prev) => ({
                              ...prev,
                              columns: parseInt(e.target.value),
                            }))
                          }
                          className="appearance-none bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold uppercase tracking-wider rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer shadow-sm"
                        >
                          <option value={2}>2 Cols</option>
                          <option value={3}>3 Cols</option>
                          <option value={4}>4 Cols</option>
                        </select>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8C6D2B] absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                      </div>
                    )}

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold uppercase tracking-wider rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer shadow-sm min-w-36"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C6D2B] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                    </div>

                  </div>
                </div>

                {/* ACTIVE FILTER CHIPS */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#E8E2D5]">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#C5A059]/40 text-[#1C1A17] rounded-full text-xs font-medium shadow-sm">
                        Search: &ldquo;{searchQuery}&rdquo;
                        <button
                          onClick={() => setSearchQuery("")}
                          className="hover:text-[#C5A059] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {filters.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-full text-xs font-medium shadow-sm"
                      >
                        {category}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              categories: prev.categories.filter((c) => c !== category),
                            }))
                          }
                          className="hover:text-[#C5A059] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {filters.brands.map((brand) => (
                      <span
                        key={brand}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-full text-xs font-medium shadow-sm"
                      >
                        {brand}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              brands: prev.brands.filter((b) => b !== brand),
                            }))
                          }
                          className="hover:text-[#C5A059] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {filters.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-full text-xs font-medium shadow-sm"
                      >
                        #{tag}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              tags: prev.tags.filter((t) => t !== tag),
                            }))
                          }
                          className="hover:text-[#C5A059] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {filters.saleType !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#C5A059]/40 text-[#8C6D2B] rounded-full text-xs font-medium shadow-sm">
                        Event:{" "}
                        {filters.saleType === "flash-sale"
                          ? "Flash Vault"
                          : filters.saleType === "clearance"
                            ? "Final Clearance"
                            : "Weekly Curation"}
                        <button
                          onClick={() => setFilters((prev) => ({ ...prev, saleType: "all" }))}
                          className="hover:text-[#1C1A17] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}

              </div>

              {/* SALE PRODUCTS GRID */}
              {filteredAndSortedProducts.length > 0 ? (
                <div className={gridClasses}>
                  {filteredAndSortedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="transition-transform duration-300 hover:-translate-y-1"
                    >
                      <SaleProductCard
                        product={product}
                        viewMode={viewMode.type}
                        onAddToCart={handleAddToCart}
                        onQuickView={handleQuickView}
                        onAddToWishlist={handleAddToWishlist}
                        countdownTimer={getCountdownTimer(product.saleEndDate)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* LUXURY EMPTY STATE */
                <div className="text-center py-20 px-6 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center mb-6 shadow-sm">
                    <Compass className="w-8 h-8 text-[#8C6D2B]" />
                  </div>
                  <h3 className="text-2xl font-serif text-[#1C1A17] mb-2">
                    No Salon Concessions Found
                  </h3>
                  <p className="text-sm text-[#6E685E] max-w-md mx-auto mb-8 font-light leading-relaxed">
                    We could not find any private outlet items corresponding to your selected filter criteria. Consider broadening your parameters.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md"
                  >
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    Reset Outlet Filters
                  </button>
                </div>
              )}

              {/* ==================== 3. ADDITIONAL PROMOTIONAL SALON BANNERS ==================== */}
              {saleBanners.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                  {saleBanners.slice(1).map((banner, index) => (
                    <div
                      key={index}
                      className="relative bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F5] to-[#F5EFE4] border border-[#E8E2D5] rounded-2xl p-8 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#C5A059] transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-white border border-[#C5A059]/40 flex items-center justify-center shadow-sm">
                            <Flame className="w-5 h-5 text-[#8C6D2B]" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">
                              Special Salon Event
                            </span>
                            <h3 className="text-2xl font-serif text-[#1C1A17] font-semibold">
                              {banner.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-[#5A554C] font-light leading-relaxed mb-6">
                          {banner.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleBannerCtaClick(banner.ctaLink)}
                        className="inline-flex items-center justify-center px-6 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-sm w-fit"
                      >
                        {banner.ctaText}
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </section>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default function SalePage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] flex items-center justify-center">
            <div className="animate-pulse text-xs text-[#8C6D2B] uppercase tracking-widest font-bold">
              Loading Sale Outlet...
            </div>
          </div>
        </MainLayout>
      }
    >
      <SaleContent />
    </Suspense>
  );
}