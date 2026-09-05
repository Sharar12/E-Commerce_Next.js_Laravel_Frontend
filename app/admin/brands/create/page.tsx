"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, CheckCircle2, AlertCircle, PlusCircle, Sparkles, Upload, Image as ImageIcon, X } from "lucide-react";
import { apiUrl, adminToken } from "../../../common/http";
import AdminLayout from "../../AdminLayout";

interface BrandForm {
  name: string;
  status: number;
}

export default function AddBrand() {
  const router = useRouter();
  const [form, setForm] = useState<BrandForm>({ name: "", status: 1 });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const key = name as keyof BrandForm;

    setForm({ ...form, [key]: type === "number" ? Number(value) : value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("status", String(form.status));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${apiUrl}/brands`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken()}`,
        },
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok) {
        setNotification({
          type: "error",
          message: typeof responseData.message === 'string' ? responseData.message : JSON.stringify(responseData.errors || "Failed to create brand")
        });
        return;
      }

      setNotification({
        type: "success",
        message: "Brand created successfully in atelier catalog!"
      });
      setForm({ name: "", status: 1 });
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => {
        router.push('/admin/brands');
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setNotification({
        type: "error",
        message: "Network error: Failed to connect to atelier backend server."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/brands"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Brand Registry
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Add New Brand
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Register a new luxury brand or manufacturer into the atelier ecosystem.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Maison Registry</span>
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
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#8C6D2B]" />
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                placeholder="e.g. Royal Oak, Gucci, Chanel"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder-[#9E988D] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                required
              />
            </div>

            {/* Brand Logo / Thumbnail Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#8C6D2B]" />
                Brand Logo / Thumbnail
              </label>
              
              {imagePreview ? (
                <div className="relative inline-block border border-[#E8E2D5] rounded-2xl overflow-hidden bg-[#FAF8F5] p-2">
                  <img
                    src={imagePreview}
                    alt="Thumbnail Preview"
                    className="w-32 h-32 object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-md"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#E8E2D5] hover:border-[#C5A059] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#FAF8F5]/50 hover:bg-[#FAF8F5] transition-all">
                  <div className="p-3 bg-white rounded-full border border-[#E8E2D5] shadow-sm text-[#8C6D2B]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#1C1A17]">Click to upload brand logo</span>
                  <span className="text-[10px] text-[#8C6D2B]">PNG, JPG, WEBP or SVG up to 4MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              >
                <option value={1}>Active (Visible in Catalog)</option>
                <option value={0}>Inactive (Hidden)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5] flex items-center justify-end gap-4">
              <Link
                href="/admin/brands"
                className="px-6 py-3 rounded-xl border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1C1A17] hover:bg-[#C5A059] text-[#ffffff] px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>{isSubmitting ? "Creating Brand..." : "Add Brand"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
