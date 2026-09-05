"use client";

import React, { useState, useMemo } from "react";
import { addToWishlist } from "../common/wishlist";
import { useRouter } from "next/navigation";
import { BestSellerProduct, FilterState, ViewMode } from "../types/best-sellers";
const sortOptions = [
  { value: "rank", label: "Rank: High to Low", field: "rank", order: "asc" },
  { value: "sales-high", label: "Sales: High to Low", field: "salesCount", order: "desc" },
  { value: "revenue-high", label: "Revenue: High to Low", field: "revenue", order: "desc" },
  { value: "rating-high", label: "Rating: High to Low", field: "rating", order: "desc" },
  { value: "price-low", label: "Price: Low to High", field: "price", order: "asc" },
  { value: "price-high", label: "Price: High to Low", field: "price", order: "desc" },
];
import BestSellerCard from "../components/BestSellerCard";
import BestSellersStats from "../components/BestSellersStats";
import BestSellersFilter from "../components/BestSellersFilter";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  Award,
  Crown,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Compass,
  X,
  ChevronRight,
  ShieldCheck,
  Gem,
} from "lucide-react";
import Layout from "../components/Layouts";
import { useCart } from "../contexts/CartContext";
import { apiUrl, adminToken } from "../common/http";
import { useEffect } from "react";

interface ApiProduct {
  id: number;
  name: string;
  base_price: number;
  stock_quantity: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  images?: { image_url: string }[];
  reviews?: { id: number; rating: number }[];
  description?: string;
}

const BestSellersPage: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<BestSellerProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    priceRange: [0, 100000],
    ratings: [],
    tags: [],
    timeFrame: "all-time",
    availability: "all",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = adminToken();
        const headers: HeadersInit = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const [res, catRes] = await Promise.all([
          fetch(`${apiUrl}/products`, { headers }),
          fetch(`${apiUrl}/categories`, { headers }),
        ]);

        const data = await res.json();
        const catData = await catRes.json();
        const productList = data.data || data;
        const catList = catData.data || catData;

        if (Array.isArray(catList)) {
          setCategoriesList(catList.map((c: any) => c.name));
        }

        if (Array.isArray(productList)) {
          const activeProducts = productList.filter((p: any) => p.status === 'active' || p.status === undefined);
          // Sort active products by actual delivered sales_count descending
          const sortedBySales = [...activeProducts].sort((a: any, b: any) => (Number(b.sales_count) || 0) - (Number(a.sales_count) || 0));

          const mapped: BestSellerProduct[] = sortedBySales.slice(0, 100).map((p: ApiProduct, index: number) => {
            const firstImage = p.images?.[0]?.image_url || "";
            const productReviews = p.reviews || [];
            const reviewCount = productReviews.length;
            const avgRating = reviewCount > 0
              ? productReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviewCount
              : 0;
            const realSales = Number((p as any).sales_count) || 0;

            return {
              id: String(p.id),
              name: p.name,
              brand: p.brand?.name || "Lumina",
              price: Number(p.base_price),
              image: firstImage,
              category: p.category?.name || "Luxury",
              subcategory: "Crown Curation",
              rating: avgRating,
              reviewCount: reviewCount,
              stock: Number(p.stock_quantity),
              isBestseller: true,
              isNew: false,
              tags: ["bestseller", "canon"],
              salesCount: realSales,
              revenue: Number(p.base_price) * realSales,
              rank: index + 1,
              previousRank: index + 1,
              rankChange: "same",
              description: p.description || "",
              variants: [],
            };
          });
          setProducts(mapped);

          const maxPrice = mapped.length > 0 ? Math.max(...mapped.map((p) => p.price)) : 100000;
          setFilters((prev) => ({
            ...prev,
            priceRange: [prev.priceRange[0], Math.max(prev.priceRange[1], maxPrice)],
          }));
        }
      } catch (err) {
        console.error("Failed to fetch products for best sellers page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  const [sortBy, setSortBy] = useState<string>("rank");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>({ type: "ranked", columns: 3 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

      // Rating filter
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

      return true;
    });

    // Sort products
    const sortOption = sortOptions.find((option) => option.value === sortBy) || sortOptions[0];
    filtered.sort((a, b) => {
      const aValue = a[sortOption.field as keyof BestSellerProduct];
      const bValue = b[sortOption.field as keyof BestSellerProduct];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOption.order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOption.order === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [filters, sortBy, searchQuery, products]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!products.length) return "5.0";
    const total = products.reduce((sum, product) => sum + product.rating, 0);
    return (total / products.length).toFixed(1);
  }, [products]);

  const { addToCart } = useCart();

  const handleAddToCart = (product: BestSellerProduct) => {
    const numericId = typeof product.id === "number"
      ? product.id
      : parseInt(product.id, 10) || Date.now();

    addToCart({
      id: numericId,
      category_id: 1,
      brand_id: 1,
      name: product.name,
      sku: `BEST-${numericId}`,
      description: product.description || "",
      base_price: product.price,
      stock_quantity: product.stock,
      weight: 1,
      is_seasonal: false,
      seasonal_start_date: new Date(),
      seasonal_end_date: new Date(),
      images: product.image ? [{ image_url: product.image }] : [],
    });
  };

  const handleQuickView = (product: BestSellerProduct) => {
    console.log("Quick view:", product);
  };

  const handleAddToWishlist = async (product: BestSellerProduct) => {
    const ok = await addToWishlist(product.id);
    if (ok) alert(`"${product.name}" added to your wishlist!`);
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 1500],
      ratings: [],
      tags: [],
      timeFrame: "all-time",
      availability: "all",
    });
    setSearchQuery("");
  };

  const handleTimeFrameChange = (timeFrame: string) => {
    setFilters((prev) => ({ ...prev, timeFrame: timeFrame as any }));
  };

  // Safe layout grid class mapping
  const gridClasses = useMemo(() => {
    if (viewMode.type === "list" || viewMode.type === "ranked") {
      return "grid gap-8 grid-cols-1";
    }

    const columnMap: Record<number, string> = {
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    };

    return `grid gap-8 ${columnMap[viewMode.columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`;
  }, [viewMode]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.ratings.length > 0 ||
      filters.tags.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 1500 ||
      filters.availability !== "all" ||
      filters.timeFrame !== "all-time" ||
      Boolean(searchQuery)
    );
  }, [filters, searchQuery]);

  const dynamicFilterOptions = useMemo(() => {
    const categories = Array.from(new Set([...categoriesList, ...products.map((p) => p.category)])).filter(Boolean);
    const brands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);
    const maxPrice = products.length > 0 ? Math.max(...products.map((p) => p.price)) : 100000;
    return {
      categories,
      brands,
      priceRange: { min: 0, max: maxPrice },
      ratings: [1, 2, 3, 4, 5],
      tags: ["bestseller", "canon", "featured"],
    };
  }, [products, categoriesList]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">

        {/* ==================== MAIN CONTENT & FILTERS ==================== */}
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">

          {/* CHAMPAGNE STATS & REAL-TIME METRICS VIDEO CONTAINER */}
          <BestSellersStats
            stats={{
              totalSales: products.reduce((acc, p) => acc + p.salesCount, 0),
              growth: 18.4,
              topProduct: products[0]?.name || "Haute Couture Collection",
            }}
            timeFrame={filters.timeFrame}
            onTimeFrameChange={handleTimeFrameChange}
            totalProducts={products.length}
            averageRating={parseFloat(averageRating)}
          />

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



          {/* White Container Box */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-3xl border border-[#E8E2D5] shadow-xl p-6 lg:p-8 flex flex-col lg:flex-row gap-10 items-start">

            {/* FILTER SIDEBAR */}
            <aside className="lg:w-72 flex-shrink-0 w-full sticky top-8 z-20">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm p-2">
                <BestSellersFilter
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

                  {/* Left Side: Mobile Filter & Count */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1A17] text-white text-xs font-bold uppercase tracking-widest rounded-none shadow-sm hover:bg-[#C5A059] transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Refine Rank</span>
                    </button>

                    <div className="text-xs font-medium text-[#6E685E] tracking-wide">
                      Showing{" "}
                      <span className="font-serif font-bold text-[#1C1A17] text-sm">
                        {filteredAndSortedProducts.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-serif font-bold text-[#1C1A17] text-sm">
                        {products.length}
                      </span>{" "}
                      ranked items
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

                    {/* Search Input */}
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-3.5 h-3.5" />
                      <input
                        type="text"
                        placeholder="Search top rank..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-lg focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
                      />
                    </div>

                    {/* View Mode Toggle Switch */}
                    <div className="flex items-center p-1 bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg">
                      <button
                        onClick={() => setViewMode((prev) => ({ ...prev, type: "ranked" }))}
                        title="Ranked View"
                        className={`p-1.5 rounded transition-all ${viewMode.type === "ranked"
                            ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                            : "text-[#9E988D] hover:text-[#1C1A17]"
                          }`}
                      >
                        <Award className="w-4 h-4 text-[#8C6D2B]" />
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
                        onClick={() => setViewMode((prev) => ({ ...prev, type: "grid" }))}
                        title="Grid View"
                        className={`p-1.5 rounded transition-all ${viewMode.type === "grid"
                            ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                            : "text-[#9E988D] hover:text-[#1C1A17]"
                          }`}
                      >
                        <Grid className="w-4 h-4" />
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

                    {filters.timeFrame !== "all-time" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#C5A059]/40 text-[#8C6D2B] rounded-full text-xs font-medium shadow-sm">
                        Timeframe: {filters.timeFrame}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, timeFrame: "all-time" }))
                          }
                          className="hover:text-[#1C1A17] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}

              </div>

              {/* PRODUCTS GRID / RANKED LIST */}
              {filteredAndSortedProducts.length > 0 ? (
                <div className={gridClasses}>
                  {filteredAndSortedProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="transition-transform duration-300 hover:-translate-y-1"
                    >
                      <BestSellerCard
                        product={{ ...product, rank: index + 1 }}
                        viewMode={viewMode.type}
                        onAddToCart={handleAddToCart}
                        onQuickView={handleQuickView}
                        onAddToWishlist={handleAddToWishlist}
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
                    No Ranked Masterpieces Found
                  </h3>
                  <p className="text-sm text-[#6E685E] max-w-md mx-auto mb-8 font-light leading-relaxed">
                    We could not locate any best sellers matching your exact search parameters. Consider broadening your filters.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md"
                  >
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    Reset All Specifications
                  </button>
                </div>
              )}

              {/* ==================== 3. PILLARS OF DISTINCTION ==================== */}
              {filteredAndSortedProducts.length > 0 && (
                <section className="mt-16 bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-[#E8E2D5] shadow-sm">
                  <div className="text-center mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C6D2B] block mb-1">
                      Maison Heritage
                    </span>
                    <h3 className="text-2xl font-serif text-[#1C1A17]">
                      Pillars of Distinction
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Pillar 1 */}
                    <div className="p-6 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] text-center hover:border-[#C5A059] transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-white border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Crown className="w-5 h-5 text-[#8C6D2B]" />
                      </div>
                      <h4 className="font-serif font-semibold text-[#1C1A17] mb-1">
                        Proven Quality
                      </h4>
                      <p className="text-xs text-[#6E685E] font-light leading-relaxed">
                        Endorsed and validated by thousands of discerning patrons worldwide.
                      </p>
                    </div>

                    {/* Pillar 2 */}
                    <div className="p-6 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] text-center hover:border-[#C5A059] transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-white border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Gem className="w-5 h-5 text-[#8C6D2B]" />
                      </div>
                      <h4 className="font-serif font-semibold text-[#1C1A17] mb-1">
                        Critical Acclaim
                      </h4>
                      <p className="text-xs text-[#6E685E] font-light leading-relaxed">
                        Consistently verified with top-tier ratings and certified authenticity.
                      </p>
                    </div>

                    {/* Pillar 3 */}
                    <div className="p-6 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] text-center hover:border-[#C5A059] transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-white border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-[#8C6D2B]" />
                      </div>
                      <h4 className="font-serif font-semibold text-[#1C1A17] mb-1">
                        Priority Concierge
                      </h4>
                      <p className="text-xs text-[#6E685E] font-light leading-relaxed">
                        Reserved inventory ensuring white-glove priority dispatch.
                      </p>
                    </div>
                  </div>
                </section>
              )}

            </section>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default BestSellersPage;