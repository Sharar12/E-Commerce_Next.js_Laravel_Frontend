"use client";

import React from "react";
import { CategoryGridConfig } from "../types/category";
import { Grid, Layout, Star, SlidersHorizontal, Eye, EyeOff } from "lucide-react";

interface LayoutControlsProps {
  config: CategoryGridConfig;
  onConfigChange: (config: CategoryGridConfig) => void;
  totalCategories: number;
  filteredCount: number;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
  config,
  onConfigChange,
  totalCategories,
  filteredCount,
}) => {
  const layoutOptions = [
    { value: "grid", label: "Grid", icon: Grid },
    { value: "masonry", label: "Masonry", icon: Layout },
    { value: "featured", label: "Featured", icon: Star },
  ];

  const columnOptions = [2, 3, 4, 5];
  const gapOptions = [4, 6, 8];

  return (
    <div className="bg-transparent">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side - Results Counter */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-serif font-semibold text-[#1C1A17]">
            Departments
          </h2>
          <div className="text-xs font-medium text-[#6E685E] tracking-wide">
            Showing{" "}
            <span className="font-serif font-bold text-[#1C1A17] text-sm">
              {filteredCount}
            </span>{" "}
            of{" "}
            <span className="font-serif font-bold text-[#1C1A17] text-sm">
              {totalCategories}
            </span>{" "}
            galleries
          </div>
        </div>

        {/* Right Side - Luxury Controls */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Layout Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B]">
              Display:
            </span>
            <div className="flex bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-1">
              {layoutOptions.map((option) => {
                const Icon = option.icon;
                const isActive = config.layout === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      onConfigChange({ ...config, layout: option.value as any })
                    }
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                        : "text-[#9E988D] hover:text-[#1C1A17]"
                    }`}
                    title={option.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columns Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B]">
              Columns:
            </span>
            <div className="flex bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-1">
              {columnOptions.map((columns) => {
                const isActive = config.columns === columns;
                return (
                  <button
                    key={columns}
                    onClick={() => onConfigChange({ ...config, columns })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                        : "text-[#9E988D] hover:text-[#1C1A17]"
                    }`}
                  >
                    {columns}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacing Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B]">
              Spacing:
            </span>
            <div className="flex bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-1">
              {gapOptions.map((gap) => {
                const isActive = config.gap === gap;
                return (
                  <button
                    key={gap}
                    onClick={() => onConfigChange({ ...config, gap })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-white text-[#1C1A17] shadow-sm border border-[#E8E2D5]"
                        : "text-[#9E988D] hover:text-[#1C1A17]"
                    }`}
                  >
                    {gap}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                onConfigChange({
                  ...config,
                  showProductCount: !config.showProductCount,
                })
              }
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                config.showProductCount
                  ? "bg-[#1C1A17] text-[#D4AF37] border-[#1C1A17]"
                  : "bg-white/80 text-[#9E988D] border-[#E8E2D5] hover:text-[#1C1A17]"
              }`}
              title="Toggle Product Count"
            >
              {config.showProductCount ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() =>
                onConfigChange({
                  ...config,
                  showDescription: !config.showDescription,
                })
              }
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                config.showDescription
                  ? "bg-[#1C1A17] text-[#D4AF37] border-[#1C1A17]"
                  : "bg-white/80 text-[#9E988D] border-[#E8E2D5] hover:text-[#1C1A17]"
              }`}
              title="Toggle Descriptions"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LayoutControls;