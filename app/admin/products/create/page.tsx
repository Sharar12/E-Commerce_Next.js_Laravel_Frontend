"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
  Calendar,
  Wand2,
  Barcode,
} from "lucide-react";
import { apiUrl, adminToken, safeParseJson } from "../../../common/http";
import AdminLayout from "../../AdminLayout";
import { ProductForm, Category, Brand, ImagePreview } from "./ProductForm";

export default function AddProduct() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({
    category_id: "",
    brand_id: "",
    name: "",
    sku: "",
    description: "",
    base_price: "",
    stock_quantity: "",
    weight: "",
    is_seasonal: false,
    seasonal_start_date: "",
    seasonal_end_date: "",
    status: "active",
  });

  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<{ id: number; name: string }[]>([]);
  const [variants, setVariants] = useState<
    {
      description: string;
      price_type: "same" | "custom";
      additional_price: string;
      stock_quantity: string;
      imageFile: File | null;
      imagePreview: string | null;
    }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 📌 Fetch categories & brands on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch(`${apiUrl}/categories`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${adminToken()}`,
          },
        });
        const catData = await safeParseJson(catRes);
        const catRaw = catData.data ?? catData;
        setCategories(Array.isArray(catRaw) ? catRaw : []);

        const brandRes = await fetch(`${apiUrl}/brands`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${adminToken()}`,
          },
        });
        const brandData = await safeParseJson(brandRes);
        const brandRaw = brandData.data ?? brandData;
        setBrands(Array.isArray(brandRaw) ? brandRaw : []);
      } catch (error) {
        console.error("Error fetching categories/brands:", error);
      }
    };
    fetchData();
  }, []);

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
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => {
      const v = prev[index];
      if (v?.imagePreview) {
        URL.revokeObjectURL(v.imagePreview);
      }
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
        if (value === "same") {
          updated[index].additional_price = "";
        }
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  const handleVariantImageChange = (index: number, file: File | null) => {
    setVariants((prev) => {
      const updated = [...prev];
      const currentPreview = updated[index].imagePreview;
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      if (file) {
        updated[index].imageFile = file;
        updated[index].imagePreview = URL.createObjectURL(file);
      } else {
        updated[index].imageFile = null;
        updated[index].imagePreview = null;
      }
      return updated;
    });
  };

  const [skuPrefix, setSkuPrefix] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("savedSkuPrefix") || "GLBX";
    }
    return "GLBX";
  });
  const [prefixSaved, setPrefixSaved] = useState<boolean>(false);

  const saveSkuPrefix = (prefix: string) => {
    const clean = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    setSkuPrefix(clean);
    if (typeof window !== "undefined") {
      localStorage.setItem("savedSkuPrefix", clean);
    }
    setPrefixSaved(true);
    setTimeout(() => setPrefixSaved(false), 2000);
  };

  // 📌 Auto-generate guaranteed unique SKU Code based on saved prefix + product name + timestamp salt
  const generateSKU = () => {
    const activePrefix = (skuPrefix || "GLBX").trim().toUpperCase();
    let nameCode = "";
    if (form.name && form.name.trim() !== "") {
      const words = form.name.trim().replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        nameCode = "-" + (words[0].substring(0, 3) + words[1].substring(0, 3)).toUpperCase();
      } else if (words.length === 1) {
        nameCode = "-" + words[0].substring(0, 4).toUpperCase();
      }
    }

    // High-entropy timestamp salt + random number ensures 100% uniqueness
    const timeSalt = Date.now().toString(36).slice(-4).toUpperCase();
    const randSalt = Math.floor(100 + Math.random() * 900).toString();
    const uniqueId = `${timeSalt}${randSalt}`;

    const generatedSku = `${activePrefix}${nameCode}-${uniqueId}`;
    setForm((prev) => ({ ...prev, sku: generatedSku }));
  };

  // 📌 Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, [imagePreviews]);

  // 📌 Handle input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const key = name as keyof ProductForm;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setForm({ ...form, [key]: target.checked });
    } else if (type === "number") {
      setForm({ ...form, [key]: value });
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
      }));

      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = "";
  };

  // 📌 Remove image from preview
  const removeImage = (id: string) => {
    setImagePreviews((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  // 📌 Move image up in the list
  const moveImageUp = (index: number) => {
    if (index === 0) return;
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      [newPreviews[index - 1], newPreviews[index]] = [
        newPreviews[index],
        newPreviews[index - 1],
      ];
      return newPreviews;
    });
  };

  // 📌 Move image down in the list
  const moveImageDown = (index: number) => {
    if (index === imagePreviews.length - 1) return;
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      [newPreviews[index], newPreviews[index + 1]] = [
        newPreviews[index + 1],
        newPreviews[index],
      ];
      return newPreviews;
    });
  };

  // 📌 Set image as primary (first in list)
  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      const [movedImage] = newPreviews.splice(index, 1);
      newPreviews.unshift(movedImage);
      return newPreviews;
    });
  };

  // 📌 Submit product with images in single request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const formData = new FormData();

      formData.append("category_id", form.category_id);
      formData.append("brand_id", form.brand_id);
      formData.append("name", form.name);
      formData.append("sku", form.sku);
      formData.append("description", form.description);
      formData.append("base_price", form.base_price ? form.base_price.toString() : "0");
      formData.append("stock_quantity", form.stock_quantity ? form.stock_quantity.toString() : "0");
      formData.append("weight", form.weight ? form.weight.toString() : "0");
      formData.append("is_seasonal", form.is_seasonal ? "1" : "0");
      formData.append("status", form.status);

      if (form.is_seasonal) {
        if (form.seasonal_start_date) {
          formData.append("seasonal_start_date", form.seasonal_start_date);
        }
        if (form.seasonal_end_date) {
          formData.append("seasonal_end_date", form.seasonal_end_date);
        }
      }

      imagePreviews.forEach((imagePreview) => {
        formData.append("images[]", imagePreview.file);
      });

      const res = await fetch(`${apiUrl}/products`, {
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
              : JSON.stringify(responseData.errors || "Failed to create product"),
        });
        return;
      }

      const createdProduct = responseData.data;

      // Save variants if any created
      if (createdProduct && createdProduct.id && variants.length > 0) {
        for (const v of variants) {
          if (v.description && v.description.trim() !== "") {
            const vFormData = new FormData();
            vFormData.append("product_id", createdProduct.id.toString());
            vFormData.append("color", v.description);
            vFormData.append(
              "additional_price",
              v.price_type === "custom" && v.additional_price ? v.additional_price : "0"
            );
            vFormData.append("stock_quantity", v.stock_quantity ? v.stock_quantity : "0");
            if (v.imageFile) {
              vFormData.append("image", v.imageFile);
            }

            await fetch(`${apiUrl}/product-variants`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${adminToken()}`,
              },
              body: vFormData,
            });
          }
        }
      }

      setNotification({
        type: "success",
        message: "Product & variants created successfully in atelier inventory!",
      });

      setForm({
        category_id: "",
        brand_id: "",
        name: "",
        sku: "",
        description: "",
        base_price: "",
        stock_quantity: "",
        weight: "",
        is_seasonal: false,
        seasonal_start_date: "",
        seasonal_end_date: "",
        status: "active",
      });

      imagePreviews.forEach((image) => URL.revokeObjectURL(image.preview));
      setImagePreviews([]);
      setVariants([]);

      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
    } catch (err) {
      console.error("Error creating product:", err);
      setNotification({
        type: "error",
        message: "Network error: Failed to connect to server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Add New Product
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Craft and register a new luxury artifact into the atelier inventory catalog.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Atelier Inventory</span>
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Product Specifications */}
            <div className="space-y-5">
              <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-[#8C6D2B]" /> Product Attributes
              </h2>

              {/* 3-Level Cascading Category Dropdowns */}
              <div className="space-y-4 p-4 bg-[#FAF8F5]/80 rounded-2xl border border-[#E8E2D5]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D2B] flex items-center gap-1.5 border-b border-[#E8E2D5] pb-2">
                  <Layers className="w-3.5 h-3.5 text-[#8C6D2B]" /> Category Hierarchy <span className="text-rose-500">*</span>
                </div>

                {/* Level 1: Parent Category */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5">
                    1. Parent Category (Level 1) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={(() => {
                      if (!form.category_id) return "";
                      const selectedId = Number(form.category_id);
                      // Check if selected is L1
                      const l1 = categories.find((c) => c.id === selectedId);
                      if (l1) return l1.id.toString();
                      // Check if selected is L2
                      for (const cat of categories) {
                        const l2 = (cat.children || []).find((s) => s.id === selectedId);
                        if (l2) return cat.id.toString();
                        // Check if selected is L3
                        for (const sub of cat.children || []) {
                          const l3 = (sub.children || []).find((ch) => ch.id === selectedId);
                          if (l3) return cat.id.toString();
                        }
                      }
                      return "";
                    })()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({ ...prev, category_id: val }));
                    }}
                    className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium shadow-inner"
                    required
                  >
                    <option value="">-- Select Parent Category (L1) --</option>
                    {categories
                      .filter((cat) => !cat.parent_id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Level 2: Sub-Category */}
                {(() => {
                  if (!form.category_id) return null;
                  const selectedId = Number(form.category_id);
                  let parentCat: Category | undefined;
                  let selectedSubId = "";

                  // Find parent L1 category
                  for (const cat of categories) {
                    if (cat.id === selectedId) {
                      parentCat = cat;
                      break;
                    }
                    const l2 = (cat.children || []).find((s) => s.id === selectedId);
                    if (l2) {
                      parentCat = cat;
                      selectedSubId = l2.id.toString();
                      break;
                    }
                    for (const sub of cat.children || []) {
                      const l3 = (sub.children || []).find((ch) => ch.id === selectedId);
                      if (l3) {
                        parentCat = cat;
                        selectedSubId = sub.id.toString();
                        break;
                      }
                    }
                  }

                  const subCategories = parentCat?.children || [];
                  if (subCategories.length === 0) return null;

                  return (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5">
                        2. Sub-Category (Level 2)
                      </label>
                      <select
                        value={selectedSubId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            category_id: val || (parentCat ? parentCat.id.toString() : ""),
                          }));
                        }}
                        className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium shadow-inner"
                      >
                        <option value="">-- Select Sub-Category (L2) Optional --</option>
                        {subCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* Level 3: Child Category */}
                {(() => {
                  if (!form.category_id) return null;
                  const selectedId = Number(form.category_id);
                  let subCat: Category | undefined;
                  let selectedChildId = "";

                  for (const cat of categories) {
                    for (const sub of cat.children || []) {
                      if (sub.id === selectedId) {
                        subCat = sub;
                        break;
                      }
                      const l3 = (sub.children || []).find((ch) => ch.id === selectedId);
                      if (l3) {
                        subCat = sub;
                        selectedChildId = l3.id.toString();
                        break;
                      }
                    }
                  }

                  const childCategories = subCat?.children || [];
                  if (childCategories.length === 0) return null;

                  return (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5">
                        3. Child Category (Level 3)
                      </label>
                      <select
                        value={selectedChildId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            category_id: val || (subCat ? subCat.id.toString() : ""),
                          }));
                        }}
                        className="w-full bg-white border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium shadow-inner"
                      >
                        <option value="">-- Select Child Category (L3) Optional --</option>
                        {childCategories.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>

              {/* Brand Dropdown */}
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
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
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

              {/* SKU Code */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-[#8C6D2B]" /> SKU Code <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {/* Customizable Saved Prefix */}
                    <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg px-2 py-1 shadow-sm">
                      <span className="text-[10px] font-bold text-[#8C6D2B] uppercase">Prefix:</span>
                      <input
                        type="text"
                        value={skuPrefix}
                        onChange={(e) => saveSkuPrefix(e.target.value)}
                        placeholder="GLBX"
                        className="w-14 bg-transparent text-xs font-mono font-bold text-[#1C1A17] focus:outline-none uppercase"
                        maxLength={10}
                        title="Customize 1st Prefix (Saved automatically)"
                      />
                      {prefixSaved && (
                        <span className="text-[9px] text-emerald-600 font-bold animate-pulse">Saved</span>
                      )}
                    </div>

                    {/* Auto Generate Button */}
                    <button
                      type="button"
                      onClick={generateSKU}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] bg-[#FAF8F5] hover:bg-[#E8E2D5] border border-[#E8E2D5] px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <Wand2 className="w-3 h-3 text-[#C5A059]" />
                      <span>Auto Generate</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    name="sku"
                    placeholder="e.g. GLBX-RYLTRB-X92A15"
                    value={form.sku}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] placeholder-[#9E988D] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6D2B] hover:text-[#1C1A17] p-1 transition-colors cursor-pointer"
                    title="Auto Generate Unique SKU"
                  >
                    <Wand2 className="w-4 h-4 text-[#C5A059]" />
                  </button>
                </div>
                <p className="text-[10px] text-[#6E685E] font-light">
                  Uses saved prefix <strong className="font-mono text-[#8C6D2B]">{skuPrefix || "GLBX"}</strong> with timestamp salt for 100% guaranteed uniqueness.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" /> Description
                </label>
                <textarea
                  name="description"
                  placeholder="Crafted with handcrafted precision..."
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  placeholder="0.000"
                  value={form.weight}
                  onChange={handleChange}
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-mono font-medium"
                  step="0.001"
                  min="0"
                />
              </div>

              {/* Product Variations / Options Section */}
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
                            Variation Option #{idx + 1}
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
                              placeholder="e.g. 128GB Black, 256GB Gold, Large / Red"
                              value={v.description}
                              onChange={(e) => handleVariantChange(idx, "description", e.target.value)}
                              className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-lg px-3 py-2 text-xs text-[#1C1A17] font-medium"
                              required
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

                          {/* Extra Price field (only visible if Custom is selected) */}
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

                        {/* Stock Qty & Thumbnail Upload */}
                        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-t border-gray-100">
                          {/* Variant Thumbnail File Upload */}
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
                                  {v.imageFile?.name}
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
                  <option value="active">Active (Visible in Atelier)</option>
                  <option value="inactive">Inactive (Vaulted)</option>
                </select>
              </div>
            </div>

            {/* Right Column - Media & Submissions */}
            <div className="space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <h2 className="text-sm font-serif font-bold text-[#1C1A17] uppercase tracking-wider pb-2 border-b border-[#E8E2D5] flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#8C6D2B]" /> Media & Imagery
                </h2>

                {/* Upload Zone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Product Media Upload
                  </label>
                  <div className="border-2 border-dashed border-[#C5A059]/40 bg-[#FAF8F5] hover:bg-white rounded-2xl p-6 text-center transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept="image/jpg,image/jpeg,image/png,image/webp"
                    />
                    <UploadCloud className="w-8 h-8 text-[#8C6D2B] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1C1A17] block">
                      Click or drag images to upload
                    </span>
                    <span className="text-[10px] text-[#6E685E] font-light mt-1 block">
                      JPG, PNG, WEBP max 2MB. The first image will be assigned as primary.
                    </span>
                  </div>
                </div>

                {/* Image Previews List */}
                {imagePreviews.length > 0 && (
                  <div className="border border-[#E8E2D5] bg-[#FAF8F5] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1C1A17]">
                        Selected Imagery ({imagePreviews.length})
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ★ First image is Primary
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {imagePreviews.map((image, index) => (
                        <div
                          key={image.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            index === 0
                              ? "border-[#C5A059] bg-white shadow-sm"
                              : "border-[#E8E2D5] bg-white/60"
                          }`}
                        >
                          <div className="w-14 h-14 rounded-lg border border-[#E8E2D5] overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#1C1A17] truncate">
                              {image.file.name}
                            </p>
                            <p className="text-[10px] text-[#6E685E]">
                              {(image.file.size / 1024).toFixed(1)} KB
                            </p>
                            {index === 0 && (
                              <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#1C1A17] text-[#D4AF37] rounded-full mt-1">
                                Atelier Primary
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => setAsPrimary(index)}
                                className="p-1.5 rounded-lg bg-[#FAF8F5] text-[#8C6D2B] hover:bg-[#1C1A17] hover:text-[#D4AF37] transition-all"
                                title="Set as primary"
                              >
                                <Star className="w-3.5 h-3.5 fill-[#C5A059]" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg bg-[#FAF8F5] text-[#1C1A17] hover:bg-[#E8E2D5] disabled:opacity-30 transition-all"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              disabled={index === imagePreviews.length - 1}
                              className="p-1.5 rounded-lg bg-[#FAF8F5] text-[#1C1A17] hover:bg-[#E8E2D5] disabled:opacity-30 transition-all"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E8E2D5] flex items-center justify-end gap-4">
                <Link
                  href="/admin/products"
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
                  <span>{isSubmitting ? "Registering Product..." : "Add Product"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}