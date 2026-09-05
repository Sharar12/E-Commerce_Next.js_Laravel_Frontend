"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ticket,
  Sparkles,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
  Percent,
  Hash,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  User as UserIcon,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import AdminLayout from "../../AdminLayout";
import { apiUrl, adminToken, safeParseJson } from "../../../common/http";
import { CouponSchema, formatZodErrors } from "../../../common/validations";

type DiscountType = "percentage" | "fixed";
type CouponStatus = "active" | "inactive";
type CouponVisibility = "public" | "private" | "activity";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CouponForm {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string | number;
  min_purchase_amount: string | number;
  max_discount_amount: string | number | "";
  valid_from: string;
  valid_to: string;
  usage_limit: string | number;
  status: CouponStatus;
  visibility: CouponVisibility;
  assigned_user_id: string | number | "";
  activity_type: string;
  activity_threshold: string | number;
  activity_description: string;
}

export default function CreateCouponPage() {
  const router = useRouter();

  const [form, setForm] = useState<CouponForm>({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase_amount: "",
    max_discount_amount: "",
    valid_from: "",
    valid_to: "",
    usage_limit: "1",
    status: "active",
    visibility: "public",
    assigned_user_id: "",
    activity_type: "first_order",
    activity_threshold: "1",
    activity_description: "",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toString().includes(q)
    );
  }, [users, userSearchQuery]);

  // Fetch registered users for private coupon assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch(`${apiUrl}/users`, {
          headers: { Authorization: `Bearer ${adminToken()}` },
        });
        if (res.ok) {
          const result = await safeParseJson(res);
          setUsers(result.data || result || []);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Client-side validations using Zod Schema
  const clientErrors = useMemo(() => {
    const parsed = CouponSchema.safeParse(form);
    if (!parsed.success) {
      return formatZodErrors(parsed.error);
    }
    return {};
  }, [form]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      if (
        name === "discount_value" ||
        name === "min_purchase_amount" ||
        name === "max_discount_amount" ||
        name === "usage_limit" ||
        name === "assigned_user_id"
      ) {
        return { ...prev, [name]: value };
      }
      if (name === "discount_type") {
        return { ...prev, discount_type: value as DiscountType };
      }
      if (name === "status") {
        return { ...prev, status: value as CouponStatus };
      }
      if (name === "visibility") {
        return {
          ...prev,
          visibility: value as CouponVisibility,
          assigned_user_id: value === "public" ? "" : prev.assigned_user_id,
        };
      }
      return { ...prev, [name]: type === "number" ? Number(value) : value };
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const [couponPrefix, setCouponPrefix] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("savedCouponPrefix") || "LUMINA";
    }
    return "LUMINA";
  });
  const [prefixSaved, setPrefixSaved] = useState(false);

  const saveCouponPrefix = (prefix: string) => {
    const clean = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCouponPrefix(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("savedCouponPrefix", clean);
    }
    setPrefixSaved(true);
    setTimeout(() => setPrefixSaved(false), 2000);
  };

  const generateCode = () => {
    const activePrefix = (couponPrefix || "LUMINA").trim().toUpperCase();
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomSuffix = "";
    for (let i = 0; i < 6; i++) {
      randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const fullCode = `${activePrefix}-${randomSuffix}`;
    setForm((prev) => ({ ...prev, code: fullCode }));
    setErrors((prev) => ({ ...prev, code: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setNotification({ type: "error", message: "Please resolve form validation errors before submitting." });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value ?? 0),
        min_purchase_amount: Number(form.min_purchase_amount ?? 0),
        max_discount_amount:
          form.max_discount_amount === "" ? null : Number(form.max_discount_amount),
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        usage_limit: Number(form.usage_limit ?? 1),
        status: form.status,
        visibility: form.visibility,
        assigned_user_id: form.visibility === "private" && form.assigned_user_id ? Number(form.assigned_user_id) : null,
        activity_type: form.visibility === "activity" ? form.activity_type : null,
        activity_threshold: form.visibility === "activity" ? Number(form.activity_threshold || 1) : 1,
        activity_description: form.visibility === "activity" && form.activity_description.trim() ? form.activity_description.trim() : null,
      };

      const res = await fetch(`${apiUrl}/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken()}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        if (data?.errors && typeof data.errors === "object") {
          const flat: Record<string, string> = {};
          Object.entries<any>(data.errors).forEach(([k, v]) => {
            flat[k] = Array.isArray(v) ? v.join(" ") : String(v);
          });
          setErrors(flat);
          setNotification({ type: "error", message: "Validation error: Please verify your coupon inputs." });
        } else {
          setNotification({ type: "error", message: data?.message || `Failed to create coupon (HTTP ${res.status})` });
        }
        return;
      }

      setNotification({
        type: "success",
        message: `Voucher coupon code "${payload.code}" created successfully!`,
      });

      setTimeout(() => {
        router.push("/admin/coupons");
      }, 1500);
    } catch (err) {
      console.error("Error creating coupon:", err);
      setNotification({ type: "error", message: "Unexpected network error creating coupon." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldError = ({ name }: { name: keyof CouponForm | string }) =>
    errors[name as string] ? (
      <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {errors[name as string]}
      </p>
    ) : null;

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/coupons"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Coupons Inventory
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Add Promotional Coupon
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Create luxury voucher codes, define public vs private user access, and set spending limits.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <Ticket className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Voucher Generator</span>
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

        {/* Main Form Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Voucher Code & Description */}
            <div className="space-y-4">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#8C6D2B]" /> Voucher Identity
              </h2>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#8C6D2B]" /> Coupon Code <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {/* Editable Prefix Control */}
                    <div className="inline-flex items-center gap-1 bg-[#FAF8F5] border border-[#E8E2D5] px-2.5 py-1 rounded-lg text-xs">
                      <span className="text-[10px] font-bold text-[#8C6D2B] uppercase tracking-wider">Prefix:</span>
                      <input
                        type="text"
                        value={couponPrefix}
                        onChange={(e) => saveCouponPrefix(e.target.value)}
                        className="w-16 bg-transparent text-xs font-mono font-bold text-[#1C1A17] focus:outline-none uppercase"
                        maxLength={10}
                        placeholder="LUMINA"
                        title="Edit Prefix for Code Generator"
                      />
                      {prefixSaved && (
                        <span className="text-[9px] text-emerald-600 font-bold animate-pulse">Saved</span>
                      )}
                    </div>

                    {/* Auto Generate Button */}
                    <button
                      type="button"
                      onClick={generateCode}
                      className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] bg-[#FAF8F5] hover:bg-[#E8E2D5] border border-[#E8E2D5] px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3 h-3 text-[#C5A059]" />
                      <span>Auto Generate</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="e.g. LUMINA-X89A12 or SAVE10"
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-bold uppercase tracking-wider pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6D2B] hover:text-[#1C1A17] p-1 transition-colors cursor-pointer"
                    title="Generate with active prefix"
                  >
                    <Zap className="w-4 h-4 text-[#C5A059]" />
                  </button>
                </div>
                <p className="text-[10px] text-[#6E685E] font-light mt-1">
                  Uses prefix <strong className="font-mono text-[#8C6D2B]">{couponPrefix || "LUMINA"}</strong> when generating unique voucher codes.
                </p>
                <FieldError name="code" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" /> Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Internal note or customer promotion details (e.g. VIP Summer Gala 15% Off)..."
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-4 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium min-h-[90px] resize-y"
                />
                <FieldError name="description" />
              </div>
            </div>

            {/* 🔒 Coupon Access & Visibility (Public vs Private) */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#8C6D2B]" /> Access & User Scope
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Coupon Visibility / Trigger Mode <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: "visibility", value: "public" } } as any)}
                      className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        form.visibility === "public"
                          ? "bg-[#1C1A17] text-white border-[#1C1A17] shadow-sm"
                          : "bg-[#FAF8F5] text-[#6E685E] border-[#E8E2D5] hover:bg-[#F2ECE1]"
                      }`}
                    >
                      <Globe className={`w-4 h-4 ${form.visibility === "public" ? "text-[#D4AF37]" : "text-[#8C6D2B]"}`} />
                      <span>Public</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: "visibility", value: "private" } } as any)}
                      className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        form.visibility === "private"
                          ? "bg-[#1C1A17] text-white border-[#1C1A17] shadow-sm"
                          : "bg-[#FAF8F5] text-[#6E685E] border-[#E8E2D5] hover:bg-[#F2ECE1]"
                      }`}
                    >
                      <Lock className={`w-4 h-4 ${form.visibility === "private" ? "text-[#D4AF37]" : "text-[#8C6D2B]"}`} />
                      <span>Private</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange({ target: { name: "visibility", value: "activity" } } as any)}
                      className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        form.visibility === "activity"
                          ? "bg-[#1C1A17] text-white border-[#1C1A17] shadow-sm"
                          : "bg-[#FAF8F5] text-[#6E685E] border-[#E8E2D5] hover:bg-[#F2ECE1]"
                      }`}
                    >
                      <Zap className={`w-4 h-4 ${form.visibility === "activity" ? "text-[#D4AF37]" : "text-[#8C6D2B]"}`} />
                      <span>Activity</span>
                    </button>
                  </div>
                </div>

                {/* Specific User Selector with Live Search when Private */}
                {form.visibility === "private" && (
                  <div className="animate-in fade-in duration-200 relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-[#8C6D2B]" /> Assigned Specific Customer <span className="text-rose-500">*</span>
                    </label>

                    {/* Searchable Dropdown Trigger Box */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium flex items-center justify-between text-left"
                      >
                        <span className="truncate">
                          {form.assigned_user_id
                            ? users.find((u) => u.id === Number(form.assigned_user_id))
                              ? `${users.find((u) => u.id === Number(form.assigned_user_id))?.name} (${users.find((u) => u.id === Number(form.assigned_user_id))?.email})`
                              : `User ID #${form.assigned_user_id}`
                            : "-- Select Specific Customer --"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#8C6D2B] transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {/* Pop-over Search & Selection Menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white border border-[#E8E2D5] rounded-2xl shadow-2xl overflow-hidden p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                        {/* Search Input Box */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-[#8C6D2B] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search user by name, email, or ID..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl text-xs text-[#1C1A17] placeholder:text-[#9E988D] focus:outline-none focus:border-[#C5A059] font-medium"
                            autoFocus
                          />
                          {userSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setUserSearchQuery("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* User List Options */}
                        <div className="max-h-48 overflow-y-auto divide-y divide-[#FAF8F5] pr-1">
                          {loadingUsers ? (
                            <div className="p-4 text-center text-xs text-[#8C6D2B] font-bold">
                              Loading registered customers...
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[#6E685E]">
                              No customer matches "{userSearchQuery}"
                            </div>
                          ) : (
                            filteredUsers.map((u) => {
                              const isSelected = Number(form.assigned_user_id) === u.id;
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setForm((prev) => ({ ...prev, assigned_user_id: u.id }));
                                    setErrors((prev) => ({ ...prev, assigned_user_id: "" }));
                                    setIsUserDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 text-left rounded-xl text-xs transition-colors flex items-center justify-between ${
                                    isSelected
                                      ? "bg-[#FAF8F5] text-[#8C6D2B] font-bold border border-[#C5A059]/40"
                                      : "hover:bg-[#FFFDF9] text-[#1C1A17]"
                                  }`}
                                >
                                  <div>
                                    <div className="font-serif font-semibold">{u.name}</div>
                                    <div className="text-[11px] text-[#6E685E] font-mono">{u.email}</div>
                                  </div>
                                  <span className="font-mono text-[10px] text-[#8C6D2B] font-bold bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E2D5]">
                                    #{u.id}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <FieldError name="assigned_user_id" />
                  </div>
                )}

                {/* 🎯 Customizable Activity Criteria Configuration when Activity is selected */}
                {form.visibility === "activity" && (
                  <div className="animate-in fade-in duration-200 col-span-1 md:col-span-2 bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D5]">
                      <Zap className="w-4 h-4 text-[#C5A059]" />
                      <h3 className="text-xs font-serif font-bold text-[#1C1A17] uppercase tracking-wider">
                        Configure Customer Activity Trigger & Requirements
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Activity Type Selector */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                          Activity Requirement Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="activity_type"
                          value={form.activity_type}
                          onChange={handleChange}
                          className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium"
                        >
                          <option value="first_order">1st Purchase (Welcome Order)</option>
                          <option value="min_orders">Completed Order Milestone (e.g. 5+ Orders)</option>
                          <option value="write_review">Product Reviews Written (e.g. 3 Reviews)</option>
                          <option value="wishlist_items">Wishlist Curation (e.g. 10 Items)</option>
                          <option value="custom_milestone">Custom Milestone Goal</option>
                        </select>
                        <FieldError name="activity_type" />
                      </div>

                      {/* Required Threshold Number */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                          Threshold Count Requirement <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="activity_threshold"
                          value={form.activity_threshold}
                          onChange={handleChange}
                          min={1}
                          placeholder="e.g. 5"
                          className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-mono font-bold"
                          required
                        />
                        <FieldError name="activity_threshold" />
                      </div>
                    </div>

                    {/* Custom Activity Instructions / Notes */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                        Custom Activity Instructions / Description for Customer
                      </label>
                      <input
                        type="text"
                        name="activity_description"
                        value={form.activity_description}
                        onChange={handleChange}
                        placeholder="e.g. Complete 5 verified order purchases to automatically unlock this 20% privilege coupon!"
                        className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] placeholder:text-[#9E988D] focus:outline-none focus:border-[#C5A059] font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Rules */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#8C6D2B]" /> Discount Rules
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Discount Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="discount_type"
                    value={form.discount_type}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Currency Amount (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Discount Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    name="discount_value"
                    value={form.discount_value}
                    onChange={handleChange}
                    placeholder={form.discount_type === "percentage" ? "e.g. 15 for 15%" : "e.g. 500 for ৳500 off"}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-bold"
                    required
                  />
                  <FieldError name="discount_value" />
                </div>
              </div>
            </div>

            {/* Spending & Usage Thresholds */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8C6D2B]" /> Spending & Usage Limits
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Min Purchase (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    name="min_purchase_amount"
                    value={form.min_purchase_amount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium"
                    required
                  />
                  <FieldError name="min_purchase_amount" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Max Discount (৳)
                  </label>
                  <input
                    type="number"
                    step="1"
                    name="max_discount_amount"
                    value={form.max_discount_amount}
                    onChange={handleChange}
                    placeholder="(Optional cap)"
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium"
                  />
                  <FieldError name="max_discount_amount" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Usage Limit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={form.usage_limit}
                    onChange={handleChange}
                    min={1}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium"
                    required
                  />
                  <FieldError name="usage_limit" />
                </div>
              </div>
            </div>

            {/* Validity Duration & Status */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8C6D2B]" /> Duration & Activation
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    name="valid_from"
                    value={form.valid_from}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  />
                  <FieldError name="valid_from" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Valid To
                  </label>
                  <input
                    type="date"
                    name="valid_to"
                    value={form.valid_to}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  />
                  <FieldError name="valid_to" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  >
                    <option value="active">Active (Redeemable)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                  <FieldError name="status" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1C1A17] hover:bg-[#332F2A] text-white py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Voucher Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Add Coupon</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
