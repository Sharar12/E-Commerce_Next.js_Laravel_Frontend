"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, safeCurrentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm mt-4 text-xs font-sans text-[#1C1A17]">
      {/* Left Side: Summary & Items Per Page Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-[#6E685E] font-medium">
          Showing <span className="font-mono font-bold text-[#1C1A17]">{startItem}</span> to{" "}
          <span className="font-mono font-bold text-[#1C1A17]">{endItem}</span> of{" "}
          <span className="font-mono font-bold text-[#8C6D2B]">{totalItems}</span> entries
        </span>

        {/* Custom Items Per Page Dropdown */}
        <div className="flex items-center gap-2 border-l border-[#E8E2D5] pl-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B]">
            Per Page:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1); // Reset to first page when page size changes
            }}
            className="bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] font-semibold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all cursor-pointer shadow-inner"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} items
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Side: Pagination Nav Controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="First Page"
          className="p-2 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] text-[#1C1A17] hover:border-[#C5A059] hover:text-[#8C6D2B] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title="Previous Page"
          className="p-2 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] text-[#1C1A17] hover:border-[#C5A059] hover:text-[#8C6D2B] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === "number" ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 ${
                  safeCurrentPage === p
                    ? "bg-[#1C1A17] text-[#D4AF37] border border-[#C5A059] shadow-sm"
                    : "bg-[#FAF8F5] text-[#1C1A17] border border-[#E8E2D5] hover:border-[#C5A059] hover:text-[#8C6D2B]"
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-[#8C6D2B] font-bold">
                ...
              </span>
            )
          )}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          title="Next Page"
          className="p-2 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] text-[#1C1A17] hover:border-[#C5A059] hover:text-[#8C6D2B] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          title="Last Page"
          className="p-2 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] text-[#1C1A17] hover:border-[#C5A059] hover:text-[#8C6D2B] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
