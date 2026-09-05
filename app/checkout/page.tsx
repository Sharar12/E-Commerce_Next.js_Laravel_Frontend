"use client";

import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle,
  Crown,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Layout from "../components/Layouts";
import { COUNTRIES, getCountryByName } from "../common/countries";
import { apiUrl, localBaseUrl } from "../common/http";

interface CheckoutFormData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  paymentMethod: "card" | "bkash" | "nagad" | "cod";
  mobileNumber: string;
  transactionId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
}

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Bangladesh",
    paymentMethod: "card",
    mobileNumber: "",
    transactionId: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
  });

  // Fetch active checkout draft from database or restore from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("adminToken");
    const storedUser = localStorage.getItem("adminUser");
    let user: any = null;
    if (storedUser) {
      try { user = JSON.parse(storedUser); } catch (e) {}
    }

    // Generate or fetch session identifier
    let sessionId = localStorage.getItem("checkout_session_id");
    if (!sessionId) {
      sessionId = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("checkout_session_id", sessionId);
    }

    const fetchDraft = async () => {
      try {
        const headers: HeadersInit = {
          Accept: "application/json",
          "X-Session-ID": sessionId!,
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/checkout/draft`, { headers });
        const data = await res.json();

        if (res.ok && data.data) {
          const draft = data.data;
          setFormData((prev) => ({
            ...prev,
            email: draft.email || prev.email,
            phone: draft.phone || prev.phone,
            firstName: draft.first_name || prev.firstName,
            lastName: draft.last_name || prev.lastName,
            address: draft.address || prev.address,
            city: draft.city || prev.city,
            state: draft.state || prev.state,
            zipCode: draft.zip_code || prev.zipCode,
            country: draft.country || prev.country || "Bangladesh",
          }));
          return;
        }
      } catch (err) {
        console.error("Error fetching checkout draft:", err);
      }

      // Fallback to user profile / localStorage
      if (user) {
        const nameParts = (user.name || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        let savedDetails: any = {};
        const storedDetails = localStorage.getItem(`customerShipping_${user.id}`);
        if (storedDetails) {
          try { savedDetails = JSON.parse(storedDetails); } catch (e) {}
        }

        setFormData((prev) => ({
          ...prev,
          email: user.email || prev.email,
          phone: savedDetails.phone || prev.phone,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          address: savedDetails.address || prev.address,
          city: savedDetails.city || prev.city,
          state: savedDetails.state || prev.state,
          zipCode: savedDetails.zipCode || prev.zipCode,
          country: savedDetails.country || prev.country || "Bangladesh",
          nameOnCard: user.name || prev.nameOnCard,
        }));
      }
    };

    fetchDraft();
  }, []);

  // Save checkout draft to database as user types or items change
  const saveCheckoutDraft = async (updatedFormData: CheckoutFormData) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("adminToken");
    const sessionId = localStorage.getItem("checkout_session_id") || "";

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Session-ID": sessionId,
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch(`${apiUrl}/checkout/draft`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          email: updatedFormData.email,
          phone: updatedFormData.phone,
          firstName: updatedFormData.firstName,
          lastName: updatedFormData.lastName,
          address: updatedFormData.address,
          city: updatedFormData.city,
          state: updatedFormData.state,
          zipCode: updatedFormData.zipCode,
          country: updatedFormData.country,
          cartItems: cartItems,
        }),
      });
    } catch (err) {
      console.error("Error persisting checkout draft:", err);
    }
  };

  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("applied_cart_coupon");
    if (saved) {
      try {
        setAppliedCoupon(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const subtotal = getCartTotal();
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, subtotal) : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = subtotalAfterDiscount * 0.1;
  const total = subtotalAfterDiscount + tax;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    saveCheckoutDraft(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate API call to process payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 1. Save completed order into backend MySQL database (orders and order_items tables)
      let dbOrderId: any = null;
      try {
        const token = localStorage.getItem("adminToken");
        const storedUser = localStorage.getItem("adminUser");
        let currentUserId: number | null = null;
        if (storedUser) {
          try {
            currentUserId = JSON.parse(storedUser).id;
          } catch (e) {}
        }

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        let appliedCouponCode: string | null = null;
        if (typeof window !== "undefined") {
          const savedCouponRaw = localStorage.getItem("applied_cart_coupon");
          if (savedCouponRaw) {
            try {
              appliedCouponCode = JSON.parse(savedCouponRaw).code;
            } catch (e) {}
          }
        }

        const res = await fetch(`${apiUrl}/orders/place`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: currentUserId,
            total_amount: subtotal,
            discount_amount: discountAmount,
            shipping_fee: tax,
            final_amount: total,
            payment_method: formData.paymentMethod,
            card_number: formData.cardNumber,
            coupon_code: appliedCouponCode,
            transaction_reference: formData.paymentMethod === "card"
              ? `CARD-${formData.cardNumber.slice(-4) || "8888"}`
              : formData.paymentMethod === "cod"
              ? `COD-${Date.now().toString(36).toUpperCase()}`
              : formData.transactionId || `TRX-${Date.now().toString(36).toUpperCase()}`,
            mobile_number: formData.mobileNumber || formData.phone,
            items: cartItems.map((ci) => ({
              product_id: ci.product.id,
              quantity: ci.quantity,
              price: Number(ci.product.base_price),
            })),
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.data) {
          dbOrderId = resData.data.id;
        }
      } catch (err) {
        console.error("Error creating database order:", err);
      }

      // 2. Save completed order into local patron orders ledger for instant UI rendering
      const orderRef = "MAISON-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        id: orderRef,
        dbId: dbOrderId,
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        status: "Pending Approval",
        total: total,
        trackingNumber: "DHL-EXPRESS-" + Math.floor(100000000 + Math.random() * 900000000),
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
        items: cartItems.map((item, idx) => {
          let img = item.product.images && item.product.images.length > 0 ? item.product.images[0].image_url : "/women_fashon.jpg";
          if (img && !img.startsWith("http")) {
            img = `${localBaseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
          }
          return {
            id: `item-${idx}-${Date.now()}`,
            name: item.product.name,
            price: Number(item.product.base_price),
            quantity: item.quantity,
            image: img,
          };
        }),
      };

      const existingOrdersRaw = localStorage.getItem("patron_orders");
      let existingOrders = [];
      if (existingOrdersRaw) {
        try { existingOrders = JSON.parse(existingOrdersRaw); } catch (e) {}
      }
      localStorage.setItem("patron_orders", JSON.stringify([newOrder, ...existingOrders]));
      if (dbOrderId) {
        localStorage.setItem("latest_completed_order_id", String(dbOrderId));
      }

      // Delete checkout draft from database upon order completion
      const token = localStorage.getItem("adminToken");
      const sessionId = localStorage.getItem("checkout_session_id") || "";
      const headers: HeadersInit = {
        Accept: "application/json",
        "X-Session-ID": sessionId,
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch(`${apiUrl}/checkout/draft`, {
        method: "DELETE",
        headers,
      });

      // Clear applied promo coupon so subsequent orders do not retain previous coupon
      if (typeof window !== "undefined") {
        localStorage.removeItem("applied_cart_coupon");
      }

      setOrderComplete(true);
      clearCart();
    } catch (error) {
      console.error("Checkout error:", error);
      alert("There was an error processing your reservation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== 1. EMPTY CART STATE ====================
  if (cartItems.length === 0 && !orderComplete) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5] py-20 px-4 font-sans antialiased selection:bg-[#C5A059] selection:text-white">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl border border-[#D4AF37]/40 shadow-xl p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center shadow-sm">
              <Crown className="w-8 h-8 text-[#8C6D2B]" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B] block mb-1">
                Maison Acquisition
              </span>
              <h2 className="text-3xl font-serif text-[#1C1A17]">Your Cart is Empty</h2>
              <p className="text-xs text-[#5A554C] font-light leading-relaxed mt-2">
                Please select your desired masterwork artifacts from our catalog before proceeding to checkout.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md group"
            >
              <span>Return to Catalog</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ==================== 2. ORDER CONFIRMED STATE ====================
  if (orderComplete) {
    return (
      <Layout>
        <div className="min-h-[75vh] flex items-center justify-center bg-[#FAF8F5] py-20 px-4 font-sans antialiased selection:bg-[#C5A059] selection:text-white">
          <div className="max-w-lg w-full bg-white/90 backdrop-blur-md rounded-2xl border border-[#D4AF37]/40 shadow-2xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#D4AF37]/10 rounded-full blur-[90px] pointer-events-none" />

            <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF8F5] border border-[#C5A059]/50 flex items-center justify-center shadow-md">
              <CheckCircle className="w-10 h-10 text-[#8C6D2B]" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B] block mb-1">
                Maison Reservation Confirmed
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#1C1A17]">Acquisition Confirmed</h1>
              <p className="text-xs text-[#5A554C] font-light leading-relaxed mt-3">
                Thank you for your patronage. Your order has been securely processed and dispatched to our master logistics team for white-glove packaging.
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md group"
              >
                <span>Review Acquisition Portfolio</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/"
                className="block text-center text-xs font-bold uppercase tracking-wider text-[#7A7468] hover:text-[#1C1A17] transition-colors pt-2"
              >
                Return to Maison Homepage
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ==================== 3. MAIN CHECKOUT FORM ====================
  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A17] font-sans antialiased selection:bg-[#C5A059] selection:text-white pb-24">

        {/* Header */}
        <header className="relative bg-gradient-to-b from-[#F7F3EC] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#E8E2D5] py-12 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Acquisition Bag</span>
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/30 shadow-sm backdrop-blur-md mb-2">
                  <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">
                    Maison Checkout Protocol
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-serif text-[#111111] tracking-tight">
                  Finalize Acquisition
                </h1>
              </div>

              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#7A7468] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                <span>256-Bit Encrypted Protocol</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* CHECKOUT FORM */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Section 1: Contact Information */}
                <div className="bg-[#FAF8F5]/80 rounded-2xl p-5 border border-[#E8E2D5] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D5]">
                    <span className="w-6 h-6 rounded-full bg-[#1C1A17] text-[#D4AF37] text-xs font-bold font-mono flex items-center justify-center">1</span>
                    <h2 className="text-base font-serif font-bold text-[#1C1A17]">
                      Contact Specifications
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        Email Address <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="patron@maison.com"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        Phone Number <span className="text-rose-600">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-3 bg-white border border-[#E8E2D5] text-[#8C6D2B] text-xs font-mono font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-sm">
                          <span>{getCountryByName(formData.country).flag}</span>
                          <span>{getCountryByName(formData.country).code}</span>
                          <span>({getCountryByName(formData.country).dialCode})</span>
                        </div>
                        <input
                          type="text"
                          name="phone"
                          placeholder={getCountryByName(formData.country).phoneFormat}
                          required
                          value={formData.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setFormData((prev) => ({ ...prev, phone: val }));
                          }}
                          className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm font-mono placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Shipping Destination */}
                <div className="bg-[#FAF8F5]/80 rounded-2xl p-5 border border-[#E8E2D5] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D5]">
                    <span className="w-6 h-6 rounded-full bg-[#1C1A17] text-[#D4AF37] text-xs font-bold font-mono flex items-center justify-center">2</span>
                    <h2 className="text-base font-serif font-bold text-[#1C1A17]">
                      White-Glove Shipping Destination
                    </h2>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        First Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Jean"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        Last Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Dupont"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Country & Street Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        Country <span className="text-rose-600">*</span>
                      </label>
                      <select
                        name="country"
                        required
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm font-medium cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.flag} {c.name} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        Street Address <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        placeholder="House 42, Road 11, Block D, Banani"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* City, State & Zip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        City <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        placeholder="Dhaka"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        State / Division <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        placeholder="Dhaka Division"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                        Postal Code <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        placeholder="1213"
                        required
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm font-mono placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Payment Method Selection */}
                <div className="bg-[#FAF8F5]/80 rounded-2xl p-5 border border-[#E8E2D5] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D5]">
                    <span className="w-6 h-6 rounded-full bg-[#1C1A17] text-[#D4AF37] text-xs font-bold font-mono flex items-center justify-center">3</span>
                    <h2 className="text-base font-serif font-bold text-[#1C1A17]">
                      Payment Method
                    </h2>
                  </div>

                  {/* Method Choice Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* 1. Credit / Debit Card */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, paymentMethod: "card" as const };
                        setFormData(updated);
                        saveCheckoutDraft(updated);
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        formData.paymentMethod === "card"
                          ? "bg-[#1C1A17] text-white border-[#1C1A17] shadow-md ring-2 ring-[#C5A059]"
                          : "bg-white text-[#1C1A17] border-[#E8E2D5] hover:border-[#C5A059]"
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 ${formData.paymentMethod === "card" ? "text-[#D4AF37]" : "text-[#8C6D2B]"}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Card</span>
                    </button>

                    {/* 2. bKash */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, paymentMethod: "bkash" as const };
                        setFormData(updated);
                        saveCheckoutDraft(updated);
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        formData.paymentMethod === "bkash"
                          ? "bg-[#E2136E] text-white border-[#E2136E] shadow-md ring-2 ring-[#E2136E]/40"
                          : "bg-white text-[#1C1A17] border-[#E8E2D5] hover:border-[#E2136E]"
                      }`}
                    >
                      <img src="/bkash.png" alt="bKash Logo" className="h-12 w-auto object-contain bg-white rounded p-1" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">bKash</span>
                    </button>

                    {/* 3. Nagad */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, paymentMethod: "nagad" as const };
                        setFormData(updated);
                        saveCheckoutDraft(updated);
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        formData.paymentMethod === "nagad"
                          ? "bg-[#F7931E] text-white border-[#F7931E] shadow-md ring-2 ring-[#F7931E]/40"
                          : "bg-white text-[#1C1A17] border-[#E8E2D5] hover:border-[#F7931E]"
                      }`}
                    >
                      <img src="/nagad.png" alt="Nagad Logo" className="h-12 w-auto object-contain bg-white rounded p-1" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Nagad</span>
                    </button>

                    {/* 4. Cash on Delivery */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, paymentMethod: "cod" as const };
                        setFormData(updated);
                        saveCheckoutDraft(updated);
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        formData.paymentMethod === "cod"
                          ? "bg-[#1C1A17] text-white border-[#1C1A17] shadow-md ring-2 ring-[#C5A059]"
                          : "bg-white text-[#1C1A17] border-[#E8E2D5] hover:border-[#C5A059]"
                      }`}
                    >
                      <Crown className={`w-5 h-5 ${formData.paymentMethod === "cod" ? "text-[#D4AF37]" : "text-[#8C6D2B]"}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">COD</span>
                    </button>
                  </div>

                  {/* Dynamic Fields for Credit/Debit Card */}
                  {formData.paymentMethod === "card" && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                          Card Number <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="4532 8912 3456 7890"
                          maxLength={19}
                          required={formData.paymentMethod === "card"}
                          value={formData.cardNumber}
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 16);
                            const formatted = digitsOnly.replace(/(.{4})/g, "$1 ").trim();
                            const updated = { ...formData, cardNumber: formatted };
                            setFormData(updated);
                            saveCheckoutDraft(updated);
                          }}
                          className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm font-mono tracking-wider"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                          Name on Card <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          name="nameOnCard"
                          placeholder="JEAN DUPONT"
                          required={formData.paymentMethod === "card"}
                          value={formData.nameOnCard}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                            Expiration Date <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            placeholder="MM / YY"
                            maxLength={7}
                            required={formData.paymentMethod === "card"}
                            value={formData.expiryDate}
                            onChange={(e) => {
                              let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                              if (digits.length >= 2) {
                                const month = Math.min(12, Math.max(1, parseInt(digits.slice(0, 2), 10)));
                                const formattedMonth = month < 10 ? `0${month}` : `${month}`;
                                const year = digits.slice(2);
                                digits = `${formattedMonth} / ${year}`;
                              }
                              const updated = { ...formData, expiryDate: digits };
                              setFormData(updated);
                              saveCheckoutDraft(updated);
                            }}
                            className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm font-mono text-center tracking-widest"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                            Security CVV <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            placeholder="123"
                            maxLength={4}
                            required={formData.paymentMethod === "card"}
                            value={formData.cvv}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
                              const updated = { ...formData, cvv: digitsOnly };
                              setFormData(updated);
                              saveCheckoutDraft(updated);
                            }}
                            className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm font-mono text-center tracking-widest"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Fields for Mobile Banking: bKash / Nagad */}
                  {(formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && (
                    <div className="space-y-4 pt-2 bg-white/70 p-4 rounded-xl border border-[#E8E2D5]">
                      <div className="p-3.5 bg-[#FAF8F5] border border-[#D4AF37]/30 rounded-xl text-xs space-y-1.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[#8C6D2B]">
                            {formData.paymentMethod === "bkash" ? "bKash Merchant Payment Instructions" : "Nagad Merchant Payment Instructions"}
                          </p>
                          <p className="text-[#5A554C] mt-0.5">
                            Please send total amount <strong className="text-[#1C1A17] font-mono">৳{Math.round(total).toLocaleString()}</strong> to Merchant Number: <span className="font-mono font-bold text-[#8C6D2B]">01700-000000</span>
                          </p>
                        </div>
                        <img
                          src={formData.paymentMethod === "bkash" ? "/bkash.png" : "/nagad.png"}
                          alt="Mobile Payment Brand Logo"
                          className="h-14 w-auto object-contain shrink-0 bg-white rounded p-1 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                          {formData.paymentMethod === "bkash" ? "bKash Wallet Number" : "Nagad Wallet Number"} <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          name="mobileNumber"
                          placeholder="01712345678"
                          required={formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad"}
                          value={formData.mobileNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                            const updated = { ...formData, mobileNumber: val };
                            setFormData(updated);
                            saveCheckoutDraft(updated);
                          }}
                          className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm font-mono placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1C1A17] mb-1.5">
                          TrxID (Transaction ID) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          name="transactionId"
                          placeholder="8N7A6D5E4F"
                          required={formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad"}
                          value={formData.transactionId}
                          onChange={(e) => {
                            const updated = { ...formData, transactionId: e.target.value.toUpperCase() };
                            setFormData(updated);
                            saveCheckoutDraft(updated);
                          }}
                          className="w-full px-4 py-3 bg-white border border-[#E8E2D5] text-[#1C1A17] text-sm font-mono placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-sm uppercase tracking-wider"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Message for Cash on Delivery (COD) */}
                  {formData.paymentMethod === "cod" && (
                    <div className="pt-2 bg-white/70 p-4 rounded-xl border border-[#E8E2D5]">
                      <div className="p-3 bg-[#FAF8F5] border border-[#D4AF37]/40 rounded-lg text-xs space-y-1">
                        <p className="font-bold uppercase tracking-wider text-[#8C6D2B]">
                          Cash on Delivery (COD)
                        </p>
                        <p className="text-[#5A554C]">
                          Pay the total amount <strong className="text-[#1C1A17] font-mono">৳{Math.round(total).toLocaleString()}</strong> in cash directly to our white-glove courier upon delivery.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-[#1C1A17] hover:bg-[#C5A059] disabled:bg-[#1C1A17]/60 text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 text-[#D4AF37] animate-spin" />
                      <span>Authenticating Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-white transition-colors" />
                      <span>Finalize Acquisition</span>
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* ORDER ACQUISITION PORTFOLIO SUMMARY */}
            <aside className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-6 sm:p-8 shadow-sm space-y-6">

              <div className="pb-4 border-b border-[#E8E2D5]">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
                  Reserved Artifacts
                </span>
                <h2 className="text-2xl font-serif text-[#1C1A17]">
                  Acquisition Portfolio
                </h2>
              </div>

              {/* Item List */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center text-xs pb-3 border-b border-[#FAF8F5] last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] px-2.5 py-1 rounded-md font-mono font-bold">
                        {item.quantity}x
                      </span>
                      <span className="text-[#1C1A17] font-serif font-semibold">
                        {item.product.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#1C1A17]">
                      ৳{Math.round(Number(item.product.base_price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Valuation Breakdown */}
              <div className="space-y-3 border-t border-[#E8E2D5] pt-4 text-xs font-medium">
                <div className="flex justify-between text-[#5A554C]">
                  <span>Subtotal Value</span>
                  <span className="font-mono text-[#1C1A17] font-bold">
                    ৳{Math.round(subtotal).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#5A554C]">
                  <span>White-Glove Delivery</span>
                  <span className="text-[#8C6D2B] font-bold uppercase text-[10px] tracking-wider bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E2D5]">
                    Complimentary
                  </span>
                </div>

                <div className="flex justify-between text-[#5A554C]">
                  <span>Estimated Tax (10%)</span>
                  <span className="font-mono text-[#1C1A17] font-bold">
                    ৳{Math.round(tax).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-baseline border-t border-[#E8E2D5] pt-4">
                  <span className="font-bold text-[#1C1A17] uppercase tracking-wider text-xs">
                    Total Acquisition Sum
                  </span>
                  <span className="font-serif font-bold text-2xl text-[#1C1A17]">
                    ৳{Math.round(total).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Security Protocol Footer */}
              <div className="pt-2 text-center">
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#7A7468] uppercase tracking-widest font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>256-Bit Encrypted Maison Gateway</span>
                </div>
              </div>

            </aside>

          </div>
        </main>
      </div>
    </Layout>
  );
}