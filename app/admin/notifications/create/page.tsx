// app/admin/notifications/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../AdminLayout";
import { apiUrl, adminToken } from "../../../common/http";
import {
  Bell,
  ArrowLeft,
  Send,
  User,
  Sparkles,
  FileText,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type NotificationType = "order" | "payment" | "shipping" | "system" | "other";

interface NotificationForm {
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;     // 1/0 to Laravel
  read_at: string | null; // ISO string or null
}

export default function CreateNotificationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<NotificationForm>({
    user_id: 0,
    title: "",
    message: "",
    type: "other",
    is_read: false,
    read_at: null,
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (name === "is_read") {
      setForm((f) => ({ ...f, is_read: checked }));
      return;
    }
    if (name === "user_id") {
      setForm((f) => ({ ...f, user_id: Number(value) || 0 }));
      return;
    }
    if (name === "read_at") {
      setForm((f) => ({ ...f, read_at: value ? new Date(value).toISOString() : null }));
      return;
    }
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.");
      return;
    }
    if (!form.user_id) {
      setError("Valid user ID is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        user_id: form.user_id,
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        is_read: form.is_read ? 1 : 0,
        read_at: form.read_at,
      };

      const res = await fetch(`${apiUrl}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data && (data.message || JSON.stringify(data.errors))) ||
          "Failed to create notification.";
        setError(typeof msg === "string" ? msg : "Failed to create notification.");
        return;
      }

      router.push("/admin/notifications");
    } catch (err) {
      console.error(err);
      setError("Unexpected error creating notification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const readAtLocalValue = form.read_at
    ? new Date(form.read_at).toISOString().slice(0, 16)
    : "";

  return (
    <AdminLayout>
      <main className="p-4 sm:p-8 flex-1 max-w-4xl mx-auto font-sans antialiased text-[#1C1A17]">
        {/* Luxury Card Container */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-lg p-6 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E2D5] pb-6 gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B] block mb-1">
                Dispatch Hub • System Broadcast
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] flex items-center gap-3">
                <Bell className="w-6 h-6 text-[#C5A059]" /> Add Notification
              </h1>
              <p className="text-xs text-[#6E685E] font-light mt-1">
                Send targeted announcements, transactional updates, or system alerts to registered patrons.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin/notifications")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold hover:border-[#C5A059] hover:text-[#8C6D2B] transition-all shadow-sm group self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4 text-[#8C6D2B] group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* User ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8C6D2B]" /> User ID
                </label>
                <input
                  name="user_id"
                  type="number"
                  placeholder="e.g. 123"
                  value={form.user_id || ""}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E9689] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner"
                  required
                />
              </div>

              {/* Category Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#8C6D2B]" /> Notification Type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] capitalize focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner"
                >
                  <option value="order">Order</option>
                  <option value="payment">Payment</option>
                  <option value="shipping">Shipping</option>
                  <option value="system">System</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Notification Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8C6D2B]" /> Title
              </label>
              <input
                name="title"
                placeholder="e.g. Order shipped"
                value={form.title}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E9689] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6D2B] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" /> Message
              </label>
              <textarea
                name="message"
                placeholder="Write the notification message…"
                value={form.message}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E9689] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-inner min-h-[120px] resize-y"
                required
              />
            </div>

            {/* Status & Timestamp Controls */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                
                {/* Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="is_read"
                    checked={form.is_read}
                    onChange={handleChange}
                    className="w-4 h-4 accent-[#8C6D2B] rounded border-[#E8E2D5] focus:ring-[#C5A059]"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1C1A17] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8C6D2B]" /> Mark as read
                  </span>
                </label>

                {/* Read At Input */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6D2B] mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8C6D2B]" /> Read At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    name="read_at"
                    value={readAtLocalValue}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#E8E2D5] rounded-xl px-3 py-2 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                  />
                  <p className="text-[11px] text-[#6E685E] mt-1.5 font-light">
                    If left blank, it will be null. If “Mark as read” is checked and this is blank, your API can set it server-side.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-[#1C1A17] via-[#2D2A26] to-[#1C1A17] text-[#FAF8F5] rounded-xl font-semibold text-sm hover:from-[#C5A059] hover:to-[#8C6D2B] hover:text-white transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 group"
            >
              <Send className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 transition-transform" />
              {isSubmitting ? "Creating…" : "Create Notification"}
            </button>
          </form>
        </div>
      </main>
    </AdminLayout>
  );
}
