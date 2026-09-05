"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PackageCheck,
  PackagePlus,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Star,
  ArrowUp,
  ArrowDown,
  Trash2,
  Tag,
  DollarSign,
  Box,
  Layers,
  FileText,
  Barcode,
} from "lucide-react";
import { apiUrl, adminToken, safeParseJson } from "../../../../common/http";
import AdminLayout from "../../../AdminLayout";

interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  children?: Category[];
}

interface Brand {
  id: number;
  name: string;
}

interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface ProductVariantData {
  id: number;
  product_id: number;
  color: string;
  image?: string;
  additional_price: number;
  stock_quantity: number;
}

interface Product {
  id: number;
  category_id: string;
  brand_id: string;
  name: string;
  sku: string;
  description: string;
  base_price: number;
  stock_quantity: number;
  weight: number;
  status: "active" | "inactive";
  images: ProductImage[];
}

interface ProductForm {
  category_id: string;
  brand_id: string;
  name: string;
  sku: string;
  description: string;
  base_price: number | string;
  stock_quantity: number | string;
  weight: number | string;
  status: "active" | "inactive";
}

interface ImagePreview {
  file?: File;
  preview: string;
  id: string;
  isExisting?: boolean;
  existingId?: number;
}

interface VariantRow {
  id?: number; // existing variant id for updates
  description: string;
  price_type: "same" | "custom";
  additional_price: string;
  stock_quantity: string;
  imageFile: File | null;
  imagePreview: string | null;
  isExisting?: boolean;
}

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [form, setForm] = useState<ProductForm>({
    category_id: "",
    brand_id: "",
    name: "",
    sku: "",
    description: "",
    base_price: "",
    stock_quantity: "",
    weight: "",
    status: "active",
  });

  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantsToDelete, setVariantsToDelete] = useState<number[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Helper function to build image preview URL
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    const laravelBaseUrl = process.env.NEXT_PUBLIC_LARAVEL_URL || "http://localhost:8000";
    if (imageUrl.startsWith("/storage/")) {
      const cleanPath = imageUrl.replace("/storage/", "");
      return `${laravelBaseUrl}/storage/${cleanPath}`;
    }
    return `${laravelBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };

  // 📌 Fetch product data, categories, brands & existing variants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const productRes = await fetch(`${apiUrl}/products/${productId}`, {
          headers: { Authorization: `Bearer ${adminToken()}` },
        });

        if (!productRes.ok) throw new Error("Product not found");

        const productData = await safeParseJson(productRes);
        const product: Product = productData.data;

        setForm({
          category_id: product.category_id.toString(),
          brand_id: product.brand_id.toString(),
          name: product.name,
          sku: product.sku,
          description: product.description || "",
          base_price: product.base_price,
          stock_quantity: product.stock_quantity,
          weight: product.weight || "",
          status: product.status,
        });

        const sortedImages = [...(product.images || [])].sort(
          (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
        );
        const existingImagePreviews: ImagePreview[] = sortedImages.map((img) => ({
          preview: getImageUrl(img.image_url),
          id: `existing-${img.id}`,
          isExisting: true,
          existingId: img.id,
        }));
        setImagePreviews(existingImagePreviews);

        const catRes = await fetch(`${apiUrl}/categories`, {
          headers: { Authorization: `Bearer ${adminToken()}` },
        });
        const catData = await safeParseJson(catRes);
        const catRaw = catData.data ?? catData;
        setCategories(Array.isArray(catRaw) ? catRaw : []);

        const brandRes = await fetch(`${apiUrl}/brands`, {
          headers: { Authorization: `Bearer ${adminToken()}` },
        });
        const brandData = await safeParseJson(brandRes);
        const brandRaw = brandData.data ?? brandData;
        setBrands(Array.isArray(brandRaw) ? brandRaw : []);

        // Fetch existing variants for this product
        const variantRes = await fetch(`${apiUrl}/product-variants`, {
          headers: { Authorization: `Bearer ${adminToken()}` },
        });
        const variantData = await safeParseJson(variantRes);
        const allVariants: ProductVariantData[] = Array.isArray(variantData.data)
          ? variantData.data
          : Array.isArray(variantData)
          ? variantData
          : [];
        const productVariants = allVariants.filter((v) => v.product_id === Number(productId));

        setVariants(
          productVariants.map((v) => ({
            id: v.id,
            description: v.color || "",
            price_type: v.additional_price > 0 ? "custom" : "same",
            additional_price: v.additional_price > 0 ? String(v.additional_price) : "",
            stock_quantity: String(v.stock_quantity),
            imageFile: null,
            imagePreview: v.image ? getImageUrl(v.image) : null,
            isExisting: true,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setNotification({ type: "error", message: "Failed to load product details." });
        setTimeout(() => router.push("/admin/products"), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) fetchData();
  }, [productId, router]);

  // 📌 Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => {
        if (!image.isExisting) URL.revokeObjectURL(image.preview);
      });
      variants.forEach((v) => {
        if (v.imagePreview && v.imageFile) URL.revokeObjectURL(v.imagePreview);
      });
    };
  }, [imagePreviews, variants]);

  // 📌 Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const key = name as keyof ProductForm;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setForm({ ...form, [key]: target.checked });
    } else {
      setForm({ ...form, [key]: value });
    }
  };

  // 📌 Handle image uploads with preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPreviews: ImagePreview[] = newFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
        isExisting: false,
      }));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = "";
  };

  const removeImage = (id: string, isExisting?: boolean, existingId?: number) => {
    if (isExisting && existingId) {
      setImagesToDelete((prev) => [...prev, existingId]);
    }
    setImagePreviews((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove && !imageToRemove.isExisting) URL.revokeObjectURL(imageToRemove.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    setImagePreviews((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveImageDown = (index: number) => {
    if (index === imagePreviews.length - 1) return;
    setImagePreviews((prev) => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    setImagePreviews((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(index, 1);
      arr.unshift(moved);
      return arr;
    });
  };

  // 📌 Variant helpers
  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        description: "",
        price_type: "same",
        additional_price: "",
        stock_quantity: "",
        imageFile: null,
        imagePreview: null,
        isExisting: false,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => {
      const v = prev[index];
      if (v?.id) setVariantsToDelete((d) => [...d, v.id!]);
      if (v?.imagePreview && v?.imageFile) URL.revokeObjectURL(v.imagePreview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVariantChange = (
    index: number,
    field: "description" | "price_type" | "additional_price" | "stock_quantity",
    value: string
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      if (field === "price_type") {
        updated[index].price_type = value as "same" | "custom";
        if (value === "same") updated[index].additional_price = "";
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  const handleVariantImageChange = (index: number, file: File | null) => {
    setVariants((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (current.imagePreview && current.imageFile) URL.revokeObjectURL(current.imagePreview);
      if (file) {
        updated[index].imageFile = file;
        updated[index].imagePreview = URL.createObjectURL(file);
      } else {
        updated[index].imageFile = null;
        updated[index].imagePreview = current.isExisting ? current.imagePreview : null;
      }
      return updated;
    });
  };

  // 📌 Submit product update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("category_id", form.category_id);
      formData.append("brand_id", form.brand_id);
      formData.append("name", form.name);
      formData.append("sku", form.sku);
      formData.append("description", form.description);
      formData.append("base_price", form.base_price ? form.base_price.toString() : "0");
      formData.append("stock_quantity", form.stock_quantity ? form.stock_quantity.toString() : "0");
      formData.append("weight", form.weight ? form.weight.toString() : "0");
      formData.append("status", form.status);

      const primaryImage = imagePreviews[0];
      if (primaryImage && primaryImage.isExisting && primaryImage.existingId) {
        formData.append("primary_image_id", primaryImage.existingId.toString());
      }

      const newImages = imagePreviews.filter((img) => !img.isExisting);
      newImages.forEach((imagePreview) => {
        if (imagePreview.file) formData.append("images[]", imagePreview.file);
      });

      imagesToDelete.forEach((id) => {
        formData.append("images_to_delete[]", id.toString());
      });

      const res = await fetch(`${apiUrl}/products/${productId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken()}`,
          Accept: "application/json",
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
              : JSON.stringify(responseData.errors || "Failed to update product"),
        });
        return;
      }

      // Delete removed variants
      for (const vid of variantsToDelete) {
        await fetch(`${apiUrl}/product-variants/${vid}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken()}` },
        });
      }

      // Save/update variants
      for (const v of variants) {
        if (!v.description || v.description.trim() === "") continue;
        const vFormData = new FormData();
        vFormData.append("product_id", productId);
        vFormData.append("color", v.description);
        vFormData.append(
          "additional_price",
          v.price_type === "custom" && v.additional_price ? v.additional_price : "0"
        );
        vFormData.append("stock_quantity", v.stock_quantity || "0");
        if (v.imageFile) vFormData.append("image", v.imageFile);

        if (v.id) {
          // Update existing variant
          vFormData.append("_method", "PUT");
          await fetch(`${apiUrl}/product-variants/${v.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${adminToken()}` },
            body: vFormData,
          });
        } else {
          // Create new variant
          await fetch(`${apiUrl}/product-variants`, {
            method: "POST",
            headers: { Authorization: `Bearer ${adminToken()}` },
            body: vFormData,
          });
        }
      }

      setNotification({
        type: "success",
        message: "Product & variants updated successfully!",
      });

      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err) {
      console.error("Error updating product:", err);
      setNotification({ type: "error", message: "Network error: Failed to connect to server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 sm:p-10 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-serif text-[#6E685E]">Loading product details...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Product Inventory
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Edit Product
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Modify product specifications, variations, and media assets.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <PackageCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>ID #{productId}</span>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ── Left Column ── */}
            <div className="space-y-5">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8C6D2B]" /> Product Attributes
              </h2>

              {/* 3-Level Cascading Category Dropdowns */}
              <div className="space-y-4 p-4 bg-[#FAF8F5]/80 rounded-2xl border border-[#E8E2D5]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B] flex items-center gap-1.5 border-b border-[#E8E2D5] pb-2">
                  <Layers className="w-3.5 h-3.5 text-[#8C6D2B]" /> Category Hierarchy <span className="text-rose-500">*</span>
                </div>

                {/* L1 */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5">
                    1. Parent Category (Level 1) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={(() => {
                      if (!form.category_id) return "";
                      const sid = Number(form.category_id);
                      const l1 = categories.find((c) => c.id === sid);
                      if (l1) return l1.id.toString();
                      for (const cat of categories) {
                        if ((cat.children || []).find((s) => s.id === sid)) return cat.id.toString();
                        for (const sub of cat.children || []) {
                          if ((sub.children || []).find((ch) => ch.id === sid)) return cat.id.toString();
                        }
                      }
                      return "";
                    })()}
                    onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                    className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium shadow-inner"
                    required
                  >
                    <option value="">-- Select Parent Category (L1) --</option>
                    {categories.filter((c) => !c.parent_id).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* L2 */}
                {(() => {
                  if (!form.category_id) return null;
                  const sid = Number(form.category_id);
                  let parentCat: Category | undefined;
                  let selectedSubId = "";
                  for (const cat of categories) {
                    if (cat.id === sid) { parentCat = cat; break; }
                    const l2 = (cat.children || []).find((s) => s.id === sid);
                    if (l2) { parentCat = cat; selectedSubId = l2.id.toString(); break; }
                    for (const sub of cat.children || []) {
                      const l3 = (sub.children || []).find((ch) => ch.id === sid);
                      if (l3) { parentCat = cat; selectedSubId = sub.id.toString(); break; }
                    }
                  }
                  const subs = parentCat?.children || [];
                  if (subs.length === 0) return null;
                  return (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5">
                        2. Sub-Category (Level 2)
                      </label>
                      <select
                        value={selectedSubId}
                        onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value || (parentCat ? parentCat.id.toString() : "") }))}
                        className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium shadow-inner"
                      >
                        <option value="">-- Select Sub-Category (L2) Optional --</option>
                        {subs.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                      </select>
                    </div>
                  );
                })()}

                {/* L3 */}
                {(() => {
                  if (!form.category_id) return null;
                  const sid = Number(form.category_id);
                  let subCat: Category | undefined;
                  let selectedChildId = "";
                  for (const cat of categories) {
                    for (const sub of cat.children || []) {
                      if (sub.id === sid) { subCat = sub; break; }
                      const l3 = (sub.children || []).find((ch) => ch.id === sid);
                      if (l3) { subCat = sub; selectedChildId = l3.id.toString(); break; }
                    }
                  }
                  const children = subCat?.children || [];
                  if (children.length === 0) return null;
                  return (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5">
                        3. Child Category (Level 3)
                      </label>
                      <select
                        value={selectedChildId}
                        onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value || (subCat ? subCat.id.toString() : "") }))}
                        className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium shadow-inner"
                      >
                        <option value="">-- Select Child Category (L3) Optional --</option>
                        {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                      </select>
                    </div>
                  );
                })()}
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#8C6D2B]" /> Brand <span className="text-rose-500">*</span>
                </label>
                <select
                  name="brand_id"
                  value={form.brand_id}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  required
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  placeholder="e.g. Royal Tourbillon Chrono"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder-[#9E988D] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  required
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-[#8C6D2B]" /> SKU Code <span className="text-rose-500">*</span>
                </label>
                <input
                  name="sku"
                  placeholder="e.g. GLBX-RYLTRB-X92A15"
                  value={form.sku}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder-[#9E988D] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" /> Description
                </label>
                <textarea
                  name="description"
                  placeholder="Crafted with precision..."
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder-[#9E988D] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium resize-none"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#8C6D2B]" /> Base Price (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    placeholder="0.00"
                    value={form.base_price}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5 text-[#8C6D2B]" /> Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    placeholder="0"
                    value={form.stock_quantity}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-[#8C6D2B]" /> Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  placeholder="0.000"
                  value={form.weight}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  step="0.001"
                  min="0"
                />
              </div>

              {/* Product Variations & Options */}
              <div className="space-y-4 p-4 bg-[#FAF8F5]/80 rounded-2xl border border-[#E8E2D5]">
                <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8C6D2B]" /> Product Variations & Options
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="px-3 py-1.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3 text-[#D4AF37]" />
                    <span>Add Variation</span>
                  </button>
                </div>

                {variants.length === 0 ? (
                  <p className="text-xs text-[#6E685E] font-light text-center py-2">
                    No variation options added yet. Click <strong className="text-[#1C1A17]">+ Add Variation</strong> to configure variant options.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-[#E8E2D5] rounded-xl space-y-2.5 relative shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#8C6D2B] uppercase">
                            Variation Option #{idx + 1} {v.isExisting && <span className="text-emerald-600 ml-1">(Saved)</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVariantRow(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold transition-colors p-1"
                            title="Remove Variation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Description */}
                          <div className="md:col-span-5">
                            <label className="block text-[10px] font-bold text-[#5A554C] uppercase mb-1">
                              Description / Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 128GB Black, XL / Red"
                              value={v.description}
                              onChange={(e) => handleVariantChange(idx, "description", e.target.value)}
                              className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg px-3 py-2 text-xs text-[#1C1A17] font-medium"
                            />
                          </div>

                          {/* Price Option */}
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-[#5A554C] uppercase mb-1">
                              Price Option
                            </label>
                            <select
                              value={v.price_type}
                              onChange={(e) => handleVariantChange(idx, "price_type", e.target.value)}
                              className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg px-2.5 py-2 text-xs text-[#1C1A17] font-medium"
                            >
                              <option value="same">Same as Base Price</option>
                              <option value="custom">Custom Additional Price (+৳)</option>
                            </select>
                          </div>

                          {/* Extra Price */}
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-[#5A554C] uppercase mb-1">
                              {v.price_type === "custom" ? "Extra Price (+৳)" : "Extra Price"}
                            </label>
                            <input
                              type="number"
                              placeholder={v.price_type === "same" ? "0 (Same)" : "e.g. 500"}
                              value={v.additional_price}
                              onChange={(e) => handleVariantChange(idx, "additional_price", e.target.value)}
                              disabled={v.price_type === "same"}
                              className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg px-2.5 py-2 text-xs text-[#1C1A17] font-mono disabled:opacity-50 disabled:bg-gray-100"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>

                        {/* Thumbnail & Stock */}
                        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-t border-gray-100">
                          {/* Thumbnail */}
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-[#5A554C] uppercase flex items-center gap-1">
                              <UploadCloud className="w-3 h-3 text-[#8C6D2B]" /> Thumbnail:
                            </label>
                            {v.imagePreview ? (
                              <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg px-2 py-1">
                                <img
                                  src={v.imagePreview}
                                  alt="Variant thumbnail"
                                  className="w-7 h-7 object-cover rounded border border-[#E8E2D5]"
                                />
                                <span className="text-[10px] font-semibold text-[#1C1A17] truncate max-w-[100px]">
                                  {v.imageFile?.name || "Existing"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleVariantImageChange(idx, null)}
                                  className="text-rose-500 hover:text-rose-700 text-[10px] font-bold ml-1"
                                  title="Remove image"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 border border-[#E8E2D5] rounded-lg text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] transition-all inline-flex items-center gap-1">
                                <span>Upload Image</span>
                                <input
                                  type="file"
                                  accept="image/jpg,image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleVariantImageChange(idx, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          {/* Stock */}
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <label className="text-[10px] font-bold text-[#5A554C] uppercase">
                              Stock Qty:
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={v.stock_quantity}
                              onChange={(e) => handleVariantChange(idx, "stock_quantity", e.target.value)}
                              className="w-24 bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg px-2.5 py-1 text-xs text-[#1C1A17] font-mono text-right"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                  Visibility Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                >
                  <option value="active">Active (Visible in Catalog)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            {/* ── Right Column – Image Management ── */}
            <div className="space-y-5">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#8C6D2B]" /> Media Gallery & Order
              </h2>

              {/* Upload Drop Zone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                  Upload Product Imagery
                </label>
                <div className="relative border-2 border-dashed border-[#D4AF37]/40 hover:border-[#C5A059] bg-[#FAF8F5] hover:bg-[#F7F4EE] transition-all rounded-xl p-6 text-center cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/jpg,image/jpeg,image/png,image/webp"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8E2D5] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-5 h-5 text-[#8C6D2B]" />
                    </div>
                    <p className="text-xs font-bold text-[#1C1A17] tracking-wide">
                      Click to upload or drag files here
                    </p>
                    <p className="text-[11px] text-[#6E685E] font-light">
                      Supports JPG, PNG, WEBP. The first image will serve as primary showcase image.
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="border border-[#E8E2D5] rounded-xl p-4 bg-[#FAF8F5] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A17] flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#C5A059]" /> Gallery Assets ({imagePreviews.length})
                    </h3>
                    <span className="text-[11px] text-[#8C6D2B] font-semibold">⭐ Top = Primary</span>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {imagePreviews.map((image, index) => (
                      <div
                        key={image.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          index === 0
                            ? "border-[#C5A059] bg-white shadow-md ring-1 ring-[#C5A059]/30"
                            : "border-[#E8E2D5] bg-white hover:border-[#D4AF37]/50"
                        }`}
                      >
                        <div className="relative flex-shrink-0 w-16 h-16 border border-[#E8E2D5] rounded-lg overflow-hidden bg-[#FAF8F5]">
                          <img
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1 left-1 bg-[#1C1A17] text-[#D4AF37] text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1C1A17] truncate">
                            {image.file ? image.file.name : `Catalog Image #${index + 1}`}
                          </p>
                          <p className="text-[11px] text-[#6E685E] font-light">
                            {image.isExisting ? "Existing server asset" : `${((image.file?.size || 0) / 1024).toFixed(1)} KB`}
                          </p>
                          <div className="flex gap-1.5 mt-1">
                            {index === 0 ? (
                              <span className="inline-block px-2 py-0.5 text-[10px] bg-[#D4AF37]/15 text-[#8C6D2B] font-bold rounded-md">
                                Primary
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-[10px] bg-[#E8E2D5]/50 text-[#6E685E] font-medium rounded-md">
                                Gallery
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => setAsPrimary(index)}
                              className="px-2 py-1 text-[11px] font-semibold bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E8E2D5] text-[#8C6D2B] rounded-lg transition-colors flex items-center justify-center gap-1"
                              title="Make showcase primary image"
                            >
                              <Star className="w-3 h-3 text-[#C5A059]" /> Primary
                            </button>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              className="p-1 text-xs bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E8E2D5] text-[#1C1A17] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              disabled={index === imagePreviews.length - 1}
                              className="p-1 text-xs bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E8E2D5] text-[#1C1A17] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(image.id, image.isExisting, image.existingId)}
                              className="p-1 text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-colors ml-auto"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      <span>Updating Product...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4 text-[#D4AF37]" />
                      <span>Update Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}