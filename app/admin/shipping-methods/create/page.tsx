"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Sparkles,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Gift,
} from "lucide-react";
import AdminLayout from "../../AdminLayout";
import { apiUrl, adminToken, safeParseJson } from "../../../common/http";
import { ShippingMethodSchema, formatZodErrors } from "../../../common/validations";

interface ShippingMethodForm {
  name: string;
  description: string;
  fee: string | number;
  is_free_shipping: number;
}

export default function AddShippingMethodPage() {
  const router = useRouter();
  const [form, setForm] = useState<ShippingMethodForm>({
    name: "",
    description: "",
    fee: "",
    is_free_shipping: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "fee") return { ...prev, fee: value };
      if (name === "is_free_shipping") return { ...prev, is_free_shipping: Number(value) };
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parseResult = ShippingMethodSchema.safeParse(form);
    if (!parseResult.success) {
      const formatted = formatZodErrors(parseResult.error);
      const firstError = Object.values(formatted)[0] || "Form validation error.";
      setNotification({ type: "error", message: firstError });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        fee: form.is_free_shipping === 1 ? 0 : Number(form.fee ?? 0),
        is_free_shipping: Number(form.is_free_shipping),
      };

      const res = await fetch(`${apiUrl}/shipping-methods`, {
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
        const msg = (data && (data.message || JSON.stringify(data.errors))) || "Failed to create shipping method.";
        setNotification({ type: "error", message: typeof msg === "string" ? msg : "Failed to create shipping method." });
        return;
      }

      setNotification({ type: "success", message: "Shipping method created successfully!" });

      setTimeout(() => {
        router.push("/admin/shipping-methods");
      }, 1500);
    } catch (err) {
      console.error("Error creating shipping method:", err);
      setNotification({ type: "error", message: "Unexpected error creating shipping method." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/shipping-methods"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Shipping Methods
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Create Shipping Method
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Add a new logistics delivery option, specify delivery timeframe notes, and set Taka fees.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Fulfillment Setup</span>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Method Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#8C6D2B]" /> Method Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Express Air Courier, Standard Ground, Same Day Delivery"
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" /> Delivery Timeframe Description
              </label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="e.g. Delivered within 24-48 hours across major cities"
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-xs text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              />
            </div>

            {/* Free Shipping Tier Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#8C6D2B]" /> Is Free Shipping Option?
              </label>
              <select
                name="is_free_shipping"
                value={form.is_free_shipping}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              >
                <option value={0}>No (Charged Delivery Fee)</option>
                <option value={1}>Yes (Complimentary Free Shipping)</option>
              </select>
            </div>

            {/* Delivery Fee Input */}
            {form.is_free_shipping === 0 && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#8C6D2B]" /> Delivery Fee (৳ Taka) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="fee"
                  value={form.fee}
                  onChange={handleChange}
                  min={0}
                  placeholder="e.g. 120"
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-bold"
                  required={form.is_free_shipping === 0}
                />
              </div>
            )}

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
                    <span>Creating Shipping Method...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Create Shipping Method</span>
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
