"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import Link from "next/link";

type NotificationType = "order" | "payment" | "shipping" | "system" | "other" | string;

export interface Notification {
  id: number;
  user_id: number;
  user?: {
    id: number;
    user_code?: string;
    name: string;
    email: string;
  };
  title?: string;
  message: string;
  type?: NotificationType;
  is_read?: boolean | number;
  status?: "unread" | "read";
  read_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiListResponse<T> {
  status: number;
  data: T[];
  message?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [viewNotification, setViewNotification] = useState<Notification | null>(null);
  const [editNotification, setEditNotification] = useState<Notification | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNotification) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/notifications/${editNotification.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ title: editNotification.title, message: editNotification.message, type: editNotification.type }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setNotifications((prev) => prev.map((n) => (n.id === editNotification.id ? { ...n, ...(result.data || editNotification) } : n)));
        setEditNotification(null);
      } else {
        alert("❌ Error updating notification: " + (result.message || "Failed to update"));
      }
    } catch (err) {
      setSaving(false);
      alert("Error updating notification!");
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoader(true);
      setError(null);

      const res = await fetch(`${apiUrl}/notifications`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        cache: "no-store",
      });

      const result: ApiListResponse<Notification> = await res.json();
      setLoader(false);

      if (Array.isArray(result?.data)) {
        setNotifications(result.data);
      } else if (Array.isArray(result)) {
        setNotifications(result);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      setLoader(false);
      setError("Failed to load notifications.");
      console.error("Error fetching notifications:", e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification broadcast?")) return;

    try {
      const res = await fetch(`${apiUrl}/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken()}`,
        },
      });

      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        alert("❌ Error deleting notification: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Error deleting notification!");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const asBool = (n: Notification) => {
    if (n.status === "read") return true;
    if (typeof n.is_read === "boolean") return n.is_read;
    return Number(n.is_read) === 1;
  };

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => {
      const idMatch = n.id.toString().includes(q);
      const userMatch = n.user_id.toString().includes(q);
      const titleMatch = (n.title ?? "").toLowerCase().includes(q);
      const msgMatch = (n.message ?? "").toLowerCase().includes(q);
      const typeMatch = (n.type ?? "").toLowerCase().includes(q);
      return idMatch || userMatch || titleMatch || msgMatch || typeMatch;
    });
  }, [search, notifications]);

  const paginatedNotifications = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Patron Dispatch & Announcements
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">
              Notifications Audit
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search title, message, user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
              />
            </div>
            <Link
              href="/admin/notifications/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl"
            >
              <span>+ Add Notification</span>
            </Link>
          </div>
        </div>

        {/* States */}
        {loader && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Notifications...</p>
          </div>
        )}

        {!loader && error && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-rose-200">
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        {!loader && !error && filtered.length === 0 && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No notifications found in dispatch registry.</p>
          </div>
        )}

        {!loader && !error && filtered.length > 0 && (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="notifications"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Message Summary</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Read Status</th>
                    <th className="px-6 py-4">Read Date</th>
                    <th className="px-6 py-4">Sent Date</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedNotifications.map((n) => {
                    const read = asBool(n);
                    const userName = n.user?.name || `User #${n.user_id}`;
                    const userCode = n.user?.user_code || String(10000000 + (n.user_id * 148927) % 90000000);

                    return (
                      <tr key={n.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">#{n.id}</td>
                        <td className="px-6 py-4">
                          <span className="font-serif font-bold text-[#1C1A17] block">{userName}</span>
                          {n.user?.email && <span className="font-mono text-[11px] text-[#6E685E] block">{n.user.email}</span>}
                          <span className="font-mono text-[10px] font-bold text-[#8C6D2B] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D5] inline-block mt-0.5">
                            {userCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#5A554C] max-w-sm">
                          <div className="font-semibold text-[#1C1A17]">{n.title}</div>
                          <div className="truncate">{n.message}</div>
                        </td>
                        <td className="px-6 py-4 font-serif capitalize text-[#8C6D2B] font-semibold">
                          {n.type ?? "system"}
                        </td>
                        <td className="px-6 py-4">
                          {read ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]">
                              Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-800">
                              Unread
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-[#5A554C]">{fmtDate(n.read_at)}</td>
                        <td className="px-6 py-4 font-mono text-[#5A554C]">{fmtDate(n.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewNotification(n)}
                              className="p-1.5 rounded-lg border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                              title="View Notification"
                            >
                              👁
                            </button>
                            <button
                              onClick={() => setEditNotification(n)}
                              className="p-1.5 rounded-lg border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                              title="Edit Notification"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(n.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all"
                              title="Delete Notification"
                            >
                              🗑
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
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}

        {/* View Modal */}
        {viewNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Notification Detail</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">{viewNotification.title || `Notification #${viewNotification.id}`}</h3>
                </div>
                <button onClick={() => setViewNotification(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <div className="text-xs divide-y divide-[#E8E2D5]">
                {[
                  ["ID", `#${viewNotification.id}`],
                  ["Recipient Account", viewNotification.user?.name ? `${viewNotification.user.name} (${viewNotification.user.email})` : `User #${viewNotification.user_id}`],
                  ["Recipient Code", viewNotification.user?.user_code || String(10000000 + (viewNotification.user_id * 148927) % 90000000)],
                  ["Title", viewNotification.title || "—"],
                  ["Type", viewNotification.type || "system"],
                  ["Status", asBool(viewNotification) ? "Read" : "Unread"],
                  ["Read At", fmtDate(viewNotification.read_at)],
                  ["Sent At", fmtDate(viewNotification.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-[#5A554C]">{label}</span>
                    <span className="font-semibold text-[#1C1A17] text-right font-mono">{value}</span>
                  </div>
                ))}
                <div className="py-2.5">
                  <span className="block text-[#5A554C] mb-1">Message</span>
                  <p className="text-[#1C1A17] font-medium leading-relaxed">{viewNotification.message}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setViewNotification(null)} className="px-5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">Edit Notification</span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Notification #{editNotification.id}</h3>
                </div>
                <button onClick={() => setEditNotification(null)} className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Title</label>
                  <input type="text" value={editNotification.title || ""} onChange={(e) => setEditNotification({ ...editNotification, title: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Type</label>
                  <select value={editNotification.type || "system"} onChange={(e) => setEditNotification({ ...editNotification, type: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]">
                    <option value="order">Order</option>
                    <option value="payment">Payment</option>
                    <option value="shipping">Shipping</option>
                    <option value="system">System</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8C6D2B] font-bold uppercase tracking-wider mb-1 text-[10px]">Message</label>
                  <textarea rows={4} required value={editNotification.message} onChange={(e) => setEditNotification({ ...editNotification, message: e.target.value })} className="w-full p-3 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                  <button type="button" onClick={() => setEditNotification(null)} className="px-4 py-2 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all">Cancel</button>
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
