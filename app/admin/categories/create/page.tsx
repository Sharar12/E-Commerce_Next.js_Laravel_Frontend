"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FolderPlus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PlusCircle,
  Image as ImageIcon,
  Upload,
  X,
  Layers,
} from "lucide-react";
import { apiUrl, adminToken, safeParseJson } from "../../../common/http";
import AdminLayout from "../../AdminLayout";

interface CategoryForm {
  name: string;
  description: string;
  status: number;
  parent_id: string; // empty string = top-level
}

interface FlatCategory {
  id: number;
  name: string;
  parent_id: number | null;
  parent?: { id: number; name: string; parent_id: number | null } | null;
  children?: FlatCategory[];
}

function AddCategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<CategoryForm>({
    name: "",
    description: "",
    status: 1,
    parent_id: searchParams.get("parent_id") || "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // All categories (flattened) for dropdown
  const [allCategories, setAllCategories] = useState<FlatCategory[]>([]);

  // Pre-locked parent from URL param
  const preselectedParentId = searchParams.get("parent_id");
  const isParentLocked = Boolean(preselectedParentId);

  // Fetch all categories to populate the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiUrl}/categories`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${adminToken()}`,
          },
        });
        const data = await safeParseJson(res);
        // The index now returns tree — flatten it for dropdown
        const raw = data.data ?? data;
        const tree: FlatCategory[] = Array.isArray(raw) ? raw : [];
        const flat: FlatCategory[] = [];

        const flatten = (nodes: FlatCategory[], parent: FlatCategory | null = null) => {
          nodes.forEach((node) => {
            flat.push({ ...node, parent: parent ? { id: parent.id, name: parent.name, parent_id: parent.parent_id } : null });
            if (node.children && node.children.length > 0) {
              flatten(node.children, node);
            }
          });
        };

        flatten(tree);
        setAllCategories(flat);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Split categories into level-1 and level-2 (only) for the dropdown
  // Level-3 categories are excluded (can't be parents = would create level 4)
  const level1Cats = allCategories.filter((c) => !c.parent_id);
  const level2Cats = allCategories.filter(
    (c) => c.parent_id !== null && c.parent && !c.parent.parent_id
  );

  const preselectedParent = allCategories.find(
    (c) => String(c.id) === preselectedParentId
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const key = name as keyof CategoryForm;
    setForm({ ...form, [key]: type === "number" ? Number(value) : value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setNotification({
          type: "error",
          message: "Thumbnail image size must be less than 2MB.",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setNotification(null);
    }
  };

  const handleRemoveImage = () => {
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
      formData.append("description", form.description);
      formData.append("status", String(form.status));
      if (form.parent_id) {
        formData.append("parent_id", form.parent_id);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${apiUrl}/categories`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: formData,
      });

      const responseData = await safeParseJson(res);

      if (!res.ok) {
        setNotification({
          type: "error",
          message:
            typeof responseData.message === "string"
              ? responseData.message
              : JSON.stringify(responseData.errors || "Failed to create category"),
        });
        return;
      }

      setNotification({
        type: "success",
        message: "Category created successfully in atelier catalog!",
      });
      setForm({ name: "", description: "", status: 1, parent_id: "" });
      handleRemoveImage();
      setTimeout(() => {
        router.push("/admin/categories");
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setNotification({
        type: "error",
        message: "Network error: Failed to connect to backend server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Level label for the locked parent
  const getLockedParentLabel = () => {
    if (!preselectedParent) return "Loading...";
    if (!preselectedParent.parent_id) return `Sub-Category of: ${preselectedParent.name}`;
    return `Child Category of: ${preselectedParent.parent?.name} → ${preselectedParent.name}`;
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Category Registry
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Add New Category
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Define a new product classification or taxonomy for the atelier catalog.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Maison Taxonomy</span>
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

            {/* Parent Category Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#8C6D2B]" />
                Parent Category
                <span className="text-[#9E988D] font-normal text-[10px] normal-case ml-1">
                  (determines hierarchy level)
                </span>
              </label>

              {isParentLocked ? (
                /* Locked read-only display when accessed from quick-add button */
                <div className="w-full bg-[#FAF8F5] border border-[#C5A059]/50 rounded-xl px-4 py-3 text-sm text-[#8C6D2B] font-semibold flex items-center gap-2">
                  <span className="text-[#C5A059]">🔒</span>
                  {getLockedParentLabel()}
                  <input type="hidden" name="parent_id" value={form.parent_id} />
                </div>
              ) : (
                <select
                  name="parent_id"
                  value={form.parent_id}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                >
                  <option value="">No Parent — Top-Level Category</option>

                  {level1Cats.length > 0 && (
                    <optgroup label="Make a Sub-Category of:">
                      {level1Cats.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {level2Cats.length > 0 && (
                    <optgroup label="Make a Child Category of:">
                      {level2Cats.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.parent?.name} → {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}

              <p className="text-[10px] text-[#9E988D] mt-1.5">
                No parent = Level 1 (Category) · Sub-category = Level 2 · Child category = Level 3
              </p>
            </div>

            {/* Category Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-2">
                <FolderPlus className="w-3.5 h-3.5 text-[#8C6D2B]" />
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                placeholder="e.g. Fine Jewelry, Haute Couture, Timepieces"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder-[#9E988D] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" />
                Category Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Enter a brief description of this category..."
                value={form.description}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder-[#9E988D] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium resize-none"
                required
              />
            </div>

            {/* Category Thumbnail Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#8C6D2B]" />
                Category Thumbnail{" "}
                <span className="text-[#9E988D] font-normal text-[10px] lowercase">
                  (optional)
                </span>
              </label>

              {imagePreview ? (
                <div className="relative group w-40 h-40 rounded-xl overflow-hidden border border-[#E8E2D5] bg-[#FAF8F5] shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Category Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs transition-colors shadow-md flex items-center gap-1 font-semibold"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#E8E2D5] hover:border-[#C5A059] rounded-xl bg-[#FAF8F5] cursor-pointer transition-all hover:bg-[#FAF8F5]/80">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <Upload className="w-7 h-7 text-[#8C6D2B] mb-2" />
                    <p className="text-xs text-[#1C1A17] font-semibold mb-1">
                      Click to upload category thumbnail
                    </p>
                    <p className="text-[10px] text-[#9E988D] font-medium">
                      PNG, JPG, WEBP up to 2MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Status */}
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
                <option value={1}>Active (Visible in Storefront)</option>
                <option value={0}>Inactive (Hidden)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5] flex items-center justify-end gap-4">
              <Link
                href="/admin/categories"
                className="px-6 py-3 rounded-xl border border-[#E8E2D5] text-[#1C1A17] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1C1A17] hover:bg-[#C5A059] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>{isSubmitting ? "Creating Category..." : "Add Category"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AddCategory() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading form...</div>}>
      <AddCategoryContent />
    </Suspense>
  );
}
