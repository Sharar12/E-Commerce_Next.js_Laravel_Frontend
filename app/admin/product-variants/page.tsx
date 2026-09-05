"use client";

import { useEffect, useState } from "react";
import { apiUrl, adminToken, localBaseUrl } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";

interface ProductVariant {
  id: number;
  product_id: number;
  size_id: number;
  color: string;
  image?: string;
  additional_price: number | string;
  stock_quantity: number;
}

export default function ProductVariants() {
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/storage/")) return `${localBaseUrl}${imageUrl}`;
    return `${localBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");

  const [viewVariant, setViewVariant] = useState<ProductVariant | null>(null);
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchVariants = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/product-variants`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      setLoader(false);
      // Accept both { status:200, data:[] } and plain array responses
      if (Array.isArray(result.data)) {
        setProductVariants(result.data);
      } else if (Array.isArray(result)) {
        setProductVariants(result);
      } else {
        // Empty table or no data — silently show empty state
        setProductVariants([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching product variants:", error);
      setProductVariants([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product variant?")) return;
    try {
      const res = await fetch(`${apiUrl}/product-variants/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setProductVariants((prev) => prev.filter((v) => v.id !== id));
      } else {
        alert("❌ Error deleting variant: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      alert("Error deleting product variant!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVariant) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/product-variants/${editVariant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({
          color: editVariant.color,
          additional_price: Number(editVariant.additional_price),
          stock_quantity: editVariant.stock_quantity,
        }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setProductVariants((prev) => prev.map((v) => (v.id === editVariant.id ? { ...v, ...(result.data || editVariant) } : v)));
        setEditVariant(null);
      } else {
        alert("❌ Error updating variant: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating variant:", error);
      alert("Error updating product variant!");
    }
  };

  useEffect(() => { fetchVariants(); }, []);

  const filtered = productVariants.filter(
    (v) =>
      v.id.toString().includes(search) ||
      v.product_id.toString().includes(search) ||
      v.color.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedVariants = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Product Configuration Matrix</span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">Product Variants</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search product, color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />
            <Link href="/admin/product-variants/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl">
              + Add Variant
            </Link>
          </div>
        </div>

        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Variants...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="variants"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Thumbnail</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Variant / Description</th>
                    <th className="px-6 py-4">Additional Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedVariants.map((v) => (
                    <tr key={v.id} className="hover:bg-[#FFFDF9] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">#{v.id}</td>
                      <td className="px-6 py-4">
                        {v.image ? (
                          <img
                            src={getImageUrl(v.image)}
                            alt={v.color || "Variant"}
                            className="w-10 h-10 object-cover rounded-lg border border-[#E8E2D5]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-[#E8E2D5] flex items-center justify-center text-[10px] font-bold text-gray-400">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#1C1A17]">#{v.product_id}</td>
                      <td className="px-6 py-4 font-medium text-[#1C1A17]">{v.color || "—"}</td>
                      <td className="px-6 py-4 font-mono font-bold text-[#1C1A17]">+৳{Number(v.additional_price).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-[#1C1A17]">{v.stock_quantity}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewVariant(v)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="View">👁</button>
                          <button onClick={() => setEditVariant(v)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" title="Delete">🗑</button>
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
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No product variants found.</p>
          </div>
        )}

        {/* View Modal */}
        {viewVariant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Variant Detail</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Variant #{viewVariant.id}</h3>
                </div>
                <button onClick={() => setViewVariant(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              {viewVariant.image && (
                <div className="flex justify-center pb-3 border-b border-[#E8E2D5]">
                  <img
                    src={getImageUrl(viewVariant.image)}
                    alt={viewVariant.color}
                    className="w-24 h-24 object-cover rounded-xl border border-[#E8E2D5] shadow-sm"
                  />
                </div>
              )}
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["ID", `#${viewVariant.id}`],
                  ["Product", `#${viewVariant.product_id}`],
                  ["Color / Description", viewVariant.color],
                  ["Additional Price", `+৳${Number(viewVariant.additional_price).toFixed(2)}`],
                  ["Stock Quantity", String(viewVariant.stock_quantity)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-[#5A554C]">{label}</span>
                    <span className="font-semibold text-[#1C1A17]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewVariant(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editVariant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Variant</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Variant #{editVariant.id}</h3>
                </div>
                <button onClick={() => setEditVariant(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Color (hex or name)</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={editVariant.color.startsWith("#") ? editVariant.color : "#000000"} onChange={(e) => setEditVariant({ ...editVariant, color: e.target.value })} className="w-10 h-10 p-1 border border-[#E8E2D5] rounded-lg cursor-pointer" />
                    <input type="text" value={editVariant.color} onChange={(e) => setEditVariant({ ...editVariant, color: e.target.value })} className="flex-1 p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Additional Price (৳)</label>
                  <input type="number" step="0.01" min="0" value={editVariant.additional_price} onChange={(e) => setEditVariant({ ...editVariant, additional_price: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Stock Quantity</label>
                  <input type="number" min="0" required value={editVariant.stock_quantity} onChange={(e) => setEditVariant({ ...editVariant, stock_quantity: Number(e.target.value) })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditVariant(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
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