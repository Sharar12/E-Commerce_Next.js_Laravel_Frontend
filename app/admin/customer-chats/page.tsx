"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import { apiUrl, getImageUrl } from "@/app/common/http";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  CornerDownRight,
  Send,
  X,
  Sparkles,
  Package,
  User,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
}

interface ProductInfo {
  id: number;
  name: string;
  sku: string;
  base_price: number;
  images?: ProductImage[];
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
}

interface CustomerChat {
  id: number;
  product_id: number;
  user_id?: number;
  customer_name?: string;
  customer_email?: string;
  question: string;
  reply?: string;
  replied_by?: number;
  replied_at?: string;
  status: "pending" | "replied";
  created_at: string;
  product?: ProductInfo;
  user?: UserInfo;
  replier?: UserInfo;
}

export default function AdminCustomerChatsPage() {
  const [chats, setChats] = useState<CustomerChat[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal State for replying
  const [selectedChat, setSelectedChat] = useState<CustomerChat | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch chats
  const fetchChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      let url = `${apiUrl}/admin/customer-chats?`;
      if (statusFilter !== "all") url += `status=${statusFilter}&`;
      if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.data) {
        setChats(data.data);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load customer chats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChats();
  };

  // Open Reply Modal
  const openReplyModal = (chat: CustomerChat) => {
    setSelectedChat(chat);
    setReplyText(chat.reply || "");
    setNotification(null);
  };

  // Submit Admin Reply
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !replyText.trim()) return;

    setReplying(true);
    setNotification(null);

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${apiUrl}/admin/customer-chats/${selectedChat.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      const data = await res.json();
      setReplying(false);

      if (res.ok && data.status === 200) {
        setNotification({ type: "success", message: "Reply sent successfully!" });
        setTimeout(() => {
          setSelectedChat(null);
          setReplyText("");
          fetchChats();
        }, 1200);
      } else {
        setNotification({ type: "error", message: data.message || "Failed to send reply." });
      }
    } catch (err) {
      setReplying(false);
      setNotification({ type: "error", message: "Network error transmitting reply." });
    }
  };

  // Delete Customer Chat
  const handleDeleteChat = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer chat inquiry?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${apiUrl}/admin/customer-chats/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        fetchChats();
      } else {
        alert(data.message || "Failed to delete chat.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-[#1C1A17] font-sans antialiased pb-16">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1A17]/5 border border-[#E8E2D5] mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#8C6D2B]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">
                Concierge Desk
              </span>
            </div>
            <h1 className="text-3xl font-serif text-[#1C1A17]">Customer Chats</h1>
            <p className="text-xs text-[#5A554C] font-light mt-0.5">
              Review and respond to live customer inquiries asked on product detail pages.
            </p>
          </div>

          <button
            onClick={fetchChats}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E2D5] hover:border-[#C5A059] text-xs font-bold uppercase tracking-wider text-[#1C1A17] rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#8C6D2B] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Total Chats */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block mb-1">
                Total Inquiries
              </span>
              <span className="text-3xl font-serif font-bold text-[#1C1A17]">
                {stats.total}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#1C1A17]" />
            </div>
          </div>

          {/* Pending Responses */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-amber-200/80 p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 block mb-1">
                Pending Responses
              </span>
              <span className="text-3xl font-serif font-bold text-amber-900">
                {stats.pending}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
          </div>

          {/* Replied Responses */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-200/80 p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 block mb-1">
                Replied Inquiries
              </span>
              <span className="text-3xl font-serif font-bold text-emerald-900">
                {stats.replied}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-5 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl self-start">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === "all"
                  ? "bg-[#1C1A17] text-white shadow-sm"
                  : "text-[#5A554C] hover:text-[#1C1A17]"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                statusFilter === "pending"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-[#5A554C] hover:text-[#1C1A17]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter("replied")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                statusFilter === "replied"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-[#5A554C] hover:text-[#1C1A17]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Replied ({stats.replied})
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, SKU, customer or question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#1C1A17] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#C5A059] transition-colors"
            >
              Search
            </button>
          </form>

        </div>

        {/* Customer Chats Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B]">
                Loading Customer Chats...
              </p>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-16 text-center">
              <MessageSquare className="w-10 h-10 text-[#C5A059] mx-auto mb-3" />
              <h3 className="text-lg font-serif text-[#1C1A17] mb-1">No Customer Chats Found</h3>
              <p className="text-xs text-[#5A554C]">
                {statusFilter !== "all"
                  ? `No customer chats currently under status "${statusFilter}".`
                  : "No product chat inquiries have been submitted yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E8E2D5] text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">
                    <th className="py-4 px-6">Product Infos</th>
                    <th className="py-4 px-6">Customer Details</th>
                    <th className="py-4 px-6">Question / Message</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5] text-xs">
                  {chats.map((chat) => (
                    <tr key={chat.id} className="hover:bg-[#FFFDF9] transition-colors">
                      
                      {/* Product Infos Column */}
                      <td className="py-4 px-6 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl overflow-hidden flex-shrink-0 relative">
                            {chat.product?.images && chat.product.images.length > 0 ? (
                              <img
                                src={getImageUrl(chat.product.images[0].image_url)}
                                alt={chat.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#FAF8F5]">
                                <Package className="w-5 h-5 text-[#8C6D2B]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${chat.product_id}`}
                              target="_blank"
                              className="font-serif font-semibold text-[#1C1A17] hover:text-[#C5A059] flex items-center gap-1 leading-snug line-clamp-1"
                            >
                              <span>{chat.product?.name || `Product #${chat.product_id}`}</span>
                              <ExternalLink className="w-3 h-3 text-[#8C6D2B] shrink-0" />
                            </Link>
                            <span className="font-mono text-[10px] text-[#8C6D2B] font-medium block mt-0.5">
                              SKU: {chat.product?.sku || "N/A"}
                            </span>
                            <span className="font-mono text-[10px] text-[#5A554C] block font-bold">
                              ৳{Number(chat.product?.base_price || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Details Column */}
                      <td className="py-4 px-6 min-w-[180px]">
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-[#1C1A17]">
                            <User className="w-3.5 h-3.5 text-[#8C6D2B]" />
                            <span>{chat.customer_name || chat.user?.name || "Guest Customer"}</span>
                          </div>
                          <span className="font-mono text-[10px] text-[#5A554C] block mt-0.5">
                            {chat.customer_email || chat.user?.email || "No email provided"}
                          </span>
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {chat.user_id ? "Registered Patron" : "Guest User"}
                          </span>
                        </div>
                      </td>

                      {/* Question / Message Column */}
                      <td className="py-4 px-6 min-w-[260px] max-w-md">
                        <div className="space-y-1.5">
                          <p className="text-[#1C1A17] font-medium leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D5]">
                            "{chat.question}"
                          </p>
                          <span className="text-[10px] text-[#5A554C] block">
                            Asked: {new Date(chat.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {/* Admin Reply Preview */}
                          {chat.reply && (
                            <div className="pl-3 border-l-2 border-[#C5A059] pt-1">
                              <span className="text-[10px] font-bold text-[#8C6D2B] uppercase tracking-wider block">
                                Admin Reply ({chat.replier?.name || "Atelier Admin"}):
                              </span>
                              <p className="text-[11px] text-[#5A554C] line-clamp-2 italic">
                                "{chat.reply}"
                              </p>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {chat.status === "replied" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Replied</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openReplyModal(chat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                              chat.status === "pending"
                                ? "bg-[#1C1A17] hover:bg-[#C5A059] text-white shadow-md"
                                : "bg-white border border-[#E8E2D5] hover:border-[#C5A059] text-[#1C1A17]"
                            }`}
                          >
                            <Send className="w-3 h-3 text-[#D4AF37]" />
                            <span>{chat.status === "pending" ? "Reply" : "Edit Reply"}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteChat(chat.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reply Drawer / Modal */}
        {selectedChat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#D4AF37]/40 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden animate-fadeIn">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-0.5">
                    Concierge Dispatch
                  </span>
                  <h3 className="text-xl font-serif text-[#1C1A17]">Reply to Customer Inquiry</h3>
                </div>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-[#1C1A17] hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product & Customer Summary */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D5] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-white border border-[#E8E2D5] rounded-lg overflow-hidden shrink-0">
                    {selectedChat.product?.images && selectedChat.product.images.length > 0 ? (
                      <img
                        src={getImageUrl(selectedChat.product.images[0].image_url)}
                        alt={selectedChat.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-full h-full p-2 text-[#8C6D2B]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-xs text-[#1C1A17] line-clamp-1">
                      {selectedChat.product?.name}
                    </h4>
                    <span className="font-mono text-[10px] text-[#8C6D2B]">
                      SKU: {selectedChat.product?.sku}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E8E2D5]/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-1">
                    Customer Inquiry ({selectedChat.customer_name || selectedChat.user?.name || "Customer"}):
                  </div>
                  <p className="text-xs text-[#1C1A17] italic bg-white p-3 rounded-xl border border-[#E8E2D5]">
                    "{selectedChat.question}"
                  </p>
                </div>
              </div>

              {/* Response Quick Presets */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-2">
                  Quick Response Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyText("Hello! This product is currently in stock and ready for immediate complimentary white-glove dispatch.")}
                    className="text-[10px] bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#C5A059] px-2.5 py-1.5 rounded-lg text-[#1C1A17] transition-all"
                  >
                    + Stock & Shipping
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText("Hello! We craft our pieces with authentic artisan materials. Detailed sizing and dimensions can be provided upon request.")}
                    className="text-[10px] bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#C5A059] px-2.5 py-1.5 rounded-lg text-[#1C1A17] transition-all"
                  >
                    + Materials & Dimensions
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText("Thank you for reaching out! Our atelier client advisor is looking into your custom request and will update you shortly.")}
                    className="text-[10px] bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#C5A059] px-2.5 py-1.5 rounded-lg text-[#1C1A17] transition-all"
                  >
                    + Custom Inquiry
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleReplySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1">
                    Your Official Answer / Reply <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the customer..."
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl p-3.5 focus:outline-none focus:border-[#1C1A17] transition-all font-medium resize-none"
                    required
                  />
                </div>

                {notification && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      notification.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {notification.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{notification.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChat(null)}
                    className="px-4 py-3 border border-[#E8E2D5] text-[#5A554C] hover:text-[#1C1A17] text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    className="px-6 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {replying ? (
                      <span>Transmitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Send Response & Mark Replied</span>
                      </>
                    )}
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
