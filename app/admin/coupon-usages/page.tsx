"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  Repeat,
  ShoppingBag,
  Ticket,
  User as UserIcon,
  Eye,
  Trash2,
  Calendar,
} from "lucide-react";

export interface CouponUsage {
  id: number;
  coupon_id: number;
  user_id: number;
  order_id: number;
  used_at?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  coupon?: { id: number; code: string; discount_type: string; discount_value: number };
  user?: { id: number; name: string; email: string };
  order?: { id: number; order_code?: string; total_amount?: number; grand_total?: number; status?: string };
}

export default function CouponUsagesPage() {
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [loader, setLoader] = useState(false);

  // Controls: Search, Filter, Sort
  const [search, setSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "customer" | "user_usage_count">("newest");

  const [viewUsage, setViewUsage] = useState<CouponUsage | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchUsages = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/coupon-usages`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result.data)) {
        setCouponUsages(result.data);
      } else if (Array.isArray(result)) {
        setCouponUsages(result);
      } else {
        setCouponUsages([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching coupon usages:", error);
      setCouponUsages([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon usage record?")) return;
    try {
      const res = await fetch(`${apiUrl}/coupon-usages/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setCouponUsages((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert("❌ Error deleting: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting coupon usage!");
    }
  };

  useEffect(() => { fetchUsages(); }, []);

  // Compute total usage count per user for each specific coupon code
  const couponUserUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    couponUsages.forEach((u) => {
      if (u.user_id && u.coupon_id) {
        const key = `${u.user_id}_${u.coupon_id}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [couponUsages]);

  // Extract unique coupon codes for filter dropdown
  const uniqueCoupons = useMemo(() => {
    const map = new Map<string, string>();
    couponUsages.forEach((u) => {
      if (u.coupon?.code) {
        map.set(u.coupon.code, u.coupon.code);
      }
    });
    return Array.from(map.values());
  }, [couponUsages]);

  // Format Order ID into 8-character uppercase alphanumeric Order Code (e.g. 7X9A2K1Q)
  const getOrderCode = (u: CouponUsage) => {
    if (u.order?.order_code) return u.order.order_code;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let hash = 0;
    const str = `ORDER_${u.order_id}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.abs(hash + i * 17) % chars.length];
    }
    return code;
  };

  // Search, Filter & Sort Logic
  const filteredAndSortedUsages = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = couponUsages.filter((u) => {
      // Search check
      const orderCodeStr = getOrderCode(u).toLowerCase();
      const rawOrderIdStr = u.order_id.toString();
      const couponCodeStr = u.coupon?.code?.toLowerCase() || "";
      const userNameStr = u.user?.name?.toLowerCase() || "";
      const userEmailStr = u.user?.email?.toLowerCase() || "";

      const matchSearch =
        !q ||
        orderCodeStr.includes(q) ||
        rawOrderIdStr.includes(q) ||
        couponCodeStr.includes(q) ||
        userNameStr.includes(q) ||
        userEmailStr.includes(q);

      // Coupon Filter Check
      const matchCoupon =
        couponFilter === "all" || (u.coupon?.code && u.coupon.code === couponFilter);

      return matchSearch && matchCoupon;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        const timeA = new Date(a.used_at || a.created_at || 0).getTime();
        const timeB = new Date(b.used_at || b.created_at || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === "oldest") {
        const timeA = new Date(a.used_at || a.created_at || 0).getTime();
        const timeB = new Date(b.used_at || b.created_at || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === "customer") {
        const nameA = a.user?.name || `User #${a.user_id}`;
        const nameB = b.user?.name || `User #${b.user_id}`;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "user_usage_count") {
        const countA = couponUserUsageCounts[`${a.user_id}_${a.coupon_id}`] || 0;
        const countB = couponUserUsageCounts[`${b.user_id}_${b.coupon_id}`] || 0;
        return countB - countA;
      }
      return 0;
    });
  }, [couponUsages, search, couponFilter, sortBy, couponUserUsageCounts]);

  const paginatedUsages = useMemo(() => {
    return filteredAndSortedUsages.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredAndSortedUsages, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, couponFilter, sortBy]);

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Redemption Audit Trail
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Coupon Usages History
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Inspect customer coupon redemption history, user usage counts, and associated order codes.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={fetchUsages}
              disabled={loader}
              className="px-4 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {loader ? "↻ Loading..." : "↻ Refresh"}
            </button>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#8C6D2B] text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
              <Ticket className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Automatic Checkout Audit Log</span>
            </div>
          </div>
        </div>

        {/* Controls: Search, Filter & Sort */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order code, coupon, or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              />
            </div>

            {/* Filter by Coupon Code */}
            <div className="relative">
              <Filter className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={couponFilter}
                onChange={(e) => setCouponFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium appearance-none"
              >
                <option value="all">All Coupon Codes</option>
                {uniqueCoupons.map((code) => (
                  <option key={code} value={code}>
                    Coupon: {code}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <ArrowUpDown className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium appearance-none"
              >
                <option value="newest">Sort by: Newest Usage First</option>
                <option value="oldest">Sort by: Oldest Usage First</option>
                <option value="user_usage_count">Sort by: Customer Usage Count (Most Times)</option>
                <option value="customer">Sort by: Customer Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loader ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
              Loading Usage Audit Records...
            </p>
          </div>
        ) : filteredAndSortedUsages.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <Ticket className="w-10 h-10 text-[#C5A059] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-serif font-bold text-[#1C1A17]">No coupon usages found</p>
            <p className="text-xs text-[#6E685E] mt-1">Try adjusting your search query or filter selection.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedUsages.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="coupon usages"
            />
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="p-4">Log ID</th>
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Redeemed Customer</th>
                    <th className="p-4">User Usage Count</th>
                    <th className="p-4">Order Code</th>
                    <th className="p-4">Redeemed At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedUsages.map((u) => {
                    return (
                      <tr key={u.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="p-4 font-mono font-bold text-[#8C6D2B]">#{u.id}</td>

                        {/* Coupon Code */}
                        <td className="p-4 font-mono font-bold text-[#1C1A17] uppercase">
                          {u.coupon ? (
                            <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#E8E2D5] rounded-md text-[#8C6D2B]">
                              {u.coupon.code}
                            </span>
                          ) : (
                            <span className="text-[#6E685E]">Coupon #{u.coupon_id}</span>
                          )}
                        </td>

                        {/* Redeemed Customer */}
                        <td className="p-4">
                          {u.user ? (
                            <div>
                              <div className="font-serif font-bold text-[#1C1A17] text-xs">{u.user.name}</div>
                              <div className="text-[11px] font-mono text-[#6E685E]">{u.user.email}</div>
                            </div>
                          ) : (
                            <span className="font-serif font-semibold text-[#1C1A17]">User #{u.user_id}</span>
                          )}
                        </td>

                        {/* User Usage Count */}
                        <td className="p-4">
                          {(() => {
                            const timesUsed = couponUserUsageCounts[`${u.user_id}_${u.coupon_id}`] || 1;
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                                <Repeat className="w-3 h-3 text-[#8C6D2B]" />
                                {timesUsed} {timesUsed === 1 ? "time used" : "times used"}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Order Code */}
                        <td className="p-4 font-mono font-bold text-[#1C1A17]">
                          <span className="inline-flex items-center gap-1 bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E8E2D5]">
                            <ShoppingBag className="w-3 h-3 text-[#8C6D2B]" />
                            {getOrderCode(u)}
                          </span>
                        </td>

                        {/* Redeemed At */}
                        <td className="p-4 font-mono text-[#5A554C]">
                          {fmtDate(u.used_at || u.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewUsage(u)}
                              className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all text-[#8C6D2B]"
                              title="View Redemption Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAndSortedUsages.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
          </div>
        )}

        {/* View Modal */}
        {viewUsage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Usage Redemption Record
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    Redemption Record #{viewUsage.id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewUsage(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="divide-y divide-[#E8E2D5] bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex justify-between pb-2">
                    <span className="text-[#6E685E] font-medium">Log Record ID</span>
                    <span className="font-mono font-bold text-[#8C6D2B]">#{viewUsage.id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Coupon Promo Code</span>
                    <span className="font-mono font-bold text-[#1C1A17]">
                      {viewUsage.coupon ? viewUsage.coupon.code : `#${viewUsage.coupon_id}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Customer Name</span>
                    <span className="font-serif font-bold text-[#1C1A17]">
                      {viewUsage.user ? `${viewUsage.user.name} (${viewUsage.user.email})` : `User #${viewUsage.user_id}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Total Customer Redemptions</span>
                    <span className="font-mono font-bold text-[#8C6D2B]">
                      {couponUserUsageCounts[`${viewUsage.user_id}_${viewUsage.coupon_id}`] || 1} time(s) used
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Associated Order Code</span>
                    <span className="font-mono font-bold text-[#1C1A17]">
                      {getOrderCode(viewUsage)} (ID: #{viewUsage.order_id})
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#6E685E] font-medium">Redemption Timestamp</span>
                    <span className="font-mono text-[#1C1A17]">{fmtDate(viewUsage.used_at || viewUsage.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setViewUsage(null)}
                    className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}