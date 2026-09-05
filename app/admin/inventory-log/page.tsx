"use client";

import { useEffect, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";

export interface InventoryLog {
  id: number;
  product_id: number;
  variant_id: number | null;
  change_type: "in" | "out";
  quantity_changed: number;
  note: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export default function InventoryLogPage() {
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");

  const [viewLog, setViewLog] = useState<InventoryLog | null>(null);
  const [editLog, setEditLog] = useState<InventoryLog | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchLogs = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/inventory-log`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result.data)) {
        setInventoryLogs(result.data);
      } else if (Array.isArray(result)) {
        setInventoryLogs(result);
      } else {
        setInventoryLogs([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching inventory logs:", error);
      setInventoryLogs([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this inventory log?")) return;
    try {
      const res = await fetch(`${apiUrl}/inventory-log/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setInventoryLogs((prev) => prev.filter((log) => log.id !== id));
      } else {
        alert("❌ Error deleting log: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Error deleting inventory log!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/inventory-log/${editLog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ note: editLog.note, quantity_changed: editLog.quantity_changed, change_type: editLog.change_type }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setInventoryLogs((prev) => prev.map((log) => (log.id === editLog.id ? { ...log, ...(result.data || editLog) } : log)));
        setEditLog(null);
      } else {
        alert("❌ Error updating log: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating log:", error);
      alert("Error updating inventory log!");
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = inventoryLogs.filter(
    (log) =>
      log.id.toString().includes(search) ||
      log.product_id.toString().includes(search) ||
      (log.note && log.note.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedLogs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Stock Movement Ledger</span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">Inventory Log</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search product, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />
            <Link href="/admin/inventory-log/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl">
              + Add Log
            </Link>
          </div>
        </div>

        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Inventory Logs...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="inventory logs"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Variant</th>
                    <th className="px-6 py-4">Change Type</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Note</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FFFDF9] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">#{log.id}</td>
                      <td className="px-6 py-4 font-mono text-[#1C1A17] font-bold">#{log.product_id}</td>
                      <td className="px-6 py-4 font-mono text-[#5A554C]">{log.variant_id ? `#${log.variant_id}` : "—"}</td>
                      <td className="px-6 py-4">
                        {log.change_type === "in" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]">▲ In</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700">▼ Out</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#1C1A17]">{log.quantity_changed}</td>
                      <td className="px-6 py-4 text-[#5A554C] max-w-xs truncate">{log.note || "—"}</td>
                      <td className="px-6 py-4 font-mono text-[#5A554C]">{fmtDate(log.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewLog(log)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="View">👁</button>
                          <button onClick={() => setEditLog(log)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(log.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" title="Delete">🗑</button>
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
            <p className="text-xs text-[#5A554C]">No inventory logs found.</p>
          </div>
        )}

        {/* View Modal */}
        {viewLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Inventory Log Detail</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Log #{viewLog.id}</h3>
                </div>
                <button onClick={() => setViewLog(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["Log ID", `#${viewLog.id}`],
                  ["Product", `#${viewLog.product_id}`],
                  ["Variant", viewLog.variant_id ? `#${viewLog.variant_id}` : "—"],
                  ["Change Type", viewLog.change_type === "in" ? "▲ Stock In" : "▼ Stock Out"],
                  ["Quantity Changed", String(viewLog.quantity_changed)],
                  ["Date", fmtDate(viewLog.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-[#5A554C]">{label}</span>
                    <span className="font-semibold text-[#1C1A17]">{value}</span>
                  </div>
                ))}
                <div className="py-2.5">
                  <span className="block text-[#5A554C] mb-1">Note</span>
                  <p className="text-[#1C1A17] font-medium leading-relaxed">{viewLog.note || "No note."}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewLog(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Log</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Log #{editLog.id}</h3>
                </div>
                <button onClick={() => setEditLog(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Change Type</label>
                  <select value={editLog.change_type} onChange={(e) => setEditLog({ ...editLog, change_type: e.target.value as "in" | "out" })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]">
                    <option value="in">Stock In (▲)</option>
                    <option value="out">Stock Out (▼)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Quantity Changed</label>
                  <input type="number" min={1} required value={editLog.quantity_changed} onChange={(e) => setEditLog({ ...editLog, quantity_changed: Number(e.target.value) })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Note</label>
                  <textarea rows={3} value={editLog.note || ""} onChange={(e) => setEditLog({ ...editLog, note: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditLog(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
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