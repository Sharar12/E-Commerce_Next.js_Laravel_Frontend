"use client";

import { useEffect, useState } from "react";
import { apiUrl, adminToken, localBaseUrl } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import { Product } from "./product";

import { useGetProductsQuery, useDeleteProductMutation } from "../../services/productApi";

export default function ProductList() {
  const { data: response, isLoading: loading } = useGetProductsQuery({ status: 'all' });
  const products = (response?.data as unknown as Product[]) || [];
  const [deleteProduct] = useDeleteProductMutation();
  const [search, setSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/storage/')) return `${localBaseUrl}${imageUrl}`;
    return `${localBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(id).unwrap();
      alert("✅ Product deleted successfully!");
    } catch (error: any) {
      alert("❌ Error deleting product: " + (error?.data?.message || "Failed to delete"));
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Atelier Inventory
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight">
              Masterpiece Catalog
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs font-semibold rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 sm:w-64 pl-4 pr-4 py-2.5 bg-white border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
              />
            </div>
            <a
              href="/admin/products/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl"
            >
              <span>+ Add Masterpiece</span>
            </a>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Atelier Catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No masterpieces found matching your search specifications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredProducts.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="products"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="p-4">Artwork</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Valuation</th>
                    <th className="p-4">Stock Quantity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FFFDF9] transition-colors"
                    >
                      <td className="p-4">
                        {product.images && product.images.length > 0 ? (
                          <div className="w-12 h-14 bg-[#EFECE6] rounded-lg overflow-hidden border border-[#E8E2D5]">
                            <img
                              src={getImageUrl(
                                (product.images.find((img) => img.is_primary) || product.images[0]).image_url
                              )}
                              alt={product.name}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-14 bg-[#EFECE6] rounded-lg flex items-center justify-center border border-[#E8E2D5]">
                            <span className="text-[#9E988D] text-[9px] text-center uppercase font-bold">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-serif font-semibold text-[#1C1A17] text-sm">{product.name}</td>
                      <td className="p-4 text-[#5A554C] font-medium">
                        {product.category?.name || "-"}
                      </td>
                      <td className="p-4 text-[#8C6D2B] font-semibold uppercase tracking-wider text-[11px]">
                        {product.brand?.name || "-"}
                      </td>
                      <td className="p-4 font-mono font-bold text-[#1C1A17] text-sm">৳{Math.round(product.base_price)}</td>
                      <td className="p-4 font-mono font-bold text-[#5A554C]">{product.stock_quantity}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            product.status === "active"
                              ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                              : "bg-rose-50 border border-rose-300 text-rose-800"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            product.status === "active" ? "bg-emerald-600" : "bg-rose-600"
                          }`} />
                          {product.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/admin/products/edit/${product.id}`}
                            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            Edit
                          </a>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            Remove
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
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}