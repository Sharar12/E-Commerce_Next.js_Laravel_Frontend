"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, adminToken } from "../common/http";
import Layout from "../components/Layouts";
import { COUNTRIES, getCountryByName } from "../common/countries";
import {
  User, ShoppingBag, Heart, Settings, LogOut,
  ChevronRight, Crown, Mail, Calendar, Lock,
  Save, AlertCircle, Eye, EyeOff,
  Clock, CheckCircle2, XCircle,
} from "lucide-react";

// ─── Types ───
interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface Order {
  id: number;
  user_id: number;
  order_code?: string;
  total_amount: number;
  discount_amount: number;
  shipping_fee: number;
  final_amount: number;
  status: string;
  created_at: string;
  items?: any[];
}

interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  product?: { id: number; name: string; base_price: number; images?: { image_url: string }[] };
}

// ─── Sidebar sections ───
type Section = "overview" | "orders" | "profile" | "wishlist";

const SECTIONS: { id: Section; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "orders", label: "Acquisition History", icon: ShoppingBag },
  { id: "profile", label: "Profile Settings", icon: Settings },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 border border-amber-200 text-amber-800",
  processing: "bg-amber-50 border border-amber-200 text-amber-800",
  paid: "bg-emerald-50 border border-emerald-200 text-emerald-800",
  shipped: "bg-blue-50 border border-blue-200 text-blue-800",
  delivered: "bg-purple-50 border border-purple-200 text-purple-800",
  cancelled: "bg-rose-50 border border-rose-200 text-rose-700",
};

export default function MyAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Orders & Wishlist data
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Check login and fetch data
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("adminToken");
    const stored = localStorage.getItem("adminUser");
    if (!token || !stored) {
      router.push("/auth/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setEditName(parsed.name || "");
      setEditEmail(parsed.email || "");

      // Load saved shipping details from profile/local storage
      const savedDetails = localStorage.getItem(`customerShipping_${parsed.id}`);
      if (savedDetails) {
        try {
          const details = JSON.parse(savedDetails);
          setPhone(details.phone || "");
          setAddress(details.address || "");
          setCity(details.city || "");
          setState(details.state || "");
          setZipCode(details.zipCode || "");
          setCountry(details.country || "Bangladesh");
        } catch (e) {}
      }

      fetchUserData(parsed.id, token);
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  const fetchUserData = async (userId: number, token: string) => {
    try {
      const [ordersRes, wishlistRes] = await Promise.all([
        fetch(`${apiUrl}/orders/user-orders?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`${apiUrl}/wishlists`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
      ]);
      const ordersData = await ordersRes.json();
      const wishlistData = await wishlistRes.json();

      let fetchedOrders: Order[] = [];
      if (ordersRes.ok && Array.isArray(ordersData.data) && ordersData.data.length > 0) {
        fetchedOrders = ordersData.data.map((o: any) => ({
          id: o.id,
          user_id: o.user_id,
          order_code: o.order_code,
          total_amount: Number(o.total_amount || 0),
          discount_amount: Number(o.discount_amount || 0),
          shipping_fee: Number(o.shipping_fee || 0),
          final_amount: Number(o.final_amount || o.total_amount || 0),
          status: o.status || "processing",
          created_at: o.created_at || new Date().toISOString(),
          items: o.items || [],
        }));
      }

      const userWishlist = (wishlistData.data || []).filter((w: WishlistItem) => w.user_id === userId);

      setOrders(fetchedOrders);
      setWishlist(userWishlist);
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body: any = { name: editName, email: editEmail };
      if (editPassword) body.password = editPassword;

      const res = await fetch(`${apiUrl}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...user, name: editName, email: editEmail };
        setUser(updated);
        localStorage.setItem("adminUser", JSON.stringify(updated));

        // Save shipping details for auto-fill in checkout
        const shippingData = { phone, address, city, state, zipCode, country };
        localStorage.setItem(`customerShipping_${user.id}`, JSON.stringify(shippingData));

        setEditPassword("");
        setSaveMsg("✅ Profile & Shipping details updated successfully!");
      } else {
        setSaveMsg("❌ " + (data.message || "Update failed"));
      }
    } catch {
      setSaveMsg("❌ Failed to connect to server");
    } finally {
      setSaving(false);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/");
  };

  // Format helpers
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const fmtAmt = (v: number) => `৳${Math.round(v).toLocaleString()}`;

  // Sidebar Component
  const Sidebar = () => (
    <aside className="lg:w-72 flex-shrink-0">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm overflow-hidden lg:sticky lg:top-28">
        {/* Profile Card */}
        <div className="p-6 text-center border-b border-[#E8E2D5] bg-gradient-to-b from-[#FAF8F5] to-transparent">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1C1A17] flex items-center justify-center text-[#D4AF37] text-xl font-bold font-mono shadow-md mb-3">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h2 className="text-lg font-serif font-bold text-[#1C1A17]">{user?.name || "Loading..."}</h2>
          <p className="text-xs text-[#5A554C] mt-0.5">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#C5A059]/30 text-[9px] font-bold uppercase tracking-wider text-[#8C6D2B]">
            {user?.role === "admin" ? "Executive" : "Patron"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-left ${
                  isActive
                    ? "bg-[#1C1A17] text-[#D4AF37] shadow-sm"
                    : "text-[#5A554C] hover:text-[#1C1A17] hover:bg-[#FAF8F5]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#D4AF37]" : "text-[#8C6D2B]"}`} />
                <span className="font-semibold">{sec.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#D4AF37]" />}
              </button>
            );
          })}

          <div className="border-t border-[#E8E2D5] my-2" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </aside>
  );

  // ─── RENDER SECTION CONTENT ───
  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Dashboard</span>
              <h2 className="text-2xl font-serif text-[#1C1A17]">Welcome back, {user?.name?.split(" ")[0] || "Valued Patron"}</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/80 rounded-xl p-5 border border-[#E8E2D5] shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C6D2B]">Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                </div>
                <p className="text-2xl font-mono font-bold text-[#1C1A17]">{orders.length}</p>
                <p className="text-[10px] text-[#5A554C]">Lifetime reservations</p>
              </div>
              <div className="bg-white/80 rounded-xl p-5 border border-[#E8E2D5] shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C6D2B]">Wishlist</span>
                  <Heart className="w-4 h-4 text-[#C5A059]" />
                </div>
                <p className="text-2xl font-mono font-bold text-[#1C1A17]">{wishlist.length}</p>
                <p className="text-[10px] text-[#5A554C]">Saved curations</p>
              </div>
              <div className="bg-white/80 rounded-xl p-5 border border-[#E8E2D5] shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C6D2B]">Member Since</span>
                  <Calendar className="w-4 h-4 text-[#C5A059]" />
                </div>
                <p className="text-lg font-mono font-bold text-[#1C1A17]">{fmtDate(user?.created_at)}</p>
                <p className="text-[10px] text-[#5A554C]">Patronage start date</p>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white/80 rounded-xl border border-[#E8E2D5] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-serif font-bold text-[#1C1A17]">Recent Reservations</h3>
                <button onClick={() => setActiveSection("orders")} className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] transition-colors flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="text-xs text-[#5A554C] py-6 text-center">No orders yet. Start exploring our collection!</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((o, idx) => (
                    <div key={`recent-ord-${o.id}-${idx}`} className="flex items-center justify-between py-2.5 border-b border-[#E8E2D5] last:border-0">
                      <div>
                        <p className="text-xs font-mono font-bold text-[#8C6D2B]">#{o.order_code ? `MAISON-${o.order_code}` : `ACQ-${o.id}`}</p>
                        <p className="text-[10px] text-[#5A554C]">{fmtDate(o.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-[#1C1A17]">{fmtAmt(o.final_amount)}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider mt-0.5 ${STATUS_BADGE[o.status] || ""}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Acquisitions</span>
              <h2 className="text-2xl font-serif text-[#1C1A17]">My Order History</h2>
            </div>

            {loading ? (
              <div className="text-center py-12 bg-white/80 rounded-xl border border-[#E8E2D5]">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-xl border border-[#E8E2D5]">
                <ShoppingBag className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
                <p className="text-sm font-serif text-[#1C1A17] mb-1">No orders yet</p>
                <p className="text-xs text-[#5A554C]">Browse our collection and place your first order.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-xl border border-[#E8E2D5] shadow-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                      <th className="px-5 py-3">Order Ref</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {orders.map((o, idx) => (
                      <tr key={`ord-${o.id}-${idx}`} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#8C6D2B]">
                          #{o.order_code ? `MAISON-${o.order_code}` : `ACQ-${o.id}`}
                        </td>
                        <td className="px-5 py-3.5 text-[#5A554C]">{fmtDate(o.created_at)}</td>
                        <td className="px-5 py-3.5 font-mono font-bold text-[#1C1A17] text-right">{fmtAmt(o.final_amount)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${STATUS_BADGE[o.status] || ""}`}>
                            {o.status === "paid" ? <CheckCircle2 className="w-2.5 h-2.5" /> : o.status === "cancelled" ? <XCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-3 py-1.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl max-w-lg w-full overflow-hidden">
                  <div className="bg-[#FAF8F5] p-5 border-b border-[#E8E2D5] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B] block">Acquisition Reference</span>
                      <h3 className="font-mono font-bold text-base text-[#1C1A17]">
                        #{selectedOrder.order_code ? `MAISON-${selectedOrder.order_code}` : `ACQ-${selectedOrder.id}`}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="w-8 h-8 rounded-full bg-white border border-[#E8E2D5] flex items-center justify-center text-[#1C1A17] hover:bg-[#1C1A17] hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E8E2D5] text-xs">
                      <div>
                        <span className="text-[10px] text-[#7A7468] uppercase font-bold tracking-widest block">Date Placed</span>
                        <span className="font-semibold text-[#1C1A17]">{fmtDate(selectedOrder.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7A7468] uppercase font-bold tracking-widest block">Status</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-0.5 ${STATUS_BADGE[selectedOrder.status] || ""}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B] mb-3">Order Items</h4>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <div className="space-y-3">
                          {selectedOrder.items.map((item: any, idx: number) => {
                            const prod = item.product || {};
                            const productId = item.product_id || prod.id;
                            const itemName = item.name || prod.name || "Masterwork Item";
                            let img = item.image || (prod.images && prod.images.length > 0 ? prod.images[0].image_url : "/women_fashon.jpg");
                            if (img && !img.startsWith("http")) {
                              img = `http://127.0.0.1:8000${img.startsWith("/") ? "" : "/"}${img}`;
                            }
                            const priceVal = item.price || item.price_at_purchase || prod.base_price || 0;

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (productId) {
                                    setSelectedOrder(null);
                                    router.push(`/products/${productId}`);
                                  }
                                }}
                                className={`flex items-center justify-between gap-4 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] transition-all ${
                                  productId ? "cursor-pointer hover:border-[#C5A059] hover:bg-white group" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <img src={img} alt={itemName} className="w-12 h-14 object-cover rounded-lg border border-[#E8E2D5] group-hover:scale-105 transition-transform duration-300" />
                                  <div>
                                    <p className="text-xs font-serif font-bold text-[#1C1A17] group-hover:text-[#C5A059] transition-colors">{itemName}</p>
                                    <p className="text-[10px] text-[#7A7468]">Qty: {item.quantity || 1}</p>
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-xs text-[#1C1A17]">{fmtAmt(priceVal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-[#7A7468]">Masterwork Acquisition Item Details Recorded.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 bg-[#FAF8F5] border-t border-[#E8E2D5] space-y-2">
                    {(() => {
                      const subtotal = (selectedOrder.items || []).reduce(
                        (acc: number, item: any) => acc + (item.price || item.price_at_purchase || 0) * (item.quantity || 1),
                        0
                      );
                      const fee = selectedOrder.shipping_fee || (selectedOrder.final_amount - subtotal > 0 ? selectedOrder.final_amount - subtotal : 0);
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs text-[#7A7468]">
                            <span>Items Subtotal:</span>
                            <span className="font-mono font-bold text-[#1C1A17]">{fmtAmt(subtotal)}</span>
                          </div>
                          {fee > 0 && (
                            <div className="flex items-center justify-between text-xs text-[#7A7468]">
                              <span>Shipping & Protocol Fee:</span>
                              <span className="font-mono font-bold text-[#8C6D2B]">+{fmtAmt(fee)}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Total Valuation</span>
                            <span className="font-serif font-bold text-lg text-[#1C1A17]">{fmtAmt(selectedOrder.final_amount)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Account</span>
              <h2 className="text-2xl font-serif text-[#1C1A17]">Profile Settings</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="bg-white/80 rounded-xl border border-[#E8E2D5] shadow-sm p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email (Non-editable) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17]">
                    Email Address
                  </label>
                  <span className="text-[10px] text-[#8C6D2B] font-semibold flex items-center gap-1 bg-[#1C1A17]/5 px-2 py-0.5 rounded border border-[#E8E2D5]">
                    <Lock className="w-2.5 h-2.5" /> Non-editable
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                  <input
                    type="email"
                    value={editEmail}
                    readOnly
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-[#EFECE6]/70 border border-[#E8E2D5] text-[#5A554C] text-sm rounded-xl cursor-not-allowed font-mono opacity-80"
                  />
                </div>
                <p className="text-[10px] text-[#7A7468] mt-1.5 font-light">
                  Email address is permanently linked to your account identity and cannot be altered.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                  New Password <span className="text-[#5A554C] font-normal normal-case tracking-normal">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B] w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C6D2B]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Shipping Address Auto-fill Settings */}
              <div className="pt-6 border-t border-[#E8E2D5] space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block mb-1">
                    Checkout Preferences
                  </span>
                  <h3 className="text-base font-serif font-semibold text-[#1C1A17]">
                    Default Shipping & Contact Details
                  </h3>
                  <p className="text-xs text-[#6E685E] font-light mt-0.5">
                    Saved details will automatically populate your checkout forms for seamless order placement.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm font-medium cursor-pointer"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      Phone Number (Digits Only)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#8C6D2B] text-xs font-mono font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-sm">
                        <span>{getCountryByName(country).flag}</span>
                        <span>{getCountryByName(country).code}</span>
                        <span>({getCountryByName(country).dialCode})</span>
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          const onlyNums = e.target.value.replace(/\D/g, "");
                          setPhone(onlyNums);
                        }}
                        placeholder={getCountryByName(country).phoneFormat}
                        className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm font-mono rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                    Street Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House 42, Road 11, Block D, Banani"
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Dhaka"
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      State / Division
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Dhaka Division"
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="1213"
                      className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Save Msg */}
              {saveMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  saveMsg.includes("✅") ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-[#FFF9EE] border border-[#C5A059]/40 text-[#8C6D2B]"
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{saveMsg}</span>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-md rounded-xl disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        );

      case "wishlist":
        return (
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">Saved Curations</span>
              <h2 className="text-2xl font-serif text-[#1C1A17]">My Wishlist</h2>
            </div>

            {loading ? (
              <div className="text-center py-12 bg-white/80 rounded-xl border border-[#E8E2D5]">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading wishlist...</p>
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-xl border border-[#E8E2D5]">
                <Heart className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
                <p className="text-sm font-serif text-[#1C1A17] mb-1">Your wishlist is empty</p>
                <p className="text-xs text-[#5A554C]">Save items you love to revisit later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map((w) => {
                  const prod = w.product;
                  const firstImg = prod?.images && prod.images.length > 0 ? prod.images[0].image_url : null;
                  let img = "/women_fashon.jpg";
                  if (firstImg) {
                    if (firstImg.startsWith("http")) {
                      img = firstImg;
                    } else {
                      img = `http://127.0.0.1:8000${firstImg.startsWith("/") ? "" : "/"}${firstImg}`;
                    }
                  }

                  const handleRemoveWishlist = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const token = localStorage.getItem("adminToken");
                    if (!token) return;
                    try {
                      const res = await fetch(`${apiUrl}/wishlists/${w.id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                      });
                      if (res.ok) {
                        setWishlist((prev) => prev.filter((item) => item.id !== w.id));
                      }
                    } catch (err) {
                      console.error("Error deleting wishlist item:", err);
                    }
                  };

                  return (
                    <div
                      key={w.id}
                      onClick={() => router.push(`/products/${w.product_id}`)}
                      className="bg-white/80 rounded-xl border border-[#E8E2D5] shadow-sm p-4 flex items-center justify-between hover:border-[#C5A059] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-16 bg-[#EFECE6] rounded-lg border border-[#E8E2D5] overflow-hidden flex-shrink-0">
                          <img src={img} alt={prod?.name || "Product"} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-serif font-semibold text-[#1C1A17] truncate group-hover:text-[#C5A059] transition-colors">
                            {prod?.name || `Product #${w.product_id}`}
                          </p>
                          <p className="text-xs font-mono font-bold text-[#8C6D2B] mt-1">
                            {prod?.base_price ? fmtAmt(prod.base_price) : "—"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveWishlist}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors flex-shrink-0 ml-2"
                        title="Remove from Wishlist"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 selection:bg-[#C5A059] selection:text-white">
        {/* Page Header */}
        <div className="flex items-center gap-2 mb-8">
          <Crown className="w-5 h-5 text-[#8C6D2B]" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8C6D2B]">Patron Suite</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
