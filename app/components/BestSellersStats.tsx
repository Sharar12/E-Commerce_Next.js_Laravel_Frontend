"use client";

import React from "react";
import { Users, Award, TrendingUp, Star, Crown, Package } from "lucide-react";

interface BestSellersStatsProps {
  stats?: {
    totalSales: number;
    growth: number;
    topProduct: string;
  };
  timeFrame?: string;
  onTimeFrameChange?: (timeFrame: string) => void;
  totalProducts?: number;
  averageRating?: number;
}

const BestSellersStats: React.FC<BestSellersStatsProps> = ({
  stats = { totalSales: 13254, growth: 12.5, topProduct: "Wireless Noise Cancelling Headphones" },
  timeFrame = "all-time",
  onTimeFrameChange = () => {},
  totalProducts = 8,
  averageRating = 4.8,
}) => {
  const timeFrames = [
    { id: "all-time", label: "All Time" },
    { id: "this-month", label: "This Month" },
    { id: "this-week", label: "This Week" },
    { id: "today", label: "Today" },
  ];

  return (
    <div className="relative bg-[#0F0E0C] border border-[#D4AF37]/50 rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
      {/* Top Video Background */}
      <video
        src="/videos/video3.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-105 transform translate-z-0"
      />
      
      {/* Dark Overlay Matching Top Video Header */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C] via-black/50 to-black/70 pointer-events-none" />

      {/* Background Ambient Halo Lights */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E2D4B9]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col gap-6 relative z-10">
        
        {/* Top Row: Title, Description & Timeframe Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-[#C5A059] shadow-sm backdrop-blur-md mb-2">
              <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37]">
                Maison Acclaim • Real-Time Metrics
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
              The Masterpiece Rank
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl font-light mt-1">
              Top-performing artifacts defined by critical acclaim, timeless elegance, and international demand.
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-black/60 border border-white/10 rounded-full self-start md:self-auto backdrop-blur-md">
            {timeFrames.map((tf) => {
              const isActive = timeFrame === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => onTimeFrameChange(tf.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "bg-[#C5A059] text-white shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: 4 Metric Cards in 1 Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Sales */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-[#C5A059]/30 shadow-sm hover:border-[#D4AF37] transition-all duration-300">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-md bg-black/80 border border-[#C5A059]/40">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Acquisitions
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-white mb-0.5">
              {stats?.totalSales ? stats.totalSales.toLocaleString() : 13254}
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              +{stats?.growth ?? 12.5}% Growth
            </div>
          </div>

          {/* Card 2: Top Product */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-[#C5A059]/30 shadow-sm hover:border-[#D4AF37] transition-all duration-300">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-md bg-black/80 border border-[#C5A059]/40">
                <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                #1 Crown Piece
              </span>
            </div>
            <div className="text-xs font-serif font-bold text-white line-clamp-1 truncate" title={stats?.topProduct || "Wireless Noise Cancelling Headphones"}>
              {stats?.topProduct || "Wireless Noise Cancelling Headphones"}
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-[#D4AF37] mt-1">
              Rank #1 Best Seller
            </div>
          </div>

          {/* Card 3: Active Products */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-[#C5A059]/30 shadow-sm hover:border-[#D4AF37] transition-all duration-300">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-md bg-black/80 border border-[#C5A059]/40">
                <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Curations
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-white mb-0.5">
              {totalProducts}
            </div>
            <div className="text-[9px] text-white/70 uppercase tracking-wider font-medium">
              In Top Hierarchy
            </div>
          </div>

          {/* Card 4: Average Rating */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-[#C5A059]/30 shadow-sm hover:border-[#D4AF37] transition-all duration-300">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded-md bg-black/80 border border-[#C5A059]/40">
                <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Acclaim
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-white mb-0.5">
              {averageRating}
            </div>
            <div className="text-[9px] text-white/70 uppercase tracking-wider font-medium">
              Out of 5.0 Stars
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BestSellersStats;