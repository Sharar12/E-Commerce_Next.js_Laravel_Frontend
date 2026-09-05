"use client";

import { useEffect, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";

interface Payment {
  id: number;
  order_id: number;
  user_id?: number;
  payment_method: string;
  transaction_id: string;
  amount: number | string;
  status: "pending" | "success" | "failed" | "refunded" | string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");

  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchPayments = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/payments`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result.data)) {
        setPayments(result.data);
      } else if (Array.isArray(result)) {
        setPayments(result);
      } else {
        setPayments([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching payments:", error);
      setPayments([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    try {
      const res = await fetch(`${apiUrl}/payments/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setPayments((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("❌ Error deleting payment: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Error deleting payment!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayment) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/payments/${editPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ status: editPayment.status, payment_method: editPayment.payment_method }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setPayments((prev) => prev.map((p) => (p.id === editPayment.id ? { ...p, ...(result.data || editPayment) } : p)));
        setEditPayment(null);
      } else {
        alert("❌ Error updating payment: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating payment:", error);
      alert("Error updating payment!");
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = payments.filter(
    (p) =>
      p.id.toString().includes(search) ||
      p.order_id.toString().includes(search) ||
      p.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  const statusColor = (status: string) => {
    if (status === "success") return "bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]";
    if (status === "pending") return "bg-amber-50 border border-amber-200 text-amber-800";
    return "bg-rose-50 border border-rose-200 text-rose-700";
  };

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Payment Processing & Ledger</span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">Payment Transactions</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search ID, order, transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />
            <Link href="/admin/payments/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl">
              + Record Payment
            </Link>
          </div>
        </div>

        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Payments...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="payments"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {filtered
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">#{p.id}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#1C1A17]">#{p.order_id}</td>
                        <td className="px-6 py-4 font-serif capitalize text-[#1C1A17]">{p.payment_method.replace("_", " ")}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E8E2D5] font-mono text-[11px] text-[#1C1A17]">{p.transaction_id}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#1C1A17]">৳{Number(p.amount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(p.status)}`}>{p.status}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[#5A554C]">{fmtDate(p.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewPayment(p)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="View">👁</button>
                            <button onClick={() => setEditPayment(p)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="Edit">✏️</button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" title="Delete">🗑</button>
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
            <p className="text-xs text-[#5A554C]">No payment records found.</p>
          </div>
        )}

        {/* View Modal */}
        {viewPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Payment Record</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Payment #{viewPayment.id}</h3>
                </div>
                <button onClick={() => setViewPayment(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["Payment ID", `#${viewPayment.id}`],
                  ["Order ID", `#${viewPayment.order_id}`],
                  ["Method", viewPayment.payment_method.replace("_", " ")],
                  ["Transaction ID", viewPayment.transaction_id],
                  ["Amount", `৳${Number(viewPayment.amount).toFixed(2)}`],
                  ["Status", viewPayment.status],
                  ["Date", fmtDate(viewPayment.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-[#5A554C]">{label}</span>
                    <span className="font-semibold text-[#1C1A17] text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewPayment(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Payment</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Payment #{editPayment.id}</h3>
                </div>
                <button onClick={() => setEditPayment(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Payment Status</label>
                  <select value={editPayment.status} onChange={(e) => setEditPayment({ ...editPayment, status: e.target.value as Payment["status"] })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]">
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Payment Method</label>
                  <input type="text" value={editPayment.payment_method} onChange={(e) => setEditPayment({ ...editPayment, payment_method: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditPayment(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
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