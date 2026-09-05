"use client";

import { useEffect, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";

interface Transaction {
  id: number;
  user_id: number;
  user?: { id: number; name?: string; email?: string };
  order_id: number;
  order?: { id: number; order_code?: string; final_amount?: number | string; status?: string };
  transaction_type?: string;
  type?: string;
  method: string;
  transaction_reference?: string;
  reference?: string;
  amount: number | string;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded" | string;
  remarks?: string;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");

  const [viewTxn, setViewTxn] = useState<Transaction | null>(null);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchTransactions = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/transactions`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result.data)) {
        setTransactions(result.data);
      } else if (Array.isArray(result)) {
        setTransactions(result);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await fetch(`${apiUrl}/transactions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken()}` } });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert("❌ Error deleting transaction: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Error deleting transaction!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTxn) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/transactions/${editTxn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ status: editTxn.status, remarks: editTxn.remarks }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setTransactions((prev) => prev.map((t) => (t.id === editTxn.id ? { ...t, ...(result.data || editTxn) } : t)));
        setEditTxn(null);
      } else {
        alert("❌ Error updating transaction: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating transaction:", error);
      alert("Error updating transaction!");
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = transactions.filter(
    (t) =>
      t.id.toString().includes(search) ||
      (t.reference && t.reference.toLowerCase().includes(search.toLowerCase())) ||
      t.status.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedTransactions = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Financial Ledger</span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">Transaction Records</h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search reference, customer, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />
            <button
              onClick={fetchTransactions}
              disabled={loader}
              className="px-4 py-2.5 bg-[#1C1A17] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#8C6D2B] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loader ? "↻ Loading..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Transactions...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="transactions"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Reference</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Order</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Method</th>
                    <th className="px-5 py-4">Payment Info</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Processed At</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedTransactions.map((t) => {
                    const refCode = t.transaction_reference || t.reference || "—";
                    const txnType = t.transaction_type || t.type || "debit";
                    const userName = t.user?.name ? `${t.user.name}` : `User #${t.user_id}`;
                    const orderCode = t.order?.order_code ? t.order.order_code : `ORD-${String(t.order_id).padStart(6, "0")}`;

                    // Extract payment account details (masked card / full mobile number)
                    let paymentInfoDisplay = "—";
                    const m = (t.method || "").toLowerCase();
                    const remarks = t.remarks || "";

                    // 1. Try extracting bracketed info from remarks if present e.g. [**** **** **** 1234] or [01700000000]
                    const bracketMatch = remarks.match(/\[(.*?)\]/);
                    if (bracketMatch && bracketMatch[1]) {
                      paymentInfoDisplay = bracketMatch[1];
                    } else if (m === "card" || refCode.startsWith("CARD-")) {
                      const last4 = refCode.startsWith("CARD-") ? refCode.split("-")[1] : "8888";
                      paymentInfoDisplay = `**** **** **** ${last4}`;
                    } else if (m === "mobile_banking" || m === "bkash" || m === "nagad") {
                      const numMatch = remarks.match(/(\+?8801\d{9}|01\d{9})/);
                      paymentInfoDisplay = numMatch ? numMatch[1] : (t.user?.email || "Mobile Banking");
                    } else if (m === "cod") {
                      paymentInfoDisplay = "Cash on Delivery";
                    }

                    return (
                      <tr key={t.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-[#8C6D2B]">#{t.id}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E8E2D5] font-mono text-[11px] text-[#1C1A17] font-bold">
                            {refCode}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-serif font-bold text-[#1C1A17]">
                          {userName}
                          {t.user?.email && <span className="block font-sans text-[11px] font-normal text-[#6E685E]">{t.user.email}</span>}
                        </td>
                        <td className="px-5 py-4 font-mono text-[#1C1A17] font-bold">{orderCode}</td>
                        <td className="px-5 py-4 capitalize text-[#5A554C] font-medium">{txnType}</td>
                        <td className="px-5 py-4 capitalize text-[#5A554C]">{(t.method || "").replace("_", " ")}</td>
                        <td className="px-5 py-4 font-mono font-medium text-[#1C1A17] whitespace-nowrap">
                          {paymentInfoDisplay}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-[#1C1A17]">
                          ৳{Number(t.amount).toFixed(2)} <span className="text-[10px] text-[#6E685E]">{t.currency || "BDT"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#6E685E] text-[11px] whitespace-nowrap">
                          {fmtDate(t.processed_at || t.created_at)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setViewTxn(t)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="View Details">👁</button>
                            <button onClick={() => setEditTxn(t)} className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all" title="Edit Status">✏️</button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" title="Delete">🗑</button>
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
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No transaction records found.</p>
          </div>
        )}

        {/* View Modal */}
        {viewTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Transaction Detail</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Transaction #{viewTxn.id}</h3>
                </div>
                <button onClick={() => setViewTxn(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {(() => {
                  const refCode = viewTxn.transaction_reference || viewTxn.reference || "—";
                  const txnType = viewTxn.transaction_type || viewTxn.type || "debit";
                  const userName = viewTxn.user?.name ? `${viewTxn.user.name} (${viewTxn.user.email})` : `User #${viewTxn.user_id}`;
                  const orderCode = viewTxn.order?.order_code ? `${viewTxn.order.order_code} (#${viewTxn.order_id})` : `Order #${viewTxn.order_id}`;

                  return [
                    ["Transaction ID", `#${viewTxn.id}`],
                    ["Reference Code", refCode],
                    ["Customer Account", userName],
                    ["Associated Order", orderCode],
                    ["Transaction Type", txnType],
                    ["Payment Method", (viewTxn.method || "").replace("_", " ")],
                    ["Amount Paid", `৳${Number(viewTxn.amount).toFixed(2)} ${viewTxn.currency || 'BDT'}`],
                    ["Status", viewTxn.status],
                    ["Remarks", viewTxn.remarks || "N/A"],
                    ["Processed At", fmtDate(viewTxn.processed_at)],
                    ["Record Created", fmtDate(viewTxn.created_at)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2.5">
                      <span className="text-[#5A554C]">{label}</span>
                      <span className="font-semibold text-[#1C1A17] text-right max-w-xs capitalize">{value}</span>
                    </div>
                  ));
                })()}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewTxn(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Transaction</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Transaction #{editTxn.id}</h3>
                </div>
                <button onClick={() => setEditTxn(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Status</label>
                  <select value={editTxn.status} onChange={(e) => setEditTxn({ ...editTxn, status: e.target.value as Transaction["status"] })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]">
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Remarks</label>
                  <textarea rows={3} value={editTxn.remarks || ""} onChange={(e) => setEditTxn({ ...editTxn, remarks: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditTxn(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
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