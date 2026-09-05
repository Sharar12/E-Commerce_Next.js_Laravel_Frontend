"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layouts";
import { apiUrl, localBaseUrl } from "../common/http";
import {
  Crown,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  ChevronRight,
  Package,
  Sparkles,
  Star,
} from "lucide-react";

interface OrderItem {
  id: string;
  productId?: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: "Dispatched" | "In Atelier Curation" | "Delivered" | string;
  subtotal: number;
  shippingFee: number;
  total: number;
  trackingNumber: string;
  items: OrderItem[];
  customerName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  // Review Modal state
  const [reviewModalItem, setReviewModalItem] = useState<{ productId: number | string; name: string } | null>(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openReviewModal = async (productId: number | string, name: string) => {
    setReviewModalItem({ productId, name });
    setRating(5);
    setComment("");
    setIsEditingModal(false);

    try {
      const storedUser = localStorage.getItem("adminUser");
      let userId = "";
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u && u.id) userId = u.id;
        } catch (e) {}
      }
      const res = await fetch(`${apiUrl}/reviews/check-eligibility?product_id=${productId}&user_id=${userId}`);
      const data = await res.json();
      if (data.existing_review) {
        setIsEditingModal(true);
        setRating(data.existing_review.rating);
        setComment(data.existing_review.comment || "");
      }
    } catch (err) {
      console.error("Error fetching existing review:", err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalItem) return;
    setSubmitting(true);

    try {
      const storedUser = localStorage.getItem("adminUser");
      let userId = 1;
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u && u.id) userId = u.id;
        } catch (e) {}
      }

      const reqHeaders: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const token = localStorage.getItem("adminToken");
      if (token) {
        reqHeaders["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/reviews`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          user_id: userId,
          product_id: Number(reviewModalItem.productId),
          rating: rating,
          comment: comment,
        }),
      });

      const json = await res.json();
      setSubmitting(false);

      if (res.ok) {
        alert("🎉 Thank you! Your review for " + reviewModalItem.name + " has been recorded.");
        setReviewModalItem(null);
        setComment("");
        setRating(5);
      } else {
        alert("❌ Error submitting review: " + (json.message || "Operation failed"));
      }
    } catch (err) {
      setSubmitting(false);
      console.error("Error posting review:", err);
      alert("Error posting review. Please check server connection.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchDatabaseOrders = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const storedUser = localStorage.getItem("adminUser");
        let userIdParam = "";
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            if (u && u.id) userIdParam = `?user_id=${u.id}`;
          } catch (e) {}
        }

        const headers: HeadersInit = { Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/orders/user-orders${userIdParam}`, { headers });
        const json = await res.json();

        if (res.ok && json.data && Array.isArray(json.data) && json.data.length > 0) {
          const dbOrdersList: Order[] = json.data.map((dbOrd: any) => {
            const dbItems = (dbOrd.items || []).map((it: any, idx: number) => {
              const prod = it.product || {};
              let img = prod.images && prod.images.length > 0 ? prod.images[0].image_url : "/women_fashon.jpg";
              if (img && !img.startsWith("http")) {
                img = `${localBaseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
              }
              return {
                id: `item-${it.id || idx}`,
                productId: it.product_id || prod.id || 1,
                name: prod.name || "Masterwork Item",
                price: Number(it.price_at_purchase || it.price || prod.base_price || 0),
                quantity: it.quantity || 1,
                image: img,
              };
            });

            const computedSubtotal = dbItems.reduce((acc: number, item: OrderItem) => acc + item.price * item.quantity, 0);
            const rawTotal = Number(dbOrd.final_amount || dbOrd.total_amount || 0);
            const computedFee = Number(dbOrd.shipping_fee || (rawTotal - computedSubtotal > 0 ? rawTotal - computedSubtotal : 0));

            return {
              id: dbOrd.order_code ? `MAISON-${dbOrd.order_code}` : `MAISON-2026-${dbOrd.id}`,
              date: new Date(dbOrd.created_at || Date.now()).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              status: dbOrd.status === "pending" ? "Pending Approval" : dbOrd.status,
              subtotal: computedSubtotal,
              shippingFee: computedFee,
              total: rawTotal || (computedSubtotal + computedFee),
              trackingNumber: `DHL-EXPRESS-${dbOrd.id}992014`,
              items: dbItems,
            };
          });

          setOrders(dbOrdersList);
          return;
        }
      } catch (err) {
        console.error("Error fetching database orders:", err);
      }

      setOrders([]);
    };

    fetchDatabaseOrders();
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">

        {/* ==================== 1. PATRON PORTFOLIO HEADER ==================== */}
        <header className="relative bg-gradient-to-b from-[#F7F3EC] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#E8E2D5] py-12 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/30 shadow-sm backdrop-blur-md mb-3">
              <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">
                Maison Patron Portal • Acquisition Ledger
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif text-[#111111] tracking-tight mb-2">
              Your Acquisition Portfolio
            </h1>
            <p className="text-xs sm:text-sm text-[#5A554C] font-light max-w-md mx-auto">
              Review historical reservations, white-glove dispatch status, and authenticity verification records.
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

          {orders.length === 0 ? (
            /* ==================== 2. EMPTY ORDERS STATE ==================== */
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm p-12 text-center space-y-6 max-w-md mx-auto my-12 relative overflow-hidden">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-9 h-9 text-[#8C6D2B]" />
              </div>

              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B] block mb-1">
                  No Reservations Recorded
                </span>
                <h2 className="text-2xl font-serif text-[#1C1A17]">
                  Your Portfolio is Empty
                </h2>
                <p className="text-xs text-[#5A554C] font-light leading-relaxed mt-2">
                  You have not initiated any masterwork acquisitions. Explore our curated collections to reserve your first piece.
                </p>
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md group"
              >
                <span>Explore Masterpieces</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          ) : (
            /* ==================== 3. POPULATED ORDERS LEDGER ==================== */
            <div className="space-y-8">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all duration-300 overflow-hidden"
                >
                  {/* Order Top Bar */}
                  <div className="bg-[#FAF8F5] p-6 border-b border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B] block">
                          Reservation Reference
                        </span>
                        <span className="font-mono font-bold text-sm text-[#1C1A17]">
                          #{order.id}
                        </span>
                      </div>

                      <div className="h-8 w-px bg-[#E8E2D5] hidden sm:block" />

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B] block">
                          Acquisition Date
                        </span>
                        <span className="text-xs font-semibold text-[#1C1A17]">
                          {order.date}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === "Delivered"
                            ? "bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]"
                            : "bg-[#FFF9EE] border border-[#C5A059]/40 text-[#B8860B]"
                          }`}
                      >
                        {order.status === "Delivered" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                        ) : (
                          <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
                        )}
                        <span>{order.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="p-6 divide-y divide-[#E8E2D5]">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-20 bg-[#EFECE6] rounded-xl border border-[#E8E2D5] overflow-hidden flex-shrink-0">
                            <img
                              src={
                                item.image
                                  ? item.image.startsWith("http")
                                    ? item.image
                                    : `http://127.0.0.1:8000${item.image.startsWith("/") ? "" : "/"}${item.image}`
                                  : "/women_fashon.jpg"
                              }
                              alt={item.name}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>

                          <div>
                            <h3 className="font-serif font-semibold text-sm text-[#1C1A17] mb-1">
                              {item.name}
                            </h3>
                            <p className="text-xs text-[#7A7468] font-light">
                              Quantity:{" "}
                              <span className="font-mono font-bold text-[#1C1A17]">
                                {item.quantity}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="font-mono font-bold text-sm text-[#1C1A17]">
                            ৳{Math.round(Number(item.price || 0)).toLocaleString()}
                          </span>

                          {(order.status.toLowerCase().includes("delivered") || order.status.toLowerCase().includes("completed")) && (
                            <button
                              onClick={() => openReviewModal(item.productId || 1, item.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#1C1A17] text-[#8C6D2B] hover:text-[#D4AF37] border border-[#C5A059]/40 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-xs"
                            >
                              <Star className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]" />
                              <span>Review / Edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer Toolbar */}
                  <div className="p-6 bg-white border-t border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-[#7A7468] font-light">
                        Tracking Code:{" "}
                        <span className="font-mono font-semibold text-[#8C6D2B]">
                          {order.trackingNumber}
                        </span>
                      </span>

                      <button
                        onClick={() =>
                          alert(`Tracking details for ${order.trackingNumber} dispatched to SMS/Email.`)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1C1A17] hover:text-[#C5A059] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" />
                        <span>Certificate & Tracking</span>
                      </button>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-6 text-xs text-[#7A7468]">
                        <span>Items Subtotal:</span>
                        <span className="font-mono font-bold text-[#1C1A17]">৳{Math.round(Number(order.subtotal || 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-end gap-6 text-xs text-[#7A7468]">
                        <span>Shipping Fee:</span>
                        <span className="font-mono font-bold text-[#8C6D2B]">+৳{Math.round(Number(order.shippingFee || 0)).toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-end gap-6">
                        <span className="text-[10px] text-[#7A7468] uppercase font-bold tracking-widest">
                          Total Valuation
                        </span>
                        <span className="font-serif font-bold text-2xl text-[#1C1A17]">
                          ৳{Math.round(Number(order.total || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Maison Authenticity Footer Mark */}
          <div className="mt-16 text-center pt-8 border-t border-[#E8E2D5]">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#7A7468] uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>All acquisitions certified with Maison Passkey Authenticity</span>
            </div>
          </div>

          {/* Review Modal */}
          {reviewModalItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
                <div className="flex justify-between items-start border-b border-[#E8E2D5] pb-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B]">
                      {isEditingModal ? "Edit Existing Review" : "Patron Feedback"}
                    </span>
                    <h3 className="text-xl font-serif text-[#1C1A17] line-clamp-1">{reviewModalItem.name}</h3>
                  </div>
                  <button
                    onClick={() => setReviewModalItem(null)}
                    className="text-gray-400 hover:text-[#1C1A17] text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-2">
                      Star Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1.5 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${star <= rating ? "fill-[#C5A059] text-[#C5A059]" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] mb-2">
                      Review Comment
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this delivered masterpiece..."
                      className="w-full bg-white border border-[#E8E2D5] rounded-xl p-3 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] transition-all resize-none font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D5]">
                    <button
                      type="button"
                      onClick={() => setReviewModalItem(null)}
                      className="px-5 py-2.5 border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 shadow-md"
                    >
                      {submitting ? (isEditingModal ? "Updating..." : "Submitting...") : (isEditingModal ? "Update Review" : "Submit Review")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </Layout>
  );
}