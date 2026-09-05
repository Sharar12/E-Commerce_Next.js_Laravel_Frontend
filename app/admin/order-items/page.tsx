"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import {
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Package,
  Eye,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
} from "lucide-react";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  price_at_purchase: number | string;
  discount_applied: number | string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  order?: { id: number; order_code?: string; status?: string };
  product?: { id: number; name: string; price: number };
  variant?: { id: number; color?: string; size?: string; sku?: string };
}

export default function OrderItemsPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loader, setLoader] = useState(false);

  // Controls: Search, Filter, Sort
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "quantity" | "subtotal">("newest");

  const [viewItem, setViewItem] = useState<OrderItem | null>(null);
  const [editItem, setEditItem] = useState<OrderItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchItems = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/order-items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
      });
      const result = await res.json();
      setLoader(false);
      if (Array.isArray(result.data)) {
        setOrderItems(result.data);
      } else if (Array.isArray(result)) {
        setOrderItems(result);
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching order items:", error);
      setOrderItems([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order item record?")) return;
    try {
      const res = await fetch(`${apiUrl}/order-items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      const result = await res.json();
      if (res.ok && (result.status === 200 || result.status === 204)) {
        setOrderItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("❌ Error deleting: " + (result.message || "Failed to delete"));
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting order item!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/order-items/${editItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify({
          quantity: Number(editItem.quantity),
          discount_applied: Number(editItem.discount_applied),
        }),
      });
      const result = await res.json();
      setSaving(false);
      if (res.ok && (result.status === 200 || result.data)) {
        setOrderItems((prev) =>
          prev.map((item) => (item.id === editItem.id ? { ...item, ...(result.data || editItem) } : item))
        );
        setEditItem(null);
      } else {
        alert("❌ Error updating: " + (result.message || "Failed to update"));
      }
    } catch (error) {
      setSaving(false);
      console.error("Error updating:", error);
      alert("Error updating order item!");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Format Order Code
  const getOrderCode = (item: OrderItem) => {
    if (item.order?.order_code) return item.order.order_code;
    return `ORD-${String(item.order_id).padStart(6, "0")}`;
  };

  // Format Money Whole Taka
  const money = (v: number | string) => `৳${Math.round(Number(v || 0))}`;

  // Unique product names for filter dropdown
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, string>();
    orderItems.forEach((i) => {
      if (i.product?.name) {
        map.set(i.product.name, i.product.name);
      }
    });
    return Array.from(map.values());
  }, [orderItems]);

  // Filter & Sort Logic
  const filteredAndSortedItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = orderItems.filter((item) => {
      const orderCodeStr = getOrderCode(item).toLowerCase();
      const rawOrderIdStr = item.order_id.toString();
      const productNameStr = item.product?.name?.toLowerCase() || "";
      const rawProductIdStr = item.product_id.toString();

      const matchSearch =
        !q ||
        orderCodeStr.includes(q) ||
        rawOrderIdStr.includes(q) ||
        productNameStr.includes(q) ||
        rawProductIdStr.includes(q);

      const matchProduct =
        productFilter === "all" || (item.product?.name && item.product.name === productFilter);

      return matchSearch && matchProduct;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === "quantity") {
        return b.quantity - a.quantity;
      }
      if (sortBy === "subtotal") {
        const totalA = Number(a.price_at_purchase) * a.quantity - Number(a.discount_applied || 0);
        const totalB = Number(b.price_at_purchase) * b.quantity - Number(b.discount_applied || 0);
        return totalB - totalA;
      }
      return 0;
    });
  }, [orderItems, search, productFilter, sortBy]);

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Fulfillment Composition
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Order Items Breakdown
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Inspect ordered product items, purchase quantities, unit prices, and applied discounts per line item.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#8C6D2B] text-xs font-bold uppercase tracking-wider rounded-full shadow-sm self-start sm:self-auto">
            <Package className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Automatic Cart Itemization</span>
          </div>
        </div>

        {/* Controls: Search, Product Filter & Sort */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order code, product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              />
            </div>

            {/* Filter by Product */}
            <div className="relative">
              <Filter className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium appearance-none"
              >
                <option value="all">All Products</option>
                {uniqueProducts.map((pName) => (
                  <option key={pName} value={pName}>
                    Product: {pName}
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
                <option value="newest">Sort by: Newest Items First</option>
                <option value="oldest">Sort by: Oldest Items First</option>
                <option value="quantity">Sort by: Quantity (High to Low)</option>
                <option value="subtotal">Sort by: Subtotal (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loader ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
              Loading Order Items Breakdown...
            </p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <Package className="w-10 h-10 text-[#C5A059] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-serif font-bold text-[#1C1A17]">No order line items found</p>
            <p className="text-xs text-[#6E685E] mt-1">Try adjusting your search query or product filter selection.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedItems.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="order items"
            />
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                      <th className="p-4">Item ID</th>
                      <th className="p-4">Order Code</th>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Variant</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4">Unit Price</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Line Subtotal</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {filteredAndSortedItems
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((item) => {
                        const unitPrice = Number(item.price_at_purchase || 0);
                        const discount = Number(item.discount_applied || 0);
                        const lineTotal = unitPrice * item.quantity - discount;

                        return (
                          <tr key={item.id} className="hover:bg-[#FFFDF9] transition-colors">
                            {/* Item ID */}
                            <td className="p-4 font-mono font-bold text-[#8C6D2B]">#{item.id}</td>

                            {/* Order Code */}
                            <td className="p-4 font-mono font-bold text-[#1C1A17]">
                              <span className="inline-flex items-center gap-1 bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E8E2D5] text-[#8C6D2B]">
                                <ShoppingBag className="w-3 h-3 text-[#8C6D2B]" />
                                {getOrderCode(item)}
                              </span>
                            </td>

                            {/* Product Name */}
                            <td className="p-4 font-serif font-bold text-[#1C1A17] text-xs">
                              {item.product?.name || `Product #${item.product_id}`}
                            </td>

                            {/* Variant */}
                            <td className="p-4">
                              {item.variant ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5A554C]">
                                  <Tag className="w-3 h-3 text-[#8C6D2B]" />
                                  {item.variant.color && <span>{item.variant.color}</span>}
                                  {item.variant.size && <span>({item.variant.size})</span>}
                                </span>
                              ) : (
                                <span className="text-[#9E988D]">—</span>
                              )}
                            </td>

                            {/* Quantity */}
                            <td className="p-4 font-mono font-bold text-[#1C1A17] text-center">
                              {item.quantity}
                            </td>

                            {/* Unit Price */}
                            <td className="p-4 font-mono font-bold text-[#1C1A17]">{money(unitPrice)}</td>

                            {/* Discount */}
                            <td className="p-4 font-mono text-emerald-800">{money(discount)}</td>

                            {/* Line Subtotal */}
                            <td className="p-4 font-mono font-bold text-sm text-[#1C1A17]">{money(lineTotal)}</td>

                            {/* Actions */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewItem(item)}
                                  className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all text-[#8C6D2B]"
                                  title="View Line Item Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditItem(item)}
                                  className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all text-[#1C1A17]"
                                  title="Edit Quantity / Discount"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredAndSortedItems.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}

        {/* View Modal */}
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-lg overflow-hidden space-y-0">
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Order Line Item Detail
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    Line Item #{viewItem.id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="divide-y divide-[#E8E2D5] bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex justify-between pb-2">
                    <span className="text-[#6E685E] font-medium">Line Item ID</span>
                    <span className="font-mono font-bold text-[#8C6D2B]">#{viewItem.id}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Order Code</span>
                    <span className="font-mono font-bold text-[#1C1A17]">
                      {getOrderCode(viewItem)} (ID: #{viewItem.order_id})
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Product Name</span>
                    <span className="font-serif font-bold text-[#1C1A17]">
                      {viewItem.product ? viewItem.product.name : `Product #${viewItem.product_id}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Variant</span>
                    <span className="font-mono text-[#1C1A17]">
                      {viewItem.variant
                        ? `${viewItem.variant.color || ""} ${viewItem.variant.size || ""}`.trim() || `Variant #${viewItem.variant_id}`
                        : "Standard"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Quantity Purchased</span>
                    <span className="font-mono font-bold text-[#1C1A17]">{viewItem.quantity}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Price at Purchase</span>
                    <span className="font-mono font-bold text-[#1C1A17]">{money(viewItem.price_at_purchase)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Discount Applied</span>
                    <span className="font-mono font-bold text-emerald-700">{money(viewItem.discount_applied || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Line Subtotal</span>
                    <span className="font-mono font-bold text-sm text-[#1C1A17]">
                      {money(Number(viewItem.price_at_purchase) * viewItem.quantity - Number(viewItem.discount_applied || 0))}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setViewItem(null)}
                    className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Update Line Item
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    Item #{editItem.id} ({getOrderCode(editItem)})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Quantity Purchased
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editItem.quantity}
                    onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                    Discount Applied (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editItem.discount_applied}
                    onChange={(e) => setEditItem({ ...editItem, discount_applied: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-mono font-bold"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setEditItem(null)}
                    className="px-4 py-2 rounded-xl border border-[#E8E2D5] text-xs font-bold uppercase tracking-wider hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
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