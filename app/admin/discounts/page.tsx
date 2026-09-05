"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Percent,
  X,
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  Sparkles,
  Trash2,
  Eye,
  Info,
  BadgePercent,
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import { apiUrl, adminToken, safeParseJson, localBaseUrl } from "../../common/http";

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

export interface Discount {
  id: number;
  product_id: number | null;
  category_id: number | null;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  valid_from: string;
  valid_to: string;
  product?: Product;
}

export default function DiscountsMainPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort for Catalog
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "sku" | "discount_asc" | "discount_desc">("name");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State for adding discount to a product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [validFrom, setValidFrom] = useState<string>("");
  const [validTo, setValidTo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State for viewing active discount details
  const [viewDetailsProduct, setViewDetailsProduct] = useState<{ product: Product; discount: Discount } | null>(null);

  // Image helper
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/storage/")) return `${localBaseUrl}${imageUrl}`;
    return `${localBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };

  // Fetch products, categories & existing discounts
  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, discRes] = await Promise.all([
        fetch(`${apiUrl}/products`, { headers: { Authorization: `Bearer ${adminToken()}` } }),
        fetch(`${apiUrl}/categories`, { headers: { Authorization: `Bearer ${adminToken()}` } }),
        fetch(`${apiUrl}/discounts`, { headers: { Authorization: `Bearer ${adminToken()}` } }),
      ]);

      if (prodRes.ok) {
        const prodData = await safeParseJson(prodRes);
        setProducts(prodData.data || prodData || []);
      }
      if (catRes.ok) {
        const catData = await safeParseJson(catRes);
        setCategories(catData.data || catData || []);
      }
      if (discRes.ok) {
        const discData = await safeParseJson(discRes);
        setDiscounts(discData.data || discData || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if a product or its category has a discount
  const getActiveDiscountForProduct = (product: Product): Discount | null => {
    // Check direct product discount
    const productDisc = discounts.find(
      (d) => d.product_id && Number(d.product_id) === Number(product.id)
    );
    if (productDisc) return productDisc;

    // Check category discount
    if (product.category?.id) {
      const catDisc = discounts.find(
        (d) => d.category_id && Number(d.category_id) === Number(product.category?.id)
      );
      if (catDisc) return catDisc;
    }

    return null;
  };

  // Helper to compute effective percentage discount for sorting (handles both % and fixed cut prices)
  const getDiscountValueForSort = (product: Product): number => {
    const disc = getActiveDiscountForProduct(product);
    if (!disc) return 0;
    const num = Number(disc.discount_value) || 0;
    if (disc.discount_type === "percentage") {
      return num;
    }
    // For fixed cut prices, calculate equivalent percentage: (cut_amount / base_price) * 100
    const base = Number(product.base_price) || 0;
    if (base <= 0) return 0;
    return (num / base) * 100;
  };

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
      if (sortBy === "discount_desc") return getDiscountValueForSort(b) - getDiscountValueForSort(a);
      if (sortBy === "discount_asc") return getDiscountValueForSort(a) - getDiscountValueForSort(b);
      return 0;
    });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  // State for active discount being edited (if product already has one)
  const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);

  // Open Modal for adding or editing discount
  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    const existingDisc = getActiveDiscountForProduct(product);

    if (existingDisc) {
      setEditingDiscountId(existingDisc.id);
      setDiscountType(existingDisc.discount_type);
      setDiscountValue(Number(existingDisc.discount_value));
      setValidFrom(existingDisc.valid_from ? existingDisc.valid_from.split("T")[0] : "");
      setValidTo(existingDisc.valid_to ? existingDisc.valid_to.split("T")[0] : "");
    } else {
      setEditingDiscountId(null);
      setDiscountType("percentage");
      setDiscountValue("");
      const today = new Date().toISOString().split("T")[0];
      const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setValidFrom(today);
      setValidTo(twoWeeks);
    }
    setNotification(null);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setEditingDiscountId(null);
  };

  // Submit Discount Creation or Edit Update
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

      const isEdit = !!editingDiscountId;
      const targetUrl = isEdit ? `${apiUrl}/discounts/${editingDiscountId}` : `${apiUrl}/discounts`;
      const targetMethod = isEdit ? "PUT" : "POST";

      const res = await fetch(targetUrl, {
        method: targetMethod,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        const msg = (data && (data.message || JSON.stringify(data.errors))) || "Failed to save discount.";
        setNotification({ type: "error", message: typeof msg === "string" ? msg : "Failed to save discount." });
        return;
      }

      setNotification({
        type: "success",
        message: isEdit
          ? `Discount updated successfully for "${selectedProduct.name}"!`
          : `Discount successfully applied to "${selectedProduct.name}"!`,
      });

      await fetchData();

      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err) {
      console.error("Error saving discount:", err);
      setNotification({ type: "error", message: "Unexpected error saving discount." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Discount inside View Details modal
  const handleDeleteDiscount = async (id: number) => {
    if (!confirm("Are you sure you want to remove this active discount?")) return;
    try {
      const res = await fetch(`${apiUrl}/discounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      if (res.ok) {
        setDiscounts((prev) => prev.filter((d) => d.id !== id));
        setViewDetailsProduct(null);
      } else {
        alert("Failed to delete discount.");
      }
    } catch (err) {
      console.error("Error deleting discount:", err);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Promotions & Pricing Incentives
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Discounts Management
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Manage product pricing discounts, inspect active discount details, or attach new promotional discounts.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/30 shadow-sm text-xs font-bold uppercase tracking-wider text-[#8C6D2B]">
            <BadgePercent className="w-4 h-4 text-[#C5A059]" />
            <span>Catalog Discounts</span>
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
                <option value="discount_desc">Sort by Discount: High to Low</option>
                <option value="discount_asc">Sort by Discount: Low to High</option>
                <option value="name">Sort by: Product Name</option>
                <option value="sku">Sort by: SKU Code</option>
                <option value="price_asc">Sort by Price: Low to High</option>
                <option value="price_desc">Sort by Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Catalog Table with Discount Active Column */}
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
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredProducts.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="discount products"
            />
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
                    <th className="p-4">Discount Active</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedProducts.map((product) => {
                    const primaryImg =
                      product.images && product.images.length > 0
                        ? (product.images.find((img) => img.is_primary) || product.images[0]).image_url
                        : null;

                    const activeDiscount = getActiveDiscountForProduct(product);

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
                          ৳{Math.round(Number(product.base_price))}
                        </td>

                        {/* Discount Active Column */}
                        <td className="p-4">
                          {activeDiscount ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {activeDiscount.discount_type === "percentage"
                                  ? `${activeDiscount.discount_value}% OFF`
                                  : `৳${Math.round(Number(activeDiscount.discount_value))} OFF`}
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewDetailsProduct({ product, discount: activeDiscount })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-[#E8E2D5] bg-[#FAF8F5] text-[#8C6D2B] hover:bg-[#F2ECE1] transition-colors"
                              >
                                <Eye className="w-3 h-3 text-[#C5A059]" /> View Details
                              </button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                              No Active Discount
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(product)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm ${
                                activeDiscount
                                  ? "bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E8E2D5] text-[#8C6D2B]"
                                  : "bg-[#1C1A17] hover:bg-[#C5A059] text-white"
                              }`}
                            >
                              {activeDiscount ? (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>Edit Discount</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>Add Discount</span>
                                </>
                              )}
                            </button>

                            {activeDiscount && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDiscount(activeDiscount.id)}
                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-sm"
                                title="Remove Active Discount"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
          </div>
        )}

        {/* 📌 POPUP MODAL 1: VIEW DISCOUNT DETAILS */}
        {viewDetailsProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
              {/* Modal Header */}
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="font-serif font-bold text-base text-[#1C1A17]">
                    Active Discount Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDetailsProduct(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5">
                {/* Product Summary */}
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-[#E8E2D5] flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-[#8C6D2B]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-[#8C6D2B] font-semibold">{viewDetailsProduct.product.sku}</p>
                    <h4 className="text-sm font-serif font-bold text-[#1C1A17] truncate">{viewDetailsProduct.product.name}</h4>
                    <p className="text-xs text-[#6E685E] font-medium">Base Price: ৳{Math.round(Number(viewDetailsProduct.product.base_price))}</p>
                  </div>
                </div>

                {/* Detailed Spec List */}
                <div className="text-xs divide-y divide-[#E8E2D5] bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex justify-between pb-2">
                    <span className="text-[#6E685E] font-medium">Discount Promotion ID</span>
                    <span className="font-mono font-bold text-[#8C6D2B]">#{viewDetailsProduct.discount.id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Discount Type</span>
                    <span className="font-bold capitalize text-[#1C1A17]">{viewDetailsProduct.discount.discount_type}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Discount Amount / Rate</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {viewDetailsProduct.discount.discount_type === "percentage"
                        ? `${viewDetailsProduct.discount.discount_value}% OFF`
                        : `৳${Math.round(Number(viewDetailsProduct.discount.discount_value))} OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Calculated Final Price</span>
                    <span className="font-bold text-[#1C1A17]">
                      ৳
                      {viewDetailsProduct.discount.discount_type === "percentage"
                        ? Math.round(
                            Number(viewDetailsProduct.product.base_price) *
                            (1 - Number(viewDetailsProduct.discount.discount_value) / 100)
                          )
                        : Math.max(
                            0,
                            Math.round(Number(viewDetailsProduct.product.base_price) - Number(viewDetailsProduct.discount.discount_value))
                          )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Valid From</span>
                    <span className="font-mono text-[#1C1A17]">{viewDetailsProduct.discount.valid_from}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#6E685E] font-medium">Valid To (Expiration)</span>
                    <span className="font-mono text-[#1C1A17]">{viewDetailsProduct.discount.valid_to}</span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 flex items-center justify-between border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => handleDeleteDiscount(viewDetailsProduct.discount.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Discount</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewDetailsProduct(null)}
                    className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📌 POPUP MODAL 2: ADD DISCOUNT */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
              {/* Modal Header */}
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <h3 className="font-serif font-bold text-base text-[#1C1A17]">
                    {editingDiscountId ? "Edit Product Discount" : "Add Discount to Product"}
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
                    <p className="text-xs text-[#6E685E] font-medium">Base Price: ৳{Math.round(Number(selectedProduct.base_price))}</p>
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
                    <option value="fixed">Fixed Currency Amount (৳)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Discount Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={discountType === "percentage" ? "e.g. 15 for 15%" : "e.g. 500 for ৳500 off"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] placeholder:text-[#9E978C] focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
                    step="1"
                    min="0"
                    required
                  />
                  <p className="text-[11px] text-[#6E685E] mt-1 font-light">
                    {discountType === "percentage"
                      ? `Calculated Price: ৳${Math.round(
                          Number(selectedProduct.base_price) *
                          (1 - (Number(discountValue) || 0) / 100)
                        )}`
                      : `Calculated Price: ৳${Math.max(
                          0,
                          Math.round(Number(selectedProduct.base_price) - (Number(discountValue) || 0))
                        )}`}
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