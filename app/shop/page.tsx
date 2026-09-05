"use client";
export const dynamic = "force-dynamic";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { Product, FilterState, PaginationInfo } from "../types/shop";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'bestseller', label: 'Bestsellers' }
];
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Compass,
  Crown,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "../components/Layouts";
import { apiUrl, adminToken } from "../common/http";
import { useCart } from "../contexts/CartContext";

import { useGetProductsQuery } from "../services/productApi";
import { useGetCategoryTreeQuery } from "../services/categoryApi";

interface ApiProduct {
  id: number;
  name: string;
  base_price: number;
  stock_quantity: number;
  category_id?: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  images?: { image_url: string }[];
  description?: string;
  created_at?: string;
  reviews?: any[];
  status?: string;
}

const ShopContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const { data: productsResponse, isLoading: productsLoading } = useGetProductsQuery();
  const { data: categoryTreeResponse } = useGetCategoryTreeQuery();

  const categoriesTree = (categoryTreeResponse?.data as unknown as any[]) || [];

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    brand: [],
    priceRange: [0, 100000],
    rating: [],
    searchQuery: "",
  });
  const [sortBy, setSortBy] = useState<string>("featured");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productsPerPage, setProductsPerPage] = useState<number>(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    if (productsResponse) {
      const rawData = productsResponse.data || productsResponse;
      const productList = Array.isArray(rawData) ? (rawData as unknown as ApiProduct[]) : [];
      
      const activeProducts = productList.filter((p: any) => p.status === 'active' || p.status === undefined || !p.status);
      const mapped = activeProducts.map((p: ApiProduct) => {
        const firstImage = p.images?.[0]?.image_url || "";
        const productReviews = p.reviews || [];
        const reviewCount = productReviews.length;
        const avgRating = reviewCount > 0
          ? productReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviewCount
          : 0;

        return {
          id: String(p.id),
          name: p.name,
          price: Number(p.base_price) || 0,
          originalPrice: undefined,
          discount: undefined,
          discountText: undefined,
          image: firstImage,
          images: p.images?.map((img: any) => img.image_url) || [],
          category: p.category?.name || "Uncategorized",
          categoryId: p.category_id || p.category?.id,
          brand: p.brand?.name || "Generic",
          rating: Math.round(avgRating * 10) / 10,
          reviewCount,
          inStock: p.stock_quantity > 0,
          stockCount: p.stock_quantity,
          stock: p.stock_quantity,
          tags: [],
          isNew: false,
          isBestseller: false,
          description: p.description || "",
        };
      });
      setAllProducts(mapped);
      setLoading(false);
    } else {
      setLoading(productsLoading);
    }
  }, [productsResponse, productsLoading]);

  // Sync categoryParam from URL query string
  useEffect(() => {
    if (categoryParam) {
      setFilters((prev) => ({
        ...prev,
        category: [categoryParam],
      }));
    }
  }, [categoryParam]);

  // Derive filter options from fetched categories & products
  const dynamicFilterOptions = useMemo(() => {
    const productCategories = allProducts.map((p) => p.category);
    const brands = [...new Set(allProducts.map((p) => p.brand))];
    const maxPrice = allProducts.length > 0 ? Math.max(...allProducts.map((p) => p.price)) : 100000;
    return {
      categories: Array.from(new Set(productCategories)),
      brands: brands,
      priceRange: { min: 0, max: maxPrice },
      ratings: [1, 2, 3, 4, 5],
    };
  }, [allProducts]);

  // Helper function to collect target category name/ID and all its descendant category names/IDs
  const getSelectedCategoryNames = useMemo(() => {
    if (filters.category.length === 0) return new Set<string>();

    const names = new Set<string>(filters.category);

    const collectDescendants = (nodes: any[]) => {
      nodes.forEach((node) => {
        const isMatch = names.has(node.name) || names.has(String(node.id));
        if (isMatch) {
          const addAll = (n: any) => {
            names.add(n.name);
            names.add(String(n.id));
            if (n.children && n.children.length > 0) {
              n.children.forEach(addAll);
            }
          };
          addAll(node);
        } else if (node.children && node.children.length > 0) {
          collectDescendants(node.children);
        }
      });
    };

    collectDescendants(categoriesTree);
    return names;
  }, [filters.category, categoriesTree]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = allProducts.filter((product: any) => {
      if (
        filters.searchQuery &&
        !product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !product.brand.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (filters.category.length > 0) {
        const selectedCats = getSelectedCategoryNames;
        const matchesCat = selectedCats.has(product.category) ||
          (product.categoryId && selectedCats.has(String(product.categoryId)));
        if (!matchesCat) return false;
      }

      if (filters.brand.length > 0 && !filters.brand.includes(product.brand)) {
        return false;
      }

      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      if (filters.rating.length > 0 && !filters.rating.some((r) => product.rating >= r)) {
        return false;
      }

      return true;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return sorted;
  }, [allProducts, filters, sortBy]);

  // Pagination
  const paginationInfo: PaginationInfo = useMemo(() => {
    const totalProducts = filteredAndSortedProducts.length;
    const totalPages = Math.ceil(totalProducts / productsPerPage) || 1;
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      totalProducts,
      productsPerPage,
      currentProducts,
    };
  }, [filteredAndSortedProducts, currentPage, productsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, productsPerPage]);

  const { addToCart } = useCart();

  const handleAddToCart = (product: Product) => {
    const numericId = typeof product.id === "number"
      ? product.id
      : parseInt(product.id, 10) || Date.now();

    addToCart({
      id: numericId,
      category_id: 1,
      brand_id: 1,
      name: product.name,
      sku: `SHOP-${numericId}`,
      description: "",
      base_price: product.price,
      stock_quantity: product.stock,
      weight: 1,
      is_seasonal: false,
      seasonal_start_date: new Date(),
      seasonal_end_date: new Date(),
      images: product.image ? [{ image_url: product.image }] : [],
    });
  };

  const handleQuickView = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleClearFilters = () => {
    setFilters({
      category: [],
      brand: [],
      priceRange: [0, 100000],
      rating: [],
      searchQuery: "",
    });
  };

  const handleRemoveCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category.filter((c) => c !== category),
    }));
  };

  const handleRemoveBrand = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brand: prev.brand.filter((b) => b !== brand),
    }));
  };

  const handleRemoveRating = (rating: number) => {
    setFilters((prev) => ({
      ...prev,
      rating: prev.rating.filter((r) => r !== rating),
    }));
  };

  const hasActiveFilters =
    filters.category.length > 0 ||
    filters.brand.length > 0 ||
    filters.rating.length > 0 ||
    Boolean(filters.searchQuery);

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">
        {/* COMPACT VIDEO HERO HEADER WITH SUBTLE FADED BORDERS */}
        <header 
          className="relative h-[45vh] min-h-[320px] w-full overflow-hidden flex items-center justify-center border-b border-white/10 bg-[#0F0E0C]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)'
          }}
        >
          <video
            src="/videos/video1.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 transform translate-z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C] via-black/40 to-black/60" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/70 border border-[#C5A059] backdrop-blur-md">
              <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]">
                Maison Master Catalogue
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif text-white tracking-tight">
              The Haute Collection
            </h1>

            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto font-light bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              Curated artifacts, timepieces, and apparel. Hand-selected for the discerning connoisseur.
            </p>
          </div>
        </header>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          {/* 🎥 1. Top Background Video Banner Effect with Smooth Faded Edges */}
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

          {/* 🎥 2. Middle Background Video Banner Effect with Smooth Faded Edges */}
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
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm p-2">
                <FilterSidebar
                  filters={filters}
                  filterOptions={dynamicFilterOptions}
                  onFilterChange={setFilters}
                  onClearFilters={handleClearFilters}
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                />
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <section className="flex-1 w-full">

              {/* TOOLBAR */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-5 shadow-sm mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1A17] text-white text-xs font-bold uppercase tracking-widest rounded-none shadow-sm hover:bg-[#C5A059] transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Filter Atelier</span>
                    </button>
                    <div className="text-xs font-medium text-[#6E685E] tracking-wide">
                      Showing{" "}
                      <span className="font-serif font-bold text-[#1C1A17] text-sm">
                        {paginationInfo.currentProducts.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-serif font-bold text-[#1C1A17] text-sm">
                        {loading ? "..." : paginationInfo.totalProducts}
                      </span>{" "}
                      masterpieces
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center p-1 bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg">
                      <button
                        onClick={() => setViewMode("grid")}
                        title="Grid View"
                        className={`p-1.5 rounded transition-all ${viewMode === "grid"
                            ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                            : "text-[#9E988D] hover:text-[#1C1A17]"
                          }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        title="List View"
                        className={`p-1.5 rounded transition-all ${viewMode === "list"
                            ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                            : "text-[#9E988D] hover:text-[#1C1A17]"
                          }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold uppercase tracking-wider rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer shadow-sm"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C6D2B] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={productsPerPage}
                        onChange={(e) => setProductsPerPage(Number(e.target.value))}
                        className="appearance-none bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold uppercase tracking-wider rounded-lg px-3 py-2.5 pr-7 focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer shadow-sm"
                      >
                        <option value={12}>12 / pg</option>
                        <option value={24}>24 / pg</option>
                        <option value={48}>48 / pg</option>
                      </select>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C6D2B] absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* SEARCH */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by title, atelier, or gemstone..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] focus:ring-1 focus:ring-[#1C1A17] transition-all shadow-inner"
                  />
                  {filters.searchQuery && (
                    <button
                      onClick={() => setFilters({ ...filters, searchQuery: "" })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9E988D] hover:text-[#1C1A17]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* ACTIVE FILTER CHIPS */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-8 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-[#E8E2D5]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] mr-2">Active Filters:</span>
                  {filters.searchQuery && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#C5A059]/40 text-[#1C1A17] rounded-full text-xs shadow-sm font-medium">
                      Search: &ldquo;{filters.searchQuery}&rdquo;
                      <button onClick={() => setFilters({ ...filters, searchQuery: "" })} className="hover:text-[#C5A059] transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.category.map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-full text-xs shadow-sm font-medium">
                      {cat}
                      <button onClick={() => handleRemoveCategory(cat)} className="hover:text-[#C5A059] transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {filters.brand.map((brand) => (
                    <span key={brand} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-full text-xs shadow-sm font-medium">
                      {brand}
                      <button onClick={() => handleRemoveBrand(brand)} className="hover:text-[#C5A059] transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {filters.rating.map((rating) => (
                    <span key={rating} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-full text-xs shadow-sm font-medium">
                      {rating}★ & Up
                      <button onClick={() => handleRemoveRating(rating)} className="hover:text-[#C5A059] transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <button onClick={handleClearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6D2B] hover:text-[#1C1A17] uppercase tracking-wider ml-auto transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset All
                  </button>
                </div>
              )}

              {/* PRODUCTS */}
              {loading ? (
                <div className="text-center py-20">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 w-48 bg-[#E8E2D5] rounded mx-auto" />
                    <p className="text-xs text-[#8C6D2B] uppercase tracking-widest font-bold">Loading Masterpieces...</p>
                  </div>
                </div>
              ) : paginationInfo.currentProducts.length > 0 ? (
                <div className={`grid gap-8 mb-12 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {paginationInfo.currentProducts.map((product) => (
                    <div key={product.id} className="transition-transform duration-300 hover:-translate-y-1">
                      <div onClick={() => handleProductClick(product)} className="cursor-pointer">
                        <ProductCard
                          product={product}
                          onAddToCart={handleAddToCart}
                          onQuickView={handleQuickView}
                          viewMode={viewMode}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-6 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm my-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center mb-6 shadow-sm">
                    <Compass className="w-8 h-8 text-[#8C6D2B]" />
                  </div>
                  <h3 className="text-2xl font-serif text-[#1C1A17] mb-2">No Curations Match Your Search</h3>
                  <p className="text-sm text-[#6E685E] max-w-md mx-auto mb-8 font-light leading-relaxed">We could not find any artifacts corresponding to your selected specifications.</p>
                  <button onClick={handleClearFilters} className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Reset Filter Specifications
                  </button>
                </div>
              )}

              {/* PAGINATION */}
              {paginationInfo.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E8E2D5] pt-8 gap-4">
                  <p className="text-xs text-[#7A7468] uppercase tracking-wider font-medium">
                    Page{" "}<span className="font-serif font-bold text-[#1C1A17] text-sm">{paginationInfo.currentPage}</span>{" "}of{" "}
                    <span className="font-serif font-bold text-[#1C1A17] text-sm">{paginationInfo.totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                      className="p-2.5 rounded-lg border border-[#E8E2D5] bg-white text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: paginationInfo.totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = currentPage === pageNum;
                      return (
                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition-all shadow-sm ${isActive ? "bg-[#1C1A17] text-[#D4AF37] border border-[#1C1A17]" : "bg-white text-[#1C1A17] border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5]"}`}>
                          {pageNum}
                        </button>
                      );
                    })}
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, paginationInfo.totalPages))}
                      disabled={currentPage === paginationInfo.totalPages}
                      className="p-2.5 rounded-lg border border-[#E8E2D5] bg-white text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </section>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] flex items-center justify-center">
            <div className="animate-pulse text-xs text-[#8C6D2B] uppercase tracking-widest font-bold">
              Loading Shop...
            </div>
          </div>
        </Layout>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
