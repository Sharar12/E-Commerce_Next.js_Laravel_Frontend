"use client";

import React from "react";
import type { CategoryBanner as CategoryBannerType } from "../types/category";
import { ArrowRight, Search, Crown, Sparkles } from "lucide-react";

interface CategoryBannerProps {
  banner: CategoryBannerType;
  onCtaClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CategoryBanner: React.FC<CategoryBannerProps> = ({
  banner,
  onCtaClick,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <section className="relative rounded-2xl overflow-hidden bg-[#0F0E0C] border border-[#D4AF37]/50 shadow-md p-8 md:p-12">
      {/* Top Video Background */}
      <video
        src="/videos/video2.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 transform translate-z-0"
      />
      
      {/* Dark Overlay Matching Top Video Header */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C] via-black/40 to-black/60 pointer-events-none" />

      {/* Background Ambient Halo Lights */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E2D4B9]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 text-center text-white max-w-3xl mx-auto space-y-6">
        
        {/* Department Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-[#C5A059] shadow-sm backdrop-blur-md">
          <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#D4AF37]">
            Maison Atelier • Curated Galleries
          </span>
        </div>

        {/* Headlines */}
        <div>
          <h1 className="text-3xl md:text-5xl font-serif text-white tracking-tight leading-tight mb-2">
            {banner?.title || "Explore Maison Atelier Galleries"}
          </h1>
          <p className="text-base md:text-lg font-serif italic text-[#D4AF37]">
            {banner?.subtitle || "Handcrafted Silks, Horology & Fine Apparels"}
          </p>
        </div>

        <p className="text-xs md:text-sm text-white/80 font-light leading-relaxed max-w-2xl mx-auto bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
          {banner?.description ||
            "Immerse in specialized departments curated for patrons seeking masterwork quality and unyielding elegance."}
        </p>

        {/* Luxury Search Input */}
        <div className="max-w-md mx-auto pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37] w-4 h-4" />
            <input
              type="text"
              placeholder="Search departments & galleries..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black/60 border border-[#C5A059]/40 text-white text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm backdrop-blur-md transition-all"
            />
          </div>
        </div>

        {/* CTA Action Button */}
        <div className="pt-2">
          <button
            onClick={onCtaClick}
            className="group inline-flex items-center gap-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 rounded-xl border border-[#D4AF37]/50"
          >
            <span>{banner?.ctaText || "Explore Complete Atelier"}</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default CategoryBanner;