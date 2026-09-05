"use client";

import React from "react";

interface TopControlBarProps {
  itemsPerPage: number;
  totalItems: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export default function TopControlBar({
  itemsPerPage,
  totalItems,
  onItemsPerPageChange,
  onPageChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  itemLabel = "entries",
}: TopControlBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm text-xs text-[#1C1A17] mb-4">
      <div className="flex items-center gap-3">
        <span className="text-[#6E685E] font-medium">Per Page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="py-1.5 px-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] font-mono font-bold text-xs rounded-xl focus:outline-none focus:border-[#C5A059] transition-all shadow-inner cursor-pointer"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-[#9E988D] text-[11px]">{itemLabel} per page</span>
      </div>
      <div className="text-[#8C6D2B] font-mono text-[11px] font-bold">
        Total <span className="font-bold text-[#1C1A17]">{totalItems}</span> {itemLabel}
      </div>
    </div>
  );
}
