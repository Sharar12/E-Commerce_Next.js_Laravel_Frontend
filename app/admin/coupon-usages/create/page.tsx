"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ticket,
  Sparkles,
  User as UserIcon,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  Search,
} from "lucide-react";
import AdminLayout from "../../AdminLayout";
import { apiUrl, adminToken, safeParseJson } from "../../../common/http";

interface Coupon {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Order {
  id: number;
  total_amount?: number;
  grand_total?: number;
  status?: string;
  user_id?: number;
}

export default function CreateCouponUsagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [usedAt, setUsedAt] = useState<string>("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch real Coupons, Users, and Orders from DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const headers = { Authorization: `Bearer ${adminToken()}` };

        const [couponRes, userRes, orderRes] = await Promise.all([
          fetch(`${apiUrl}/coupons`, { headers }),
          fetch(`${apiUrl}/users`, { headers }),
          fetch(`${apiUrl}/orders`, { headers }),
        ]);

        if (couponRes.ok) {
          const cData = await safeParseJson(couponRes);
          setCoupons(cData.data || cData || []);
        }
        if (userRes.ok) {
          const uData = await safeParseJson(userRes);
          setUsers(uData.data || uData || []);
        }
        if (orderRes.ok) {
          const oData = await safeParseJson(orderRes);
          setOrders(oData.data || oData || []);
        }
      } catch (err) {
        console.error("Error fetching dependencies for coupon usage creation:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedCouponId || !selectedUserId || !selectedOrderId) {
      setNotification({ type: "error", message: "Please select a Coupon Code, Customer, and Order ID." });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const formattedUsedAt = usedAt
        ? new Date(usedAt).toISOString().slice(0, 19).replace("T", " ")
        : new Date().toISOString().slice(0, 19).replace("T", " ");

      const payload = {
        coupon_id: Number(selectedCouponId),
        user_id: Number(selectedUserId),
        order_id: Number(selectedOrderId),
        used_at: formattedUsedAt,
      };

      const res = await fetch(`${apiUrl}/coupon-usages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        const msg = (data && (data.message || JSON.stringify(data.errors))) || "Failed to record coupon usage.";
        setNotification({ type: "error", message: typeof msg === "string" ? msg : "Failed to record coupon usage." });
        return;
      }

      setNotification({ type: "success", message: "Coupon usage record logged successfully!" });

      setTimeout(() => {
        router.push("/admin/coupon-usages");
      }, 1500);
    } catch (err) {
      console.error("Error logging coupon usage:", err);
      setNotification({ type: "error", message: "Unexpected error creating coupon usage record." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/coupon-usages"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Coupon Usages
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Log Coupon Usage Record
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Select verified database coupons, registered customers, and order references to register a redemption log.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <Ticket className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Redemption Logger</span>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-3 transition-all shadow-sm ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-xl p-6 sm:p-8">
          {loadingData ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
                Loading Database Credentials...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Select Real Coupon */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-[#8C6D2B]" /> Coupon Code <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCouponId}
                  onChange={(e) => setSelectedCouponId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  required
                >
                  <option value="">-- Select Active Database Coupon --</option>
                  {coupons.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} ({c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`}) [ID: #{c.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Real Customer */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#8C6D2B]" /> Redeemed Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    setSelectedUserId(uId);
                    // Filter orders matching selected user if any
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  required
                >
                  <option value="">-- Select Registered Customer --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) [ID: #{u.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Real Order */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#8C6D2B]" /> Associated Order <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  required
                >
                  <option value="">-- Select Order Reference --</option>
                  {orders
                    .filter((o) => !selectedUserId || Number(o.user_id) === Number(selectedUserId))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} - Total: ৳{Math.round(Number(o.grand_total || o.total_amount || 0))} [{o.status || "Completed"}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Timestamp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8C6D2B]" /> Redemption Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={usedAt}
                  onChange={(e) => setUsedAt(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1C1A17] hover:bg-[#332F2A] text-white py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Logging Usage...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Log Coupon Usage</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
