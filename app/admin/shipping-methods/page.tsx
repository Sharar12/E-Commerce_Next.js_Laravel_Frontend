"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Link from "next/link";
import {
  Search,
  Truck,
  DollarSign,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";

import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";

interface ShippingMethod {
  id: number;
  name: string;
  description?: string | null;
  fee: number | string;
  is_free_shipping: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export default function ShippingsPage() {
  const [loader, setLoader] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "fee_high" | "fee_low">("newest");
  const [error, setError] = useState<string | null>(null);

  const [viewMethod, setViewMethod] = useState<ShippingMethod | null>(null);
  const [editMethod, setEditMethod] = useState<ShippingMethod | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchShippingMethods = async () => {
    try {
      setLoader(true);
      setError(null);
      const res = await fetch(`${apiUrl}/shipping-methods`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        cache: "no-store",
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result?.data)) {
        setShippingMethods(result.data);
      } else if (Array.isArray(result)) {
        setShippingMethods(result);
      } else {
        setShippingMethods([]);
      }
    } catch (e) {
      setLoader(false);
      setError("Failed to load shipping methods.");
      console.error("Error:", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this shipping method?")) return;
    try {
      const res = await fetch(`${apiUrl}/shipping-methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setShippingMethods((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert("❌ Error deleting shipping method: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting shipping method!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMethod) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/shipping-methods/${editMethod.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify({
          name: editMethod.name,
          description: editMethod.description,
          fee: Number(editMethod.fee),
          is_free_shipping: Number(editMethod.is_free_shipping),
        }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setShippingMethods((prev) =>
          prev.map((m) => (m.id === editMethod.id ? { ...m, ...(result.data || editMethod) } : m))
        );
        setEditMethod(null);
      } else {
        alert("❌ Error updating shipping method: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating:", error);
      alert("Error updating shipping method!");
    }
  };

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const isFree = (v: boolean | number) => (typeof v === "boolean" ? v : Number(v) === 1);
  const money = (v: number | string) => `৳${Math.round(Number(v || 0))}`;

  // Filter & Sort Logic
  const filteredAndSortedMethods = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = shippingMethods.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        m.id.toString().includes(q)
    );

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "fee_high") {
        return Number(b.fee) - Number(a.fee);
      }
      if (sortBy === "fee_low") {
        return Number(a.fee) - Number(b.fee);
      }
      return 0;
    });
  }, [search, sortBy, shippingMethods]);

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Logistics & Delivery Operations
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Shipping Methods
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Configure available fulfillment shipping options, delivery fees, and complimentary free shipping rules.
            </p>
          </div>

          <Link
            href="/admin/shipping-methods/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Add Shipping Method</span>
          </Link>
        </div>

        {/* Controls: Search & Sort */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by shipping method name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <ArrowUpDown className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium appearance-none"
              >
                <option value="newest">Sort by: Newest Methods First</option>
                <option value="oldest">Sort by: Oldest Methods First</option>
                <option value="fee_high">Sort by: Shipping Fee (High to Low)</option>
                <option value="fee_low">Sort by: Shipping Fee (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loader ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
              Loading Shipping Methods...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-rose-200">
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        ) : filteredAndSortedMethods.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <Truck className="w-10 h-10 text-[#C5A059] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-serif font-bold text-[#1C1A17]">No shipping methods found</p>
            <p className="text-xs text-[#6E685E] mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedMethods.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="shipping methods"
            />
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                      <th className="p-4">ID</th>
                      <th className="p-4">Method Name</th>
                      <th className="p-4">Delivery Description</th>
                      <th className="p-4">Delivery Fee</th>
                      <th className="p-4">Complimentary Free</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {filteredAndSortedMethods
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-[#FFFDF9] transition-colors">
                          {/* ID */}
                          <td className="p-4 font-mono font-bold text-[#8C6D2B]">#{m.id}</td>

                          {/* Name */}
                          <td className="p-4 font-serif font-bold text-[#1C1A17] text-xs">
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-[#8C6D2B]" />
                              <span>{m.name}</span>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="p-4 text-[#5A554C] max-w-xs truncate">{m.description || "—"}</td>

                          {/* Fee */}
                          <td className="p-4 font-mono font-bold text-[#1C1A17] text-sm">
                            {isFree(m.is_free_shipping) || Number(m.fee) === 0 ? (
                              <span className="text-emerald-700 font-bold">FREE</span>
                            ) : (
                              money(m.fee)
                            )}
                          </td>

                          {/* Free Shipping Badge */}
                          <td className="p-4">
                            {isFree(m.is_free_shipping) ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Tier
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-700 border border-gray-200">
                                Standard Fee
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setViewMethod(m)}
                                className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all text-[#8C6D2B]"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditMethod(m)}
                                className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all text-[#1C1A17]"
                                title="Edit Shipping Method"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(m.id)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all"
                                title="Delete Method"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAndSortedMethods.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}

        {/* View Modal */}
        {viewMethod && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Shipping Method Details
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    {viewMethod.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMethod(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="divide-y divide-[#E8E2D5] bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex justify-between pb-2">
                    <span className="text-[#6E685E] font-medium">Method ID</span>
                    <span className="font-mono font-bold text-[#8C6D2B]">#{viewMethod.id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Name</span>
                    <span className="font-serif font-bold text-[#1C1A17]">{viewMethod.name}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Fee</span>
                    <span className="font-mono font-bold text-[#1C1A17]">
                      {isFree(viewMethod.is_free_shipping) || Number(viewMethod.fee) === 0 ? "FREE" : money(viewMethod.fee)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Complimentary Free Shipping</span>
                    <span className="font-bold text-[#1C1A17]">
                      {isFree(viewMethod.is_free_shipping) ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#6E685E] font-medium">Description</span>
                    <span className="font-medium text-[#1C1A17] text-right max-w-xs">{viewMethod.description || "—"}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setViewMethod(null)}
                    className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editMethod && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Update Shipping Method
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    {editMethod.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditMethod(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Method Name
                  </label>
                  <input
                    type="text"
                    value={editMethod.name}
                    onChange={(e) => setEditMethod({ ...editMethod, name: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editMethod.description || ""}
                    onChange={(e) => setEditMethod({ ...editMethod, description: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Shipping Fee (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editMethod.fee}
                    onChange={(e) => setEditMethod({ ...editMethod, fee: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Complimentary Free Shipping?
                  </label>
                  <select
                    value={isFree(editMethod.is_free_shipping) ? 1 : 0}
                    onChange={(e) => setEditMethod({ ...editMethod, is_free_shipping: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium"
                  >
                    <option value={1}>Yes (Free Tier)</option>
                    <option value={0}>No (Charged Fee)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setEditMethod(null)}
                    className="px-4 py-2 rounded-xl border border-[#E8E2D5] text-xs font-bold uppercase tracking-wider hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
