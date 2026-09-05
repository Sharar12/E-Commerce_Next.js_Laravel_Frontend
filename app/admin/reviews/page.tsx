"use client";

import { useEffect, useState, useMemo } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import Pagination from "../components/Pagination";
import TopControlBar from "../components/TopControlBar";
import {
  Star,
  Search,
  MessageSquare,
  Package,
  User as UserIcon,
  Filter,
  ArrowUpDown,
  Eye,
  Trash2,
  X,
} from "lucide-react";

export interface ReviewItem {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at?: string;
  user?: {
    id: number;
    user_code?: string;
    name: string;
    email: string;
  };
}

export interface ProductWithReviews {
  id: number;
  name: string;
  sku: string;
  base_price: number | string;
  stock_quantity: number;
  category?: { name: string };
  brand?: { name: string };
  images?: { image_url: string; is_primary: boolean }[];
  reviews?: ReviewItem[];
}

export default function ReviewsPage() {
  const [products, setProducts] = useState<ProductWithReviews[]>([]);
  const [loader, setLoader] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"most_reviews" | "highest_rating" | "lowest_rating" | "recent">("recent");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detailed Modal for a Product's Reviews
  const [selectedProduct, setSelectedProduct] = useState<ProductWithReviews | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalRatingFilter, setModalRatingFilter] = useState<string>("all");

  const fetchProductsAndReviews = async () => {
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
      console.error("Error fetching reviews product list:", error);
    }
  };

  useEffect(() => {
    fetchProductsAndReviews();
  }, []);

  const handleDeleteReview = async (reviewId: number, productId: number) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      const res = await fetch(`${apiUrl}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                reviews: p.reviews?.filter((r) => r.id !== reviewId),
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
                  reviews: prev.reviews?.filter((r) => r.id !== reviewId),
                }
              : null
          );
        }
      } else {
        alert("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const getAvgRating = (revs?: ReviewItem[]) => {
    if (!revs || revs.length === 0) return 0;
    const sum = revs.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return (sum / revs.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    const num = Math.round(rating);
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= num ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  // Filtered and Sorted Products List
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.category?.name?.toLowerCase().includes(search.toLowerCase());

        const revs = p.reviews || [];
        const avg = Number(getAvgRating(revs));

        if (ratingFilter === "has_reviews" && revs.length === 0) return false;
        if (ratingFilter === "5_star" && Math.round(avg) !== 5) return false;
        if (ratingFilter === "4_star" && Math.round(avg) !== 4) return false;
        if (ratingFilter === "3_under" && (avg > 3 || revs.length === 0)) return false;

        return matchesSearch;
      })
      .sort((a, b) => {
        const revsA = a.reviews?.length || 0;
        const revsB = b.reviews?.length || 0;
        const avgA = Number(getAvgRating(a.reviews));
        const avgB = Number(getAvgRating(b.reviews));

        if (sortBy === "recent") {
          const latestA = a.reviews?.reduce((acc, r) => {
            const t = r.created_at ? new Date(r.created_at).getTime() : 0;
            return t > acc ? t : acc;
          }, 0) ?? 0;
          const latestB = b.reviews?.reduce((acc, r) => {
            const t = r.created_at ? new Date(r.created_at).getTime() : 0;
            return t > acc ? t : acc;
          }, 0) ?? 0;
          return latestB - latestA;
        }
        if (sortBy === "most_reviews") return revsB - revsA;
        if (sortBy === "highest_rating") return avgB - avgA;
        if (sortBy === "lowest_rating") return avgA - avgB;
        return 0;
      });
  }, [products, search, ratingFilter, sortBy]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, ratingFilter, sortBy]);

  // Modal filtered reviews for selected product
  const modalFilteredReviews = useMemo(() => {
    if (!selectedProduct || !selectedProduct.reviews) return [];
    return selectedProduct.reviews.filter((r) => {
      const matchesSearch =
        (r.user?.name && r.user.name.toLowerCase().includes(modalSearch.toLowerCase())) ||
        (r.user?.email && r.user.email.toLowerCase().includes(modalSearch.toLowerCase())) ||
        (r.comment && r.comment.toLowerCase().includes(modalSearch.toLowerCase()));

      if (modalRatingFilter !== "all" && r.rating !== Number(modalRatingFilter)) {
        return false;
      }
      return matchesSearch;
    });
  }, [selectedProduct, modalSearch, modalRatingFilter]);

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Customer Feedback Analytics
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-[#8C6D2B]" /> Product Reviews Summary
            </h1>
          </div>
        </div>

        {/* Controls Bar: Search, Rating Filter, Sort */}
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
            {/* Filter by Rating */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#8C6D2B]" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="py-2 px-3 bg-[#FAF8F5] border border-[#E8E2D5] text-[#1C1A17] text-xs rounded-xl focus:outline-none focus:border-[#1C1A17]"
              >
                <option value="all">All Products</option>
                <option value="has_reviews">With Reviews Only</option>
                <option value="5_star">5 Stars Average</option>
                <option value="4_star">4 Stars Average</option>
                <option value="3_under">3 Stars or Lower</option>
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
                <option value="recent">Most Recent Review</option>
                <option value="most_reviews">Most Reviews Count</option>
                <option value="highest_rating">Highest Avg Rating</option>
                <option value="lowest_rating">Lowest Avg Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product List Table */}
        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Loading Product Reviews...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-4">
            <TopControlBar
              itemsPerPage={itemsPerPage}
              totalItems={filteredProducts.length}
              onItemsPerPageChange={setItemsPerPage}
              onPageChange={setCurrentPage}
              itemLabel="reviewed products"
            />
            <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">Category / Brand</th>
                    <th className="px-6 py-4">Base Price</th>
                    <th className="px-6 py-4">Reviews Count</th>
                    <th className="px-6 py-4">Average Rating</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5]">
                  {paginatedProducts.map((product) => {
                    const revCount = product.reviews?.length || 0;
                    const avgRating = getAvgRating(product.reviews);

                    return (
                      <tr key={product.id} className="hover:bg-[#FFFDF9] transition-colors">
                        {/* Product details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8C6D2B] font-bold overflow-hidden flex-shrink-0">
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
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

                        {/* Reviews count badge */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] border border-[#E8E2D5] text-[#8C6D2B]">
                            <MessageSquare className="w-3 h-3" /> {revCount} {revCount === 1 ? "Review" : "Reviews"}
                          </span>
                        </td>

                        {/* Rating */}
                        <td className="px-6 py-4">
                          {revCount > 0 ? (
                            <div className="flex items-center gap-2">
                              {renderStars(Number(avgRating))}
                              <span className="font-bold text-[#1C1A17] font-mono text-xs">{avgRating} / 5</span>
                            </div>
                          ) : (
                            <span className="text-[#6E685E] italic text-[11px]">No ratings yet</span>
                          )}
                        </td>

                        {/* Detailed View Action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setModalSearch("");
                              setModalRatingFilter("all");
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Reviews ({revCount})
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
            <p className="text-xs text-[#5A554C]">No products found matching your filter criteria.</p>
          </div>
        )}

        {/* Detailed Reviews View Modal for Selected Product */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-[#FAF8F5] border-b border-[#E8E2D5] px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D2B] block">
                    Product Customer Reviews
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

              {/* Modal Sub-Header Controls */}
              <div className="p-4 bg-[#FAF8F5]/50 border-b border-[#E8E2D5] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 text-xs">
                <input
                  type="text"
                  placeholder="Filter comments or reviewer name..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[#6E685E] font-medium">Rating:</span>
                  <select
                    value={modalRatingFilter}
                    onChange={(e) => setModalRatingFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#E8E2D5] text-[#1C1A17] rounded-xl focus:outline-none focus:border-[#1C1A17]"
                  >
                    <option value="all">All Stars</option>
                    <option value="5">5 Stars Only</option>
                    <option value="4">4 Stars Only</option>
                    <option value="3">3 Stars Only</option>
                    <option value="2">2 Stars Only</option>
                    <option value="1">1 Star Only</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {modalFilteredReviews.length > 0 ? (
                  <div className="space-y-3">
                    {modalFilteredReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D5] space-y-2 relative group hover:border-[#C5A059] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#1C1A17] text-white flex items-center justify-center font-bold text-[10px]">
                              {rev.user?.name ? rev.user.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <span className="font-serif font-bold text-[#1C1A17] block">
                                {rev.user?.name || `Customer #${rev.user_id}`}
                              </span>
                              <span className="font-mono text-[10px] text-[#6E685E]">
                                {rev.user?.email || "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D5]">
                              {renderStars(rev.rating)}
                              <span className="font-bold font-mono text-[#1C1A17] text-[11px] ml-1">
                                {rev.rating}.0
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteReview(rev.id, selectedProduct.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete Inappropriate Review"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[#332F2A] font-sans leading-relaxed pt-1 text-xs">
                          "{rev.comment || "No written review text."}"
                        </p>

                        <div className="text-[10px] text-[#9E988D] font-mono text-right">
                          Posted on: {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#6E685E] bg-[#FAF8F5] rounded-xl border border-[#E8E2D5]">
                    No reviews matching the filter for this product.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-[#FAF8F5] border-t border-[#E8E2D5] px-6 py-3 flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] text-[#6E685E]">
                  Showing <strong>{modalFilteredReviews.length}</strong> of <strong>{selectedProduct.reviews?.length || 0}</strong> reviews
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