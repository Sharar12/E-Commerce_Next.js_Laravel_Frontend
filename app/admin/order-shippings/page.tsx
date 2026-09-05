"use client";

import { useEffect, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";

export interface OrderShipping {
  id: number;
  order_id: number;
  shipping_method_id: number;
  address: string;
  tracking_number: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export default function OrderShippingsPage() {
  const [orderShippings, setOrderShippings] = useState<OrderShipping[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");

  const [viewShipping, setViewShipping] = useState<OrderShipping | null>(null);
  const [editShipping, setEditShipping] = useState<OrderShipping | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchShippings = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/order-shippings`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result.data)) {
        setOrderShippings(result.data);
      } else if (Array.isArray(result)) {
        setOrderShippings(result);
      } else {
        setOrderShippings([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching order shippings:", error);
      setOrderShippings([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this shipping record?")) return;
    try {
      const res = await fetch(`${apiUrl}/order-shippings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setOrderShippings((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("❌ Error deleting: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting shipping record!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShipping) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/order-shippings/${editShipping.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ address: editShipping.address, tracking_number: editShipping.tracking_number }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setOrderShippings((prev) => prev.map((s) => (s.id === editShipping.id ? { ...s, ...(result.data || editShipping) } : s)));
        setEditShipping(null);
      } else {
        alert("❌ Error updating: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating:", error);
      alert("Error updating shipping record!");
    }
  };

  useEffect(() => { fetchShippings(); }, []);

  const filtered = orderShippings.filter(
    (s) =>
      s.id.toString().includes(search) ||
      s.order_id.toString().includes(search) ||
      s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Delivery Tracking & Dispatch</span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">Order Shippings</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search order, tracking number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />
            <Link href="/admin/order-shippings/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl">
              + Add Shipping
            </Link>
          </div>
        </div>

        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Shipping Records...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="shipping records"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Tracking Number</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {filtered
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">#{s.id}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#1C1A17]">#{s.order_id}</td>
                        <td className="px-6 py-4 text-[#5A554C] max-w-xs truncate">{s.address}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E8E2D5] font-mono text-[11px] text-[#1C1A17]">{s.tracking_number}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[#5A554C]">{fmtDate(s.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewShipping(s)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="View">👁</button>
                            <button onClick={() => setEditShipping(s)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="Edit">✏️</button>
                            <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" title="Delete">🗑</button>
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
            <p className="text-xs text-[#5A554C]">No shipping records found.</p>
          </div>
        )}

        {/* View Modal */}
        {viewShipping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Shipping Record</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Shipping #{viewShipping.id}</h3>
                </div>
                <button onClick={() => setViewShipping(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["Shipping ID", `#${viewShipping.id}`],
                  ["Order", `#${viewShipping.order_id}`],
                  ["Shipping Method", `#${viewShipping.shipping_method_id}`],
                  ["Tracking Number", viewShipping.tracking_number],
                  ["Created", fmtDate(viewShipping.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-[#5A554C]">{label}</span>
                    <span className="font-semibold text-[#1C1A17] text-right">{value}</span>
                  </div>
                ))}
                <div className="py-2.5">
                  <span className="block text-[#5A554C] mb-1">Delivery Address</span>
                  <p className="text-[#1C1A17] font-medium leading-relaxed">{viewShipping.address}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewShipping(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editShipping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Shipping</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Shipping #{editShipping.id}</h3>
                </div>
                <button onClick={() => setEditShipping(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Delivery Address</label>
                  <textarea rows={3} required value={editShipping.address} onChange={(e) => setEditShipping({ ...editShipping, address: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Tracking Number</label>
                  <input type="text" required value={editShipping.tracking_number} onChange={(e) => setEditShipping({ ...editShipping, tracking_number: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditShipping(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
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