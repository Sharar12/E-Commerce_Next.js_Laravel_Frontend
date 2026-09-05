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
  User as UserIcon,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Package,
} from "lucide-react";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  price_at_purchase: number | string;
  discount_applied?: number | string;
  product?: {
    id: number;
    title?: string;
    name?: string;
    thumbnail?: string;
    image?: string;
    base_price?: number | string;
  };
  variant?: {
    id: number;
    sku?: string;
    color?: string;
    size?: string;
  };
}

export interface OrderShippingInfo {
  id: number;
  order_id: number;
  shipping_method_id?: number;
  address?: string;
  tracking_number?: string;
  shipping_method?: {
    id: number;
    name: string;
    cost?: number | string;
  };
}

export interface OrderPaymentInfo {
  id: number;
  order_id: number;
  payment_method: string;
  transaction_id?: string;
  amount: number | string;
  status: string;
}

export interface Order {
  id: number;
  order_code?: string;
  user_id: number;
  user?: { id: number; name: string; email: string };
  total_amount: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  final_amount: number | string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | string;
  items?: OrderItem[];
  shipping?: OrderShippingInfo;
  payment?: OrderPaymentInfo;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

import { useGetOrdersQuery, useUpdateOrderStatusMutation } from "../../services/orderApi";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const { data: response, isLoading: loader } = useGetOrdersQuery();
  const orders: Order[] = useMemo(() => {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  }, [response]);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Controls: Search, Status Filter, Sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`${apiUrl}/orders/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
      });
      const result = await res.json();
      if (res.ok) {
        alert("Order deleted successfully!");
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("An error occurred while deleting the order.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder) return;
    try {
      setSaving(true);
      await updateOrderStatus({ id: editOrder.id, status: editOrder.status }).unwrap();
      setEditOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order!");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");
  const fmtAmt = (v: number | string) => `৳${Math.round(Number(v))}`;

  // Helper for Order Code display
  const getDisplayCode = (o: Order) => {
    if (o.order_code) return o.order_code;
    return `ORD-${String(o.id).padStart(6, "0")}`;
  };

  // Filter & Sort Logic
  const filteredAndSortedOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = orders.filter((o) => {
      const codeStr = getDisplayCode(o).toLowerCase();
      const rawIdStr = o.id.toString();
      const userNameStr = o.user?.name?.toLowerCase() || "";
      const userEmailStr = o.user?.email?.toLowerCase() || "";
      const statusStr = o.status.toLowerCase();

      const matchSearch =
        !q ||
        codeStr.includes(q) ||
        rawIdStr.includes(q) ||
        userNameStr.includes(q) ||
        userEmailStr.includes(q) ||
        statusStr.includes(q);

      const matchStatus = statusFilter === "all" || o.status === statusFilter;

      return matchSearch && matchStatus;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === "highest") {
        return Number(b.final_amount) - Number(a.final_amount);
      }
      if (sortBy === "lowest") {
        return Number(a.final_amount) - Number(b.final_amount);
      }
      return 0;
    });
  }, [orders, search, statusFilter, sortBy]);

  const paginatedOrders = useMemo(() => {
    return filteredAndSortedOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Processing
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600" /> Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-900 border border-purple-200">
            <Package className="w-3 h-3 text-purple-600" /> Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-900 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Payment
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 font-sans antialiased text-[#1C1A17]">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Store Order Management
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] tracking-tight">
              Customer Orders
            </h1>
            <p className="text-xs text-[#6E685E] font-light mt-1">
              Manage order status lifecycle, inspect customer checkout totals, and review live purchase orders.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#8C6D2B] text-xs font-bold uppercase tracking-wider rounded-full shadow-sm self-start sm:self-auto">
            <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Customer Checkout Stream</span>
          </div>
        </div>

        {/* Controls: Search, Status Filter & Sort */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order code, customer name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium"
              />
            </div>

            {/* Filter by Status */}
            <div className="relative">
              <Filter className="w-4 h-4 text-[#8C6D2B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 transition-all font-medium appearance-none capitalize"
              >
                <option value="all">All Order Statuses</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    Status: {st}
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
                <option value="newest">Sort by: Newest Orders First</option>
                <option value="oldest">Sort by: Oldest Orders First</option>
                <option value="highest">Sort by: Total Amount (High to Low)</option>
                <option value="lowest">Sort by: Total Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loader ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
              Loading Customer Orders...
            </p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <ShoppingBag className="w-10 h-10 text-[#C5A059] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-serif font-bold text-[#1C1A17]">No orders match your criteria</p>
            <p className="text-xs text-[#6E685E] mt-1">Try adjusting your search query or status filter selection.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredAndSortedOrders.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="orders"
            />
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="p-4">Order Code</th>
                    <th className="p-4">Customer Account</th>
                    <th className="p-4">Subtotal</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Shipping</th>
                    <th className="p-4">Final Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FFFDF9] transition-colors">
                      {/* Order Code */}
                      <td className="p-4 font-mono font-bold text-[#1C1A17]">
                        <span className="inline-flex items-center gap-1 bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E8E2D5] text-[#8C6D2B]">
                          <ShoppingBag className="w-3 h-3 text-[#8C6D2B]" />
                          {getDisplayCode(order)}
                        </span>
                      </td>

                      {/* Customer Account */}
                      <td className="p-4">
                        {order.user ? (
                          <div>
                            <div className="font-serif font-bold text-[#1C1A17] text-xs">{order.user.name}</div>
                            <div className="text-[11px] font-mono text-[#6E685E]">{order.user.email}</div>
                          </div>
                        ) : (
                          <span className="font-serif font-semibold text-[#1C1A17]">User #{order.user_id}</span>
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-[#1C1A17]">{fmtAmt(order.total_amount)}</td>
                      <td className="p-4 font-mono text-emerald-800">{fmtAmt(order.discount_amount || 0)}</td>
                      <td className="p-4 font-mono text-[#5A554C]">{fmtAmt(order.shipping_fee || 0)}</td>
                      <td className="p-4 font-mono font-bold text-sm text-[#1C1A17]">{fmtAmt(order.final_amount)}</td>
                      
                      {/* Status */}
                      <td className="p-4">{renderStatusBadge(order.status)}</td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewOrder(order)}
                            className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all text-[#8C6D2B]"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditOrder(order)}
                            className="p-1.5 rounded-lg border border-[#E8E2D5] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all text-[#1C1A17]"
                            title="Edit Order Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredAndSortedOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
          </div>
        )}

        {/* View Modal */}
        {viewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden space-y-0">
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Order Details & Purchased Products
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    Order {getDisplayCode(viewOrder)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewOrder(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
                {/* Summary Box */}
                <div className="divide-y divide-[#E8E2D5] bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D5] space-y-2">
                  <div className="flex justify-between pb-2">
                    <span className="text-[#6E685E] font-medium">Order Code</span>
                    <span className="font-mono font-bold text-[#8C6D2B]">{getDisplayCode(viewOrder)} (ID: #{viewOrder.id})</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Customer Account</span>
                    <span className="font-serif font-bold text-[#1C1A17]">
                      {viewOrder.user ? `${viewOrder.user.name} (${viewOrder.user.email})` : `User #${viewOrder.user_id}`}
                    </span>
                  </div>

                  {/* Payment Details */}
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Payment Info</span>
                    <span className="text-[#1C1A17] font-medium text-right">
                      {viewOrder.payment ? (
                        <>
                          <span className="capitalize font-bold text-[#8C6D2B]">{viewOrder.payment.payment_method}</span>
                          {viewOrder.payment.transaction_id && (
                            <span className="block font-mono text-[10px] text-[#6E685E]">
                              TxID: {viewOrder.payment.transaction_id}
                            </span>
                          )}
                          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase ml-1">
                            {viewOrder.payment.status}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#6E685E] italic">N/A (No payment record)</span>
                      )}
                    </span>
                  </div>

                  {/* Shipping Info & Delivery Address */}
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Shipping & Address</span>
                    <span className="text-[#1C1A17] text-right font-medium max-w-[240px]">
                      {viewOrder.shipping ? (
                        <>
                          {viewOrder.shipping.shipping_method?.name && (
                            <span className="block font-bold text-[#1C1A17]">
                              {viewOrder.shipping.shipping_method.name}
                            </span>
                          )}
                          {viewOrder.shipping.address && (
                            <span className="block text-[#5A554C]">
                              {viewOrder.shipping.address}
                            </span>
                          )}
                          {viewOrder.shipping.tracking_number && (
                            <span className="block font-mono text-[10px] text-[#8C6D2B]">
                              Tracking #: {viewOrder.shipping.tracking_number}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[#6E685E] italic">N/A (No shipping record)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Order Subtotal</span>
                    <span className="font-mono font-bold text-[#1C1A17]">{fmtAmt(viewOrder.total_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Discount Amount</span>
                    <span className="font-mono font-bold text-emerald-700">{fmtAmt(viewOrder.discount_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Shipping Fee</span>
                    <span className="font-mono text-[#5A554C]">{fmtAmt(viewOrder.shipping_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Grand Final Total</span>
                    <span className="font-mono font-bold text-sm text-[#1C1A17]">{fmtAmt(viewOrder.final_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Fulfillment Status</span>
                    <div>{renderStatusBadge(viewOrder.status)}</div>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between py-2">
                    <span className="text-[#6E685E] font-medium">Order Placed Date</span>
                    <span className="font-mono text-[#1C1A17]">{fmtDate(viewOrder.created_at)}</span>
                  </div>
                  {viewOrder.updated_at && viewOrder.updated_at !== viewOrder.created_at && (
                    <div className="flex justify-between pt-2">
                      <span className="text-[#6E685E] font-medium">Last Updated</span>
                      <span className="font-mono text-[#1C1A17]">{fmtDate(viewOrder.updated_at)}</span>
                    </div>
                  )}
                </div>

                {/* Purchased Products Breakdown */}
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#1C1A17] mb-2 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#8C6D2B]" /> Ordered Products ({viewOrder.items?.length || 0})
                  </h4>

                  {viewOrder.items && viewOrder.items.length > 0 ? (
                    <div className="space-y-2">
                      {viewOrder.items.map((item) => {
                        const productName = item.product?.title || item.product?.name || `Product #${item.product_id}`;
                        const unitPrice = Number(item.price_at_purchase);
                        const itemSubtotal = unitPrice * item.quantity;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center font-bold text-[#8C6D2B] text-xs">
                                x{item.quantity}
                              </div>
                              <div>
                                <h5 className="font-bold text-[#1C1A17]">{productName}</h5>
                                <div className="text-[11px] text-[#6E685E] flex items-center gap-2 flex-wrap">
                                  <span>
                                    Unit Price:{" "}
                                    <strong className="font-mono text-[#1C1A17]">{fmtAmt(unitPrice)}</strong>
                                    {item.product?.base_price && Number(item.product.base_price) > unitPrice && (
                                      <span className="ml-1 text-[10px] text-[#9E988D] line-through">
                                        {fmtAmt(item.product.base_price)}
                                      </span>
                                    )}
                                  </span>
                                  {item.product?.base_price && Number(item.product.base_price) > unitPrice && (
                                    <span className="bg-rose-50 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                                      {Math.round(((Number(item.product.base_price) - unitPrice) / Number(item.product.base_price)) * 100)}% Product Discount
                                    </span>
                                  )}
                                  {item.variant && (
                                    <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D5]">
                                      {[item.variant.color, item.variant.size, item.variant.sku].filter(Boolean).join(" / ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-[#1C1A17] block">
                                {fmtAmt(itemSubtotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[#6E685E] bg-[#FAF8F5] rounded-xl border border-[#E8E2D5]">
                      No item details attached to this order.
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-[#E8E2D5] flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewOrder(null)}
                    className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Status Modal */}
        {editOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Update Order Status
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    Order {getDisplayCode(editOrder)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOrder(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-5">
                {orders.find((o) => o.id === editOrder.id) && ["delivered", "cancelled"].includes((orders.find((o) => o.id === editOrder.id)?.status || "").toLowerCase()) ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Order Status Locked</p>
                    <p>This order was previously saved as <strong>{orders.find((o) => o.id === editOrder.id)?.status}</strong>. Completed and cancelled orders are final and cannot be modified.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-2">
                      Fulfillment & Payment Status
                    </label>
                    <select
                      value={editOrder.status}
                      onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl px-4 py-3 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C5A059] font-medium capitalize"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                  <button
                    type="button"
                    onClick={() => setEditOrder(null)}
                    className="px-4 py-2 rounded-xl border border-[#E8E2D5] text-xs font-bold uppercase tracking-wider hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  {!(orders.find((o) => o.id === editOrder.id) && ["delivered", "cancelled"].includes((orders.find((o) => o.id === editOrder.id)?.status || "").toLowerCase())) && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Status"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}