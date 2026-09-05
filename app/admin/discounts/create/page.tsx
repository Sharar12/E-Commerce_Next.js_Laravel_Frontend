"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Percent,
  X,
  Package,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  Sparkles,
} from "lucide-react";
import AdminLayout from "../../AdminLayout";
import { apiUrl, adminToken, safeParseJson, localBaseUrl } from "../../../common/http";

interface Product {
  id: number;
  name: string;
  sku: string;
  base_price: number;
  stock_quantity: number;
  status: string;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

interface Category {
  id: number;
  name: string;
}

export default function AddDiscountProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "sku">("name");

  // Modal State for adding discount to a product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [validFrom, setValidFrom] = useState<string>("");
  const [validTo, setValidTo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Image helper
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/storage/")) return `${localBaseUrl}${imageUrl}`;
    return `${localBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };

  // Fetch products & categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch(`${apiUrl}/products`, { headers: { Authorization: `Bearer ${adminToken()}` } }),
          fetch(`${apiUrl}/categories`, { headers: { Authorization: `Bearer ${adminToken()}` } }),
        ]);

        if (prodRes.ok) {
          const prodData = await safeParseJson(prodRes);
          setProducts(prodData.data || prodData || []);
        }
        if (catRes.ok) {
          const catData = await safeParseJson(catRes);
          setCategories(catData.data || catData || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter & Sort Products
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toString().includes(searchQuery);

      const matchCat =
        selectedCategory === "all" ||
        (p.category && p.category.id.toString() === selectedCategory);

      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "sku") return a.sku.localeCompare(b.sku);
      if (sortBy === "price_asc") return a.base_price - b.base_price;
      if (sortBy === "price_desc") return b.base_price - a.base_price;
      return 0;
    });

  // Open Modal
  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setDiscountType("percentage");
    setDiscountValue("");
    // Default valid dates: today to +14 days
    const today = new Date().toISOString().split("T")[0];
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setValidFrom(today);
    setValidTo(twoWeeks);
    setNotification(null);
  };

  // Close Modal
  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  // Submit Discount
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const numVal = Number(discountValue);
    if (!numVal || numVal <= 0) {
      setNotification({ type: "error", message: "Please enter a discount value greater than 0." });
      return;
    }
    if (discountType === "percentage" && numVal > 100) {
      setNotification({ type: "error", message: "Percentage discount cannot exceed 100%." });
      return;
    }
    if (!validFrom || !validTo) {
      setNotification({ type: "error", message: "Both Valid From and Valid To dates are required." });
      return;
    }

    try {
      setIsSubmitting(true);
      setNotification(null);

      const payload = {
        product_id: selectedProduct.id,
        category_id: null,
        discount_type: discountType,
        discount_value: numVal,
        valid_from: validFrom,
        valid_to: validTo,
      };

      const res = await fetch(`${apiUrl}/discounts`, {
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
        const msg = (data && (data.message || JSON.stringify(data.errors))) || "Failed to create discount.";
        setNotification({ type: "error", message: typeof msg === "string" ? msg : "Failed to create discount." });
        return;
      }

      setNotification({
        type: "success",
        message: `Discount successfully applied to "${selectedProduct.name}"!`,
      });

      setTimeout(() => {
        handleCloseModal();
        router.push("/admin/discounts");
      }, 1500);
    } catch (err) {
      console.error("Error creating discount:", err);
      setNotification({ type: "error", message: "Unexpected error creating discount." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D5]">
          <div>
            <Link
              href="/admin/discounts"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D2B] hover:text-[#1C1A17] transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Active Discounts
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Apply Product Discount
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Select a catalog artifact below to attach a promotional price discount.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B] self-start sm:self-auto">
            <Percent className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Product Catalog Selection</span>
          </div>
        </div>

        {/* Controls: Search, Filter & Sort */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, SKU, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium appearance-none"
              >
                <option value="all">All Departments / Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <ArrowUpDown className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium appearance-none"
              >
                <option value="name">Sort by: Product Name</option>
                <option value="sku">Sort by: SKU Code</option>
                <option value="price_asc">Sort by Price: Low to High</option>
                <option value="price_desc">Sort by Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product List Table */}
        {loading ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
              Loading Catalog Artifacts...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <Package className="w-10 h-10 text-[#C5A059] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-serif font-bold text-[#1C1A17]">No products found</p>
            <p className="text-xs text-[#6E685E] mt-1">Try adjusting your search criteria or category filter.</p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="p-4">Artwork</th>
                    <th className="p-4">SKU Code</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Base Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {filteredProducts.map((product) => {
                    const primaryImg =
                      product.images && product.images.length > 0
                        ? (product.images.find((img) => img.is_primary) || product.images[0]).image_url
                        : null;

                    return (
                      <tr key={product.id} className="hover:bg-[#FFFDF9] transition-colors">
                        {/* Thumbnail */}
                        <td className="p-4">
                          {primaryImg ? (
                            <div className="w-12 h-14 bg-[#EFECE6] rounded-lg overflow-hidden border border-[#E8E2D5]">
                              <img
                                src={getImageUrl(primaryImg)}
                                alt={product.name}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-14 bg-[#FAF8F5] rounded-lg flex items-center justify-center border border-[#E8E2D5]">
                              <Package className="w-5 h-5 text-[#9E988D]" />
                            </div>
                          )}
                        </td>

                        {/* SKU Code */}
                        <td className="p-4 font-mono font-semibold text-[#8C6D2B] text-xs">
                          {product.sku}
                        </td>

                        {/* Product Name */}
                        <td className="p-4 font-serif font-bold text-[#1C1A17] text-sm">
                          {product.name}
                        </td>

                        {/* Category */}
                        <td className="p-4 text-[#5A554C] font-medium">
                          {product.category?.name || "—"}
                        </td>

                        {/* Base Price */}
                        <td className="p-4 font-bold text-[#1C1A17]">
                          ${Number(product.base_price).toFixed(2)}
                        </td>

                        {/* Stock Quantity */}
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              product.stock_quantity > 10
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : product.stock_quantity > 0
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {product.stock_quantity} in stock
                          </span>
                        </td>

                        {/* Action Button */}
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(product)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Add Discount</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📌 POPUP MODAL FOR ADDING DISCOUNT */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
              
              {/* Modal Header */}
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="font-serif font-bold text-base text-[#1C1A17]">
                    Add Discount to Product
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateDiscount} className="p-6 space-y-5">
                
                {/* Target Product Summary Box */}
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[#E8E2D5] flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-[#8C6D2B]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-[#8C6D2B] font-semibold">{selectedProduct.sku}</p>
                    <h4 className="text-sm font-serif font-bold text-[#1C1A17] truncate">{selectedProduct.name}</h4>
                    <p className="text-xs text-[#6E685E] font-medium">Base Price: ${Number(selectedProduct.base_price).toFixed(2)}</p>
                  </div>
                </div>

                {/* Notification in Modal */}
                {notification && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      notification.type === "success"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    {notification.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{notification.message}</span>
                  </div>
                )}

                {/* Discount Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Currency Amount ($)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Discount Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={discountType === "percentage" ? "e.g. 15 for 15%" : "e.g. 20 for $20 off"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                    step="0.01"
                    min="0"
                    required
                  />
                  <p className="text-[11px] text-[#6E685E] mt-1 font-light">
                    {discountType === "percentage"
                      ? `Calculated Price: $${(
                          Number(selectedProduct.base_price) *
                          (1 - (Number(discountValue) || 0) / 100)
                        ).toFixed(2)}`
                      : `Calculated Price: $${Math.max(
                          0,
                          Number(selectedProduct.base_price) - (Number(discountValue) || 0)
                        ).toFixed(2)}`}
                  </p>
                </div>

                {/* Validity Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#8C6D2B]" /> Valid From
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-3 py-2 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#8C6D2B]" /> Valid To
                    </label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-3 py-2 text-xs text-[#1C1A17] focus:outline-none focus:border-[#C5A059]"
                      required
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-[#E8E2D5] text-xs font-bold uppercase tracking-wider text-[#6E685E] hover:bg-[#FAF8F5] transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Confirm & Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
