"use client";

import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Crown,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Lock,
  Tag,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { getImageUrl, apiUrl } from "../common/http";
import Layout from "../components/Layouts";

import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("adminToken");
    const storedUser = localStorage.getItem("adminUser");
    
    if (!token || !storedUser) {
      setIsAuthenticated(false);
      router.push("/auth/login?redirect=/cart");
      return;
    }

    try {
      const userObj = JSON.parse(storedUser);
      if (userObj && (userObj.id || userObj.email)) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push("/auth/login?redirect=/cart");
      }
    } catch (e) {
      setIsAuthenticated(false);
      router.push("/auth/login?redirect=/cart");
    }
  }, [router]);

  // Restore applied coupon from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("applied_cart_coupon");
    if (saved) {
      try {
        setAppliedCoupon(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Recalculate or clear applied coupon when cart total changes
  const rawSubtotal = getCartTotal();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponMessage(null);

    try {
      let currentUserId: number | null = null;
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("adminUser");
        if (storedUser) {
          try { currentUserId = JSON.parse(storedUser).id; } catch (e) {}
        }
      }

      const res = await fetch(`${apiUrl}/coupons/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: rawSubtotal,
          user_id: currentUserId,
        }),
      });

      const data = await res.json();
      setCouponLoading(false);

      if (res.ok && data.data) {
        const couponData = {
          code: data.data.code,
          discountAmount: Number(data.data.calculated_discount),
          discountType: data.data.discount_type,
          discountValue: Number(data.data.discount_value),
        };
        setAppliedCoupon(couponData);
        if (typeof window !== "undefined") {
          localStorage.setItem("applied_cart_coupon", JSON.stringify(couponData));
        }
        setCouponMessage({ type: "success", text: `Voucher "${couponData.code}" applied successfully!` });
        setCouponCode("");
      } else {
        setCouponMessage({ type: "error", text: data.message || "Invalid promo coupon code." });
      }
    } catch (err) {
      setCouponLoading(false);
      setCouponMessage({ type: "error", text: "Network error validating coupon code." });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("applied_cart_coupon");
    }
  };

  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, rawSubtotal) : 0;
  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const tax = subtotalAfterDiscount * 0.1;
  const finalTotal = subtotalAfterDiscount + tax;

  // Safe price conversion function
  const getSafePrice = (price: any): number => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? 0 : numPrice;
  };

  // Safe price formatter
  const formatPrice = (price: any): string => {
    return Math.round(getSafePrice(price)).toLocaleString();
  };

  // Render loading spinner/blank state while verifying authentication
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C1A17]" />
        </div>
      </Layout>
    );
  }

  // ==================== 1. EMPTY CART SALON VIEW ====================
  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5] py-20 px-4 font-sans antialiased selection:bg-[#C5A059] selection:text-white">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl border border-[#D4AF37]/40 shadow-xl p-8 sm:p-10 text-center space-y-6 relative overflow-hidden">
            {/* Ambient Background Light */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#D4AF37]/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-9 h-9 text-[#8C6D2B]" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B] block mb-1">
                Atelier Acquisition Bag
              </span>
              <h2 className="text-3xl font-serif text-[#1C1A17]">
                Your Bag is Empty
              </h2>
              <p className="text-xs text-[#5A554C] font-light leading-relaxed mt-2">
                Discover our curated masterwork artifacts and add your chosen selections to begin acquisition.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-3 w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
            >
              <span>Explore Masterpiece Catalog</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ==================== 2. POPULATED CART SALON VIEW ====================
  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">

        {/* Header */}
        <header className="relative bg-gradient-to-b from-[#F7F3EC] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#E8E2D5] py-12 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/30 shadow-sm backdrop-blur-md mb-3">
              <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">
                Maison Reservation Bag
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif text-[#111111] tracking-tight mb-2">
              The Acquisition Bag
            </h1>
            <p className="text-xs sm:text-sm text-[#5A554C] font-light max-w-md mx-auto">
              Review your reserved artifacts prior to white-glove order dispatch.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

            {/* CART ITEMS LIST */}
            <div className="lg:col-span-2 space-y-6">

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm overflow-hidden">
                {cartItems.map((item) => {
                  const itemPrice = getSafePrice(item.product.base_price);
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="p-6 border-b border-[#E8E2D5] last:border-b-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-[#FFFDF9] transition-colors"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-5 flex-1">
                        <div className="w-20 h-24 relative overflow-hidden bg-[#EFECE6] rounded-xl border border-[#E8E2D5] flex-shrink-0">
                          <img
                            src={
                              item.product.images && item.product.images.length > 0
                                ? getImageUrl(item.product.images[0].image_url)
                                : "/placeholder-image.jpg"
                            }
                            alt={item.product.name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>

                        <div>
                          <h3 className="font-serif font-semibold text-base text-[#1C1A17] mb-1">
                            {item.product.name}
                          </h3>
                          <p className="text-xs font-mono text-[#8C6D2B] font-medium mb-1.5">
                            ৳{formatPrice(item.product.base_price)}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Available Stock: {item.product.stock_quantity ?? (item.product as any).stock ?? "In Stock"}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-[#FAF8F5] p-1.5 rounded-xl border border-[#E8E2D5]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] flex items-center justify-center transition-all shadow-sm"
                          title="Reduce Quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <span className="w-8 text-center font-mono font-bold text-xs text-[#1C1A17]">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= Number(item.product.stock_quantity ?? (item.product as any).stock ?? 999999)}
                          className="w-7 h-7 rounded-lg bg-white border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] flex items-center justify-center transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          title={item.quantity >= Number(item.product.stock_quantity ?? (item.product as any).stock ?? 999999) ? "Max Stock Reached" : "Increase Quantity"}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Item Total Price & Remove Trigger */}
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0">
                        <span className="font-serif font-bold text-lg text-[#1C1A17]">
                          ৳{Math.round(itemTotal).toLocaleString()}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="inline-flex items-center gap-1 text-xs text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mt-1"
                          title="Remove Product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            Remove
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear Bag Trigger */}
              <div className="flex items-center justify-between">
                <button
                  onClick={clearCart}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Entire Bag</span>
                </button>

                <Link
                  href="/shop"
                  className="text-xs font-bold uppercase tracking-wider text-[#1C1A17] hover:text-[#C5A059] transition-colors"
                >
                  ← Continue Exploring
                </Link>
              </div>

            </div>

            {/* ORDER ACQUISITION SUMMARY */}
            <aside className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-6 sm:p-8 shadow-sm space-y-6">

              <div className="pb-4 border-b border-[#E8E2D5]">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
                  Valuation
                </span>
                <h2 className="text-2xl font-serif text-[#1C1A17]">
                  Acquisition Summary
                </h2>
              </div>

              {/* Promo Coupon Box */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-[#C5A059]" />
                  <span>Promo Voucher Code</span>
                </label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#C5A059]/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-xs text-[#1C1A17] block">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          -৳{Math.round(discountAmount).toLocaleString()}{" "}
                          <span className="font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded text-emerald-800 text-[9px] font-bold">
                            ({rawSubtotal > 0 ? ((discountAmount / rawSubtotal) * 100).toFixed(1).replace(".0", "") : 0}% OFF)
                          </span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Remove Coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. LUMINA-PROMO"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] font-mono text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] uppercase tracking-wider transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </form>
                )}

                {couponMessage && (
                  <p
                    className={`text-[11px] font-medium mt-1.5 flex items-center gap-1 ${
                      couponMessage.type === "success" ? "text-emerald-700 font-semibold" : "text-rose-600"
                    }`}
                  >
                    {couponMessage.type === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{couponMessage.text}</span>
                  </p>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-3 text-xs font-medium border-t border-[#E8E2D5] pt-4">
                <div className="flex justify-between text-[#5A554C]">
                  <span>Subtotal Value</span>
                  <span className="font-mono text-[#1C1A17] font-bold">
                    ৳{Math.round(rawSubtotal).toLocaleString()}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold items-center">
                    <span className="flex items-center gap-1.5">
                      <span>Promo Discount ({appliedCoupon.code})</span>
                      <span className="font-mono bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {rawSubtotal > 0 ? ((discountAmount / rawSubtotal) * 100).toFixed(1).replace(".0", "") : 0}% OFF
                      </span>
                    </span>
                    <span className="font-mono font-bold">
                      -৳{Math.round(discountAmount).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[#5A554C]">
                  <span>White-Glove Shipping</span>
                  <span className="text-[#8C6D2B] font-bold uppercase text-[10px] tracking-wider bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E2D5]">
                    Complimentary
                  </span>
                </div>

                <div className="flex justify-between text-[#5A554C]">
                  <span>Estimated Duties & Tax (10%)</span>
                  <span className="font-mono text-[#1C1A17] font-bold">
                    ৳{Math.round(tax).toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-[#E8E2D5] pt-4 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-[#1C1A17] uppercase tracking-wider text-xs">
                    Total Acquisition
                  </span>
                  <span className="font-serif font-bold text-2xl text-[#1C1A17]">
                    ৳{Math.round(finalTotal).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                className="group w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-center"
              >
                <Lock className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-white transition-colors" />
                <span>Proceed to Checkout</span>
              </Link>

              {/* Security Guarantee */}
              <div className="pt-2 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#7A7468] uppercase tracking-widest font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Encrypted 256-Bit Maison Protocol</span>
                </div>
              </div>

            </aside>

          </div>
        </main>
      </div>
    </Layout>
  );
}