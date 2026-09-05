"use client";

import React, { useState, useMemo, useEffect } from "react";
import { NextPage } from "next";
import { apiUrl, localBaseUrl } from "../../common/http";
import { Category, CategoryGridConfig } from "../../types/category";
import { mockCategories, categoryBanner } from "../../data/mockCategories";
import CategoryCard from "../../components/CategoryCard";
import CategoryBanner from "../../components/CategoryBanner";
import LayoutControls from "../../components/LayoutControls";
import {
  Search,
  Filter,
  Grid,
  Star,
  Crown,
  Sparkles,
  Compass,
  RotateCcw,
  X,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import MainLayout from "../../components/Layouts";

const CategoriesPage: NextPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParent, setSelectedParent] = useState<string>("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiUrl}/categories`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          setCategories([]);
          return;
        }
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const fallbackImages = [
            "/women_fashon.jpg",
            "/women_fashon.jpg",
            "/women_fashon.jpg",
          ];
          const apiCats: Category[] = json.data.map((c: any, idx: number) => ({
            id: String(c.id),
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
            description: c.description || `Explore our exclusive ${c.name} collection.`,
            image: c.image ? (c.image.startsWith("http") ? c.image : `${localBaseUrl}${c.image.startsWith("/") ? "" : "/"}${c.image}`) : fallbackImages[idx % fallbackImages.length],
            productCount: c.products_count || c.products?.length || 12,
            subcategories: c.subcategories || [],
            featured: c.is_featured ? true : idx < 6,
            displayOrder: idx + 1,
          }));
          setCategories(apiCats);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const [gridConfig, setGridConfig] = useState<CategoryGridConfig>({
    columns: 4,
    gap: 6,
    aspectRatio: "4/3",
    showProductCount: true,
    showDescription: true,
    layout: "grid",
  });

  // Filter categories based on search and filters
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      // Search filter
      if (
        searchQuery &&
        !category.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !category.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Department filter
      if (selectedParent !== "all" && category.slug !== selectedParent) {
        return false;
      }

      // Featured filter
      if (showFeaturedOnly && !category.featured) {
        return false;
      }

      return true;
    });
  }, [categories, searchQuery, selectedParent, showFeaturedOnly]);

  // Get categories for department filter dropdown
  const parentCategories = useMemo(() => {
    const list = categories.map((cat) => ({ value: cat.slug, label: cat.name }));
    return [{ value: "all", label: "All Atelier Departments" }, ...list];
  }, [categories]);

  const handleCategoryClick = (category: Category) => {
    console.log("Category clicked:", category);
  };

  const handleQuickView = (category: Category) => {
    console.log("Quick view:", category);
  };

  const handleViewAllProducts = () => {
    console.log("View all products");
  };

  // Safe Grid Layout Mapper
  const gridClasses = useMemo(() => {
    if (gridConfig.layout === "masonry")
      return "grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-max";
    if (gridConfig.layout === "featured")
      return "grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

    const colMap: Record<number, string> = {
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    };

    return `grid gap-8 ${colMap[gridConfig.columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`;
  }, [gridConfig.layout, gridConfig.columns]);

  const hasActiveFilters = searchQuery || showFeaturedOnly || selectedParent !== "all";

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">

        {/* ==================== MAIN CATALOG & CONTROLS ==================== */}
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



          {/* White Container Box */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-3xl border border-[#E8E2D5] shadow-xl p-6 lg:p-8 space-y-8">

            {/* Category Banner Container */}
            <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-sm">
              <CategoryBanner
                banner={categoryBanner}
                onCtaClick={handleViewAllProducts}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Layout Configuration Bar */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-5 shadow-sm">
              <LayoutControls
                config={gridConfig}
                onConfigChange={setGridConfig}
                totalCategories={categories.length}
                filteredCount={filteredCategories.length}
              />
            </div>

            {/* Quick Filters Toolbar */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">

              {/* Parent Category Filter Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B]">
                  Department:
                </span>
                <div className="relative">
                  <select
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                    className="appearance-none bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold uppercase tracking-wider rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer shadow-sm"
                  >
                    {parentCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C6D2B] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Featured Only Toggle Button */}
              <button
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all duration-300 shadow-sm ${showFeaturedOnly
                    ? "bg-[#1C1A17] text-[#D4AF37] border-[#1C1A17]"
                    : "bg-white/80 text-[#5A554C] border-[#E8E2D5] hover:border-[#C5A059] hover:text-[#1C1A17]"
                  }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${showFeaturedOnly ? "text-[#D4AF37] fill-[#D4AF37]" : "text-[#8C6D2B]"
                    }`}
                />
                <span>Featured Masterpieces</span>
              </button>

            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#E8E2D5]">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] mr-2">
                  Active Filters:
                </span>

                {/* Search Tag */}
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

                {/* Department Tag */}
                {selectedParent !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-full text-xs font-medium shadow-sm">
                    Department: {parentCategories.find((c) => c.value === selectedParent)?.label}
                    <button
                      onClick={() => setSelectedParent("all")}
                      className="hover:text-[#C5A059] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Featured Tag */}
                {showFeaturedOnly && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#C5A059]/40 text-[#8C6D2B] rounded-full text-xs font-medium shadow-sm">
                    Featured Galleries Only
                    <button
                      onClick={() => setShowFeaturedOnly(false)}
                      className="hover:text-[#1C1A17] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Reset All Trigger */}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowFeaturedOnly(false);
                    setSelectedParent("all");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6D2B] hover:text-[#1C1A17] uppercase tracking-wider ml-auto transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset All
                </button>
              </div>
            )}

          </div>

          {/* CATEGORIES GRID */}
          {filteredCategories.length > 0 ? (
            <div className={gridClasses}>
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="transition-transform duration-300 hover:-translate-y-1"
                >
                  <CategoryCard
                    category={category}
                    layout={gridConfig.layout}
                    showDescription={gridConfig.showDescription}
                    showProductCount={gridConfig.showProductCount}
                    onCategoryClick={handleCategoryClick}
                    onQuickView={handleQuickView}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* LUXURY EMPTY STATE */
            <div className="text-center py-20 px-6 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm my-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center mb-6 shadow-sm">
                <Compass className="w-8 h-8 text-[#8C6D2B]" />
              </div>
              <h3 className="text-2xl font-serif text-[#1C1A17] mb-2">
                No Atelier Departments Found
              </h3>
              <p className="text-sm text-[#6E685E] max-w-md mx-auto mb-8 font-light leading-relaxed">
                We could not locate any specialized galleries matching your criteria. Consider resetting your search or category specifications.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowFeaturedOnly(false);
                  setSelectedParent("all");
                }}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Reset Gallery Filters
              </button>
            </div>
          )}

          {/* VIEW ALL PRODUCTS CTA BUTTON */}
          {filteredCategories.length > 0 && (
            <div className="text-center mt-16">
              <button
                onClick={handleViewAllProducts}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>Explore Complete Inventory</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          </div>

        </main>
      </div>
    </MainLayout>
  );
};

export default CategoriesPage;