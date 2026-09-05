"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";
import { useGetCouponsQuery, useDeleteCouponMutation } from "../../services/couponApi";

type DiscountType = "percentage" | "fixed";
type CouponStatus = "active" | "inactive";
type CouponVisibility = "public" | "private" | "activity";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number | string;
  min_purchase_amount: number | string;
  max_discount_amount?: number | string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  usage_limit: number;
  status: CouponStatus;
  visibility?: CouponVisibility;
  assigned_user_id?: number | null;
  assigned_user?: User | null;
  activity_type?: string | null;
  activity_threshold?: number | null;
  activity_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function CouponsPage() {
  const { data: response, isLoading: loader } = useGetCouponsQuery();
  const coupons: Coupon[] = useMemo(() => {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  }, [response]);
  const [deleteCoupon] = useDeleteCouponMutation();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "code" | "discount_desc" | "discount_asc" | "min_purchase_desc" | "min_purchase_asc" | "valid_to">("created_desc");
  const [error, setError] = useState<string | null>(null);

  const [viewCoupon, setViewCoupon] = useState<Coupon | null>(null);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteCoupon(id).unwrap();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert("Failed to delete coupon!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCoupon) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/coupons/${editCoupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          code: editCoupon.code,
          description: editCoupon.description,
          discount_type: editCoupon.discount_type,
          discount_value: Number(editCoupon.discount_value),
          min_purchase_amount: Number(editCoupon.min_purchase_amount),
          max_discount_amount: editCoupon.max_discount_amount ? Number(editCoupon.max_discount_amount) : null,
          valid_from: editCoupon.valid_from || null,
          valid_to: editCoupon.valid_to || null,
          usage_limit: Number(editCoupon.usage_limit),
          status: editCoupon.status,
        }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setEditCoupon(null);
      } else {
        alert("❌ Error updating coupon: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating coupon:", error);
      alert("Error updating coupon!");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = coupons;
    if (q) {
      result = coupons.filter((c) => {
        const code = c.code?.toLowerCase() ?? "";
        const desc = (c.description ?? "").toString().toLowerCase();
        return code.includes(q) || desc.includes(q);
      });
    }

    return [...result].sort((a, b) => {
      if (sortBy === "created_desc") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
        return timeB - timeA;
      }
      if (sortBy === "created_asc") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id;
        return timeA - timeB;
      }
      if (sortBy === "code") return a.code.localeCompare(b.code);
      if (sortBy === "discount_desc") return Number(b.discount_value) - Number(a.discount_value);
      if (sortBy === "discount_asc") return Number(a.discount_value) - Number(b.discount_value);
      if (sortBy === "min_purchase_desc") return Number(b.min_purchase_amount) - Number(a.min_purchase_amount);
      if (sortBy === "min_purchase_asc") return Number(a.min_purchase_amount) - Number(b.min_purchase_amount);
      if (sortBy === "valid_to") {
        const dateA = a.valid_to ? new Date(a.valid_to).getTime() : 0;
        const dateB = b.valid_to ? new Date(b.valid_to).getTime() : 0;
        return dateA - dateB;
      }
      return 0;
    });
  }, [search, coupons, sortBy]);

  const paginatedCoupons = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  const money = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return "—";
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isNaN(n) ? String(v) : `৳${Math.round(n).toLocaleString()}`;
  };

  const fmtDiscount = (type: DiscountType, value: number | string) => {
    const n = typeof value === "string" ? Number(value) : value;
    return type === "percentage" ? `${n}%` : money(n);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-[#1C1A17]">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Privilege Vouchers</span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">Promotional Coupons</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search coupon code or detail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] font-medium"
            >
              <option value="created_desc">Sort by Creation: Newest First</option>
              <option value="created_asc">Sort by Creation: Oldest First</option>
              <option value="code">Sort by: Code (A-Z)</option>
              <option value="discount_desc">Sort by Discount: High to Low</option>
              <option value="discount_asc">Sort by Discount: Low to High</option>
              <option value="min_purchase_desc">Sort by Min Purchase: High to Low</option>
              <option value="min_purchase_asc">Sort by Min Purchase: Low to High</option>
              <option value="valid_to">Sort by Expiration Date</option>
            </select>
            <Link href="/admin/coupons/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl">
              + Add Coupon
            </Link>
          </div>
        </div>

        {loader && <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]"><p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Coupons...</p></div>}
        {!loader && error && <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-rose-200"><p className="text-xs font-bold text-rose-700">{error}</p></div>}
        {!loader && !error && filtered.length === 0 && <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]"><p className="text-xs text-[#5A554C]">No coupons found.</p></div>}

        {!loader && !error && filtered.length > 0 && (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="coupons"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-4 py-4">ID</th>
                    <th className="px-4 py-4">Code</th>
                    <th className="px-4 py-4">Scope</th>
                    <th className="px-4 py-4">Discount</th>
                    <th className="px-4 py-4">Min Purchase</th>
                    <th className="px-4 py-4">Valid From</th>
                    <th className="px-4 py-4">Valid To</th>
                    <th className="px-4 py-4">Usage Limit</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedCoupons.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FFFDF9] transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-[#8C6D2B]">#{c.id}</td>
                      <td className="px-4 py-4 font-mono font-bold text-[#1C1A17] uppercase">
                        <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#E8E2D5] rounded-md">{c.code}</span>
                      </td>
                      <td className="px-4 py-4">
                        {c.visibility === "private" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-800" title={c.assigned_user ? `${c.assigned_user.name} (${c.assigned_user.email})` : "Private"}>
                            🔒 Private {c.assigned_user ? `(${c.assigned_user.name})` : ""}
                          </span>
                        ) : c.visibility === "activity" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 border border-purple-200 text-purple-800" title={c.activity_description || `Activity: ${c.activity_type} (${c.activity_threshold})`}>
                            ⚡ Activity ({c.activity_type || "Achievement"})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 text-blue-800">
                            🌐 Public
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-[#1C1A17]">{fmtDiscount(c.discount_type, c.discount_value)}</td>
                      <td className="px-4 py-4 font-mono text-[#5A554C]">{money(c.min_purchase_amount)}</td>
                      <td className="px-4 py-4 font-mono text-[#5A554C]">{c.valid_from || "—"}</td>
                      <td className="px-4 py-4 font-mono text-[#5A554C]">{c.valid_to || "—"}</td>
                      <td className="px-4 py-4 font-mono font-bold text-[#1C1A17]">
                        <span className={(c as any).usages_count >= c.usage_limit ? "text-rose-600 font-extrabold" : "text-[#1C1A17]"}>
                          {(c as any).usages_count ?? 0} / {c.usage_limit}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {c.status === "active" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewCoupon(c)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="View">👁</button>
                          <button onClick={() => setEditCoupon(c)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}

        {/* View Modal */}
        {viewCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Coupon Detail</span>
                  <h3 className="text-xl font-serif text-[#1C1A17] uppercase tracking-wider">{viewCoupon.code}</h3>
                </div>
                <button onClick={() => setViewCoupon(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["ID", `#${viewCoupon.id}`],
                  ["Code", viewCoupon.code],
                  ["Visibility", viewCoupon.visibility === "private" ? "🔒 Private" : viewCoupon.visibility === "activity" ? "⚡ Activity Milestone" : "🌐 Public"],
                  ["Assigned Customer", viewCoupon.visibility === "private" && viewCoupon.assigned_user ? `${viewCoupon.assigned_user.name} (${viewCoupon.assigned_user.email})` : viewCoupon.visibility === "activity" ? "Activity Achievers" : "All Customers (Public)"],
                  ...(viewCoupon.visibility === "activity"
                    ? [
                        ["Activity Type", String(viewCoupon.activity_type || "Achievement")],
                        ["Required Threshold", `${viewCoupon.activity_threshold || 1} Count`],
                      ]
                    : []),
                  ["Discount", fmtDiscount(viewCoupon.discount_type, viewCoupon.discount_value)],
                  ["Type", viewCoupon.discount_type],
                  ["Min Purchase", money(viewCoupon.min_purchase_amount)],
                  ["Max Discount", money(viewCoupon.max_discount_amount ?? null)],
                  ["Valid From", viewCoupon.valid_from || "—"],
                  ["Valid To", viewCoupon.valid_to || "—"],
                  ["Usage Limit", String(viewCoupon.usage_limit)],
                  ["Status", viewCoupon.status],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-[#5A554C]">{label}</span>
                    <span className="font-semibold text-[#1C1A17]">{value}</span>
                  </div>
                ))}
                {viewCoupon.visibility === "activity" && viewCoupon.activity_description && (
                  <div className="py-2.5">
                    <span className="block text-[#8C6D2B] font-bold uppercase tracking-wider text-[10px] mb-1">⚡ Activity Requirement Goal</span>
                    <p className="text-[#1C1A17] font-medium bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D5]">{viewCoupon.activity_description}</p>
                  </div>
                )}
                {viewCoupon.description && (
                  <div className="py-2.5">
                    <span className="block text-[#5A554C] mb-1">Description</span>
                    <p className="text-[#1C1A17] font-medium">{viewCoupon.description}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewCoupon(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 my-4">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Coupon</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">{editCoupon.code}</h3>
                </div>
                <button onClick={() => setEditCoupon(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Code</label>
                    <input type="text" required value={editCoupon.code} onChange={(e) => setEditCoupon({ ...editCoupon, code: e.target.value.toUpperCase() })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                  </div>
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Status</label>
                    <select value={editCoupon.status} onChange={(e) => setEditCoupon({ ...editCoupon, status: e.target.value as CouponStatus })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Discount Type</label>
                    <select value={editCoupon.discount_type} onChange={(e) => setEditCoupon({ ...editCoupon, discount_type: e.target.value as DiscountType })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Discount Value</label>
                    <input type="number" step="0.01" min="0" value={editCoupon.discount_value} onChange={(e) => setEditCoupon({ ...editCoupon, discount_value: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                  </div>
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Min Purchase</label>
                    <input type="number" step="0.01" min="0" value={editCoupon.min_purchase_amount} onChange={(e) => setEditCoupon({ ...editCoupon, min_purchase_amount: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                  </div>
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Usage Limit</label>
                    <input type="number" min="0" value={editCoupon.usage_limit} onChange={(e) => setEditCoupon({ ...editCoupon, usage_limit: Number(e.target.value) })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                  </div>
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Valid From</label>
                    <input type="date" value={editCoupon.valid_from || ""} onChange={(e) => setEditCoupon({ ...editCoupon, valid_from: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                  </div>
                  <div>
                    <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Valid To</label>
                    <input type="date" value={editCoupon.valid_to || ""} onChange={(e) => setEditCoupon({ ...editCoupon, valid_to: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Description</label>
                  <textarea rows={2} value={editCoupon.description || ""} onChange={(e) => setEditCoupon({ ...editCoupon, description: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditCoupon(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
