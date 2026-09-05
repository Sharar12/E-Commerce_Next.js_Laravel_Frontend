"use client";

import { Star, ShoppingBag, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { localBaseUrl, apiUrl, adminToken, getProductImageUrl } from "../common/http";
import { useCart } from "../contexts/CartContext";

interface Product {
  id: number;
  category_id: number;
  brand_id: number;
  name: string;
  sku: string;
  description: string;
  base_price: number;
  stock_quantity: number;
  weight: number;
  is_seasonal: boolean;
  seasonal_start_date: Date;
  seasonal_end_date: Date;
  images?: { image_url: string }[];
}

export default function FeaturedProductsSection() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/storage/")) return `${localBaseUrl}${imageUrl}`;
    return `${localBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${apiUrl}/products`, {
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const productList = data.data ?? data;
      if (Array.isArray(productList)) {
        const activeList = productList.filter((p: any) => p.status === 'active' || p.status === undefined);
        // Show only the latest 6 active products as featured
        setProducts(activeList.slice(0, 6));
      }
    } catch (err) {
      console.warn("Could not connect to live backend API:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const productWithNumberPrice = {
      ...product,
      base_price: Number(product.base_price),
    };
    addToCart(productWithNumberPrice);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-3.5 w-3.5 ${index < Math.floor(rating)
            ? "text-[#C5A059] fill-[#C5A059]"
            : "text-[#E8E2D5]"
          }`}
      />
    ));
  };

  return (
    <section className="py-20 relative overflow-hidden border-t border-b border-[#E8E2D5] bg-white">
      {/* 🎥 Full-Width Sleek Slim Background Video Banner with 20% Smooth Faded Edges */}
      <div 
        className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[35%] overflow-hidden pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
        }}
      >
        <video
          src="/videos/bg_effect.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-80 filter brightness-115 contrast-95 transform translate-z-0"
        />
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[3px]" />
      </div>

      {/* Subtle Ambient Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/40 shadow-sm backdrop-blur-md mb-4">
            <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">
              Atelier Curations • Featured Masterpieces
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif text-[#1C1A17] tracking-tight mb-3">
            Selected Masterpieces
          </h2>
          <p className="text-base text-[#5A554C] font-light max-w-lg mx-auto leading-relaxed">
            Discover top-tier creations, hand-selected by our atelier master curators for exceptional quality.
          </p>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-[#E8E2D5] bg-white/60 animate-pulse">
                <div className="aspect-[4/5] bg-[#EFECE6]" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-[#E8E2D5] rounded w-3/4" />
                  <div className="h-3 bg-[#E8E2D5] rounded w-full" />
                  <div className="h-3 bg-[#E8E2D5] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty state — no products in DB */
          <div className="text-center py-16 px-6 bg-white/60 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <Crown className="w-10 h-10 text-[#C5A059] mx-auto mb-4 opacity-60" />
            <p className="text-[#8C6D2B] text-sm font-serif font-semibold mb-1">
              The atelier catalog is being curated
            </p>
            <p className="text-[#9E988D] text-xs font-light">
              New masterpieces will appear here once products are added.
            </p>
            <Link
              href="/admin/products/create"
              className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all duration-300"
            >
              + Add First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.id}`)}
                className="floating-card group relative bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-[#E8E2D5] hover:border-[#C5A059] transition-all duration-500 hover:shadow-2xl flex flex-col justify-between cursor-pointer"
              >
                {/* Image Frame */}
                <div className="aspect-[4/5] relative overflow-hidden bg-[#EFECE6]">
                  {getProductImageUrl(product) ? (
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] flex items-center justify-center p-4 text-center">
                      <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-widest">
                        {product.name}
                      </span>
                    </div>
                  )}

                  {/* Subtle Vignette Fog */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Seasonal Badge */}
                  {product.is_seasonal && (
                    <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[#8C6D2B] border border-[#C5A059]/40 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10">
                      Seasonal Curation
                    </span>
                  )}
                </div>

                {/* Product Content Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#1C1A17] group-hover:text-[#8C6D2B] transition-colors mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[#6E685E] text-xs font-light mb-4 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E8E2D5]">
                    <div className="flex items-center mb-4">
                      {(() => {
                        const reviews = (product as any).reviews || [];
                        const count = reviews.length;
                        const avg = count > 0 ? reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / count : 0;
                        return (
                          <>
                            <div className="flex items-center gap-0.5">
                              {renderStars(avg)}
                            </div>
                            <span className="ml-2 text-xs font-mono font-medium text-[#8C6D2B]">
                              ({count > 0 ? avg.toFixed(1) : 'No reviews'})
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#7A7468] uppercase font-bold tracking-widest block -mb-0.5">
                          Price
                        </span>
                        <span className="text-xl font-serif font-bold text-[#1C1A17]">
                          ৳{Math.round(Number(product.base_price))}
                        </span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        className="bg-[#1C1A17] hover:bg-[#C5A059] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm flex items-center gap-2"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Acquire</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button — only shown when products exist */}
        {!loading && products.length > 0 && (
        <div className="text-center mt-16">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>Explore Entire Catalog</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
        )}

      </div>
    </section>
  );
}