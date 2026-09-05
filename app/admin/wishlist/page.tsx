"use client";

import { useEffect, useState, useMemo } from "react";
import { apiUrl, adminToken, getProductImageUrl } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import {
  Heart,
  Search,
  Package,
  User as UserIcon,
  Filter,
  ArrowUpDown,
  Eye,
  Trash2,
  X,
  Users,
} from "lucide-react";

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  created_at?: string;
  user?: {
    id: number;
    user_code?: string;
    name: string;
    email: string;
  };
}

export interface ProductWithWishlist {
  id: number;
  name: string;
  sku: string;
  base_price: number | string;
  stock_quantity: number;
  category?: { name: string };
  brand?: { name: string };
  images?: { image_url: string; is_primary: boolean }[];
  wishlists?: WishlistItem[];
}

export default function WishlistPage() {
  const [products, setProducts] = useState<ProductWithWishlist[]>([]);
  const [loader, setLoader] = useState(false);

  // Filter & Sort state
  const [search, setSearch] = useState("");
  const [demandFilter, setDemandFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"most_wishlisted" | "least_wishlisted">("most_wishlisted");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selected Product for Detailed Customer Wishlist Modal
  const [selectedProduct, setSelectedProduct] = useState<ProductWithWishlist | null>(null);
  const [modalSearch, setModalSearch] = useState("");

  const fetchProductsAndWishlists = async () => {
    try {
      setLoader(true);
      const res = await fetch(`${apiUrl}/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
      });
      const result = await res.json();
      setLoader(false);

      if (res.ok && Array.isArray(result.data)) {
        setProducts(result.data);
      } else {
        console.error("Failed to fetch products:", result);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching wishlist product list:", error);
    }
  };

  useEffect(() => {
    fetchProductsAndWishlists();
  }, []);

  const handleDeleteWishlistItem = async (wishlistId: number, productId: number) => {
    if (!confirm("Are you sure you want to remove this user's wishlist entry?")) return;
    try {
      const res = await fetch(`${apiUrl}/wishlists/${wishlistId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                wishlists: p.wishlists?.filter((w) => w.id !== wishlistId),
              };
            }
            return p;
          })
        );
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct((prev) =>
            prev
              ? {
                  ...prev,
                  wishlists: prev.wishlists?.filter((w) => w.id !== wishlistId),
                }
              : null
          );
        }
      } else {
        alert("Failed to remove wishlist item.");
      }
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
    }
  };

  const getUserDisplayCode = (u?: WishlistItem["user"]) => {
    if (!u) return "USR-000000";
    if (u.user_code) return u.user_code;
    return String(10000000 + (u.id * 148927) % 90000000);
  };

  // Filtered & Sorted Products List based on Wishlist count
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.category?.name?.toLowerCase().includes(search.toLowerCase());

        const wishCount = p.wishlists?.length || 0;

        if (demandFilter === "has_wishlist" && wishCount === 0) return false;
        if (demandFilter === "high_demand" && wishCount < 2) return false;

        return matchesSearch;
      })
      .sort((a, b) => {
        const countA = a.wishlists?.length || 0;
        const countB = b.wishlists?.length || 0;

        if (sortBy === "most_wishlisted") return countB - countA;
        if (sortBy === "least_wishlisted") return countA - countB;
        return 0;
      });
  }, [products, search, demandFilter, sortBy]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, demandFilter, sortBy]);

  // Modal filtered customers who wishlisted the selected product
  const modalFilteredWishlists = useMemo(() => {
    if (!selectedProduct || !selectedProduct.wishlists) return [];
    return selectedProduct.wishlists.filter((w) => {
      const code = getUserDisplayCode(w.user).toLowerCase();
      const name = w.user?.name ? w.user.name.toLowerCase() : "";
      const email = w.user?.email ? w.user.email.toLowerCase() : "";
      const q = modalSearch.toLowerCase();

      return code.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [selectedProduct, modalSearch]);

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Patron Demand Analytics
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500" /> Wishlist Demand & Popularity
            </h1>
          </div>
        </div>

        {/* Controls Bar: Search, Demand Filter, Sort */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#E8E2D5] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E988D]" />
            <input
              type="text"
              placeholder="Search product name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs placeholder-[#9E988D] rounded-xl focus:outline-none focus:border-[#1C1A17] transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter by Demand */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#8C6D2B]" />
              <select
                value={demandFilter}
                onChange={(e) => setDemandFilter(e.target.value)}
                className="py-2 px-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#1C1A17]"
              >
                <option value="all">All Products</option>
                <option value="has_wishlist">Wishlisted Products Only</option>
                <option value="high_demand">High Demand (2+ Wishlists)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8C6D2B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#1C1A17]"
              >
                <option value="most_wishlisted">Most Wishlisted First</option>
                <option value="least_wishlisted">Least Wishlisted First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product List Table */}
        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Wishlist Popularity...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredProducts.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="wishlisted products"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">Category / Brand</th>
                    <th className="px-6 py-4">Base Price</th>
                    <th className="px-6 py-4">Stock Quantity</th>
                    <th className="px-6 py-4">Wishlist Count</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedProducts.map((product) => {
                    const wishCount = product.wishlists?.length || 0;

                    return (
                      <tr key={product.id} className="hover:bg-[#FFFDF9] transition-colors">
                        {/* Product details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8C6D2B] font-bold overflow-hidden flex-shrink-0">
                              {getProductImageUrl(product) ? (
                                <img src={getProductImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-[#1C1A17] text-sm">{product.name}</h4>
                              <span className="font-mono text-[10px] text-[#6E685E]">SKU: {product.sku}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Brand */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#1C1A17] block">{product.category?.name || "Uncategorized"}</span>
                          <span className="text-[11px] text-[#6E685E] block">{product.brand?.name || "—"}</span>
                        </td>

                        {/* Base Price */}
                        <td className="px-6 py-4 font-mono font-bold text-[#1C1A17]">
                          ৳{Math.round(Number(product.base_price))}
                        </td>

                        {/* Stock Quantity */}
                        <td className="px-6 py-4 font-mono">
                          {product.stock_quantity > 0 ? (
                            <span className="text-emerald-700 font-bold">{product.stock_quantity} in stock</span>
                          ) : (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Out of stock</span>
                          )}
                        </td>

                        {/* Wishlist count badge */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> {wishCount} {wishCount === 1 ? "Customer" : "Customers"}
                          </span>
                        </td>

                        {/* View Interested Customers Action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setModalSearch("");
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Customers ({wishCount})
                          </button>
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
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No wishlisted items found matching your criteria.</p>
          </div>
        )}

        {/* Detailed Modal: Customers who wishlisted selected product */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Interested Customers List
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                    {selectedProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 rounded-lg text-[#6E685E] hover:text-[#1C1A17] hover:bg-[#E8E2D5]/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Filter */}
              <div className="p-4 bg-[#FAF8F5]/50 border-b border-[#E8E2D5] flex items-center justify-between flex-shrink-0 text-xs">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E988D]" />
                  <input
                    type="text"
                    placeholder="Search customer name, code, or email..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                  />
                </div>
              </div>

              {/* Customers List */}
              <div className="p-6 space-y-3 overflow-y-auto flex-1 text-xs">
                {modalFilteredWishlists.length > 0 ? (
                  <div className="space-y-2">
                    {modalFilteredWishlists.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] hover:border-[#C5A059] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1C1A17] text-white flex items-center justify-center font-bold text-xs">
                            {w.user?.name ? w.user.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-serif font-bold text-[#1C1A17] text-sm">
                                {w.user?.name || `Customer #${w.user_id}`}
                              </h5>
                              <span className="font-mono text-[10px] font-bold text-[#8C6D2B] bg-white px-2 py-0.5 rounded border border-[#E8E2D5]">
                                {getUserDisplayCode(w.user)}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-[#6E685E] block">
                              {w.user?.email || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-[#9E988D]">
                            Added: {w.created_at ? new Date(w.created_at).toLocaleDateString() : "—"}
                          </span>
                          <button
                            onClick={() => handleDeleteWishlistItem(w.id, selectedProduct.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Remove Wishlist Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#6E685E] bg-[#FAF8F5] rounded-xl border border-[#E8E2D5]">
                    No customers found matching your search.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-[#FAF8F5] border-t border-[#E8E2D5] px-6 py-3 flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] text-[#6E685E] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#8C6D2B]" /> Total Interested Customers: <strong>{selectedProduct.wishlists?.length || 0}</strong>
                </span>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-5 py-2 rounded-xl bg-[#1C1A17] hover:bg-[#332F2A] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
