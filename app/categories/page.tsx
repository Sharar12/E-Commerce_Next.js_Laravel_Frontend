"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, localBaseUrl } from "../common/http";
import MainLayout from "../components/Layouts";
import { ChevronRight, ArrowLeft, Sparkles, Compass } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
  status: number;
  products_count?: number;
  parent_id?: number | null;
  children?: ApiCategory[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildImgUrl(image?: string | null): string {
  if (!image) return "/women_fashon.jpg";
  if (image.startsWith("http")) return image;
  return `${localBaseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
}

// ─── Sub-component: Category Card ─────────────────────────────────────────────

function DrillCard({
  cat,
  onClick,
  size = "large",
}: {
  cat: ApiCategory;
  onClick: () => void;
  size?: "large" | "medium" | "small";
}) {
  const hasChildren = (cat.children?.length || 0) > 0;
  const heightClass =
    size === "large" ? "h-64" : size === "medium" ? "h-48" : "h-36";

  return (
    <button
      onClick={onClick}
      className={`group relative w-full ${heightClass} rounded-2xl overflow-hidden border border-[#E8E2D5] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left`}
    >
      {/* Image */}
      <img
        src={buildImgUrl(cat.image)}
        alt={cat.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/80 via-[#1C1A17]/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-serif font-bold text-base leading-tight">
          {cat.name}
        </h3>
        {cat.products_count !== undefined && (
          <p className="text-[#C5A059] text-[11px] font-semibold mt-0.5">
            {cat.products_count} product{cat.products_count !== 1 ? "s" : ""}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1 text-[#FAF8F5]/70 text-[10px] font-medium uppercase tracking-wider">
          {hasChildren ? (
            <>
              <span>Browse</span>
              <ChevronRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              <span>Shop Now</span>
            </>
          )}
        </div>
      </div>

      {/* Hover border */}
      <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-[#C5A059]/60 transition-all duration-300 pointer-events-none" />
    </button>
  );
}

import { useGetCategoryTreeQuery } from "../services/categoryApi";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const router = useRouter();
  const { data: response, isLoading: loading } = useGetCategoryTreeQuery();
  const tree = (response?.data as unknown as ApiCategory[]) || [];

  // Drill-down state: null = at Level-1 root
  const [selectedL1, setSelectedL1] = useState<ApiCategory | null>(null);
  const [selectedL2, setSelectedL2] = useState<ApiCategory | null>(null);

  // ── Navigation handlers ──────────────────────────────────────────────────────

  const handleL1Click = (cat: ApiCategory) => {
    if ((cat.children?.length || 0) === 0) {
      // No children → go straight to shop
      router.push(`/shop?category=${cat.id}`);
    } else {
      setSelectedL1(cat);
      setSelectedL2(null);
    }
  };

  const handleL2Click = (cat: ApiCategory) => {
    if ((cat.children?.length || 0) === 0) {
      router.push(`/shop?category=${cat.id}`);
    } else {
      setSelectedL2(cat);
    }
  };

  const handleL3Click = (cat: ApiCategory) => {
    router.push(`/shop?category=${cat.id}`);
  };

  const goBack = () => {
    if (selectedL2) {
      setSelectedL2(null);
    } else {
      setSelectedL1(null);
    }
  };

  // ── Breadcrumb ───────────────────────────────────────────────────────────────

  const breadcrumb = [
    { label: "All Categories", onClick: () => { setSelectedL1(null); setSelectedL2(null); } },
    ...(selectedL1 ? [{ label: selectedL1.name, onClick: () => setSelectedL2(null) }] : []),
    ...(selectedL2 ? [{ label: selectedL2.name, onClick: () => {} }] : []),
  ];

  // ── Current cards ─────────────────────────────────────────────────────────────

  const currentCats: ApiCategory[] =
    selectedL2
      ? selectedL2.children || []
      : selectedL1
      ? selectedL1.children || []
      : tree;

  const currentLevel = selectedL2 ? 3 : selectedL1 ? 2 : 1;

  const handleCardClick = (cat: ApiCategory) => {
    if (currentLevel === 1) handleL1Click(cat);
    else if (currentLevel === 2) handleL2Click(cat);
    else handleL3Click(cat);
  };

  const cardSize = currentLevel === 1 ? "large" : currentLevel === 2 ? "medium" : "small";

  const gridCols =
    currentLevel === 1
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : currentLevel === 2
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  // ── Section title ─────────────────────────────────────────────────────────────

  const sectionTitle = selectedL2
    ? selectedL2.name
    : selectedL1
    ? selectedL1.name
    : "All Departments";

  const sectionSubtitle = selectedL2
    ? "Child Categories"
    : selectedL1
    ? "Sub-Categories"
    : "Browse by Department";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">

          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden h-52 sm:h-64 border border-[#E8E2D5] shadow-xl">
            <img
              src="/women_fashon.jpg"
              alt="Atelier Collections"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C1A17]/80 to-[#1C1A17]/20 flex flex-col justify-center px-8 sm:px-12">
              <span className="text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
                Haute Couture Catalog
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif text-white font-bold leading-tight">
                Atelier Collections
              </h1>
              <p className="text-[#FAF8F5]/70 text-sm mt-1 font-light">
                Curated Masterpieces &amp; Signature Departments
              </p>
            </div>
          </div>

          {/* Breadcrumb + Back */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] px-5 py-3 shadow-sm flex items-center gap-2 flex-wrap">
            {selectedL1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-xs font-bold text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#9E988D] flex-shrink-0" />}
                <button
                  onClick={crumb.onClick}
                  className={`text-xs font-semibold transition-colors ${
                    i === breadcrumb.length - 1
                      ? "text-[#1C1A17] cursor-default"
                      : "text-[#8C6D2B] hover:text-[#1C1A17]"
                  }`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Section Header */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              {sectionSubtitle}
            </span>
            <h2 className="text-2xl font-serif text-[#1C1A17] font-bold">
              {sectionTitle}
            </h2>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="text-center py-20 bg-white/80 rounded-2xl border border-[#E8E2D5]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
                Loading Atelier Departments...
              </p>
            </div>
          ) : currentCats.length > 0 ? (
            <div className={`grid gap-6 ${gridCols}`}>
              {currentCats.map((cat) => (
                <DrillCard
                  key={cat.id}
                  cat={cat}
                  onClick={() => handleCardClick(cat)}
                  size={cardSize}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-6 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center mb-6">
                <Compass className="w-8 h-8 text-[#8C6D2B]" />
              </div>
              <h3 className="text-2xl font-serif text-[#1C1A17] mb-2">
                No Sub-Categories Found
              </h3>
              <button
                onClick={() => router.push(`/shop?category=${selectedL2?.id || selectedL1?.id}`)}
                className="mt-4 inline-flex items-center gap-2 px-8 py-3.5 bg-[#1C1A17] hover:bg-[#C5A059] text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md rounded-xl"
              >
                <Sparkles className="w-4 h-4" />
                Browse Products in This Category
              </button>
            </div>
          )}
        </main>
      </div>
    </MainLayout>
  );
}
