"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Clock, ArrowRight, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { apiUrl, getProductImageUrl } from "../common/http";

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image?: string;
  description?: string;
  stock: number;
}

export default function NewArrivalsSection() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${apiUrl}/products`);
        const json = await res.json();
        const list = json.data || json;
        if (Array.isArray(list)) {
          const activeList = list.filter((p: any) => p.status === 'active' || p.status === undefined);
          const mapped = activeList.slice(0, 3).map((p: any) => ({
            id: String(p.id),
            name: p.name,
            brand: p.brand?.name || "Lumina",
            category: p.category?.name || "General",
            price: Number(p.base_price),
            image: getProductImageUrl(p),
            description: p.description || "",
            stock: Number(p.stock_quantity),
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch new arrivals:", err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-20 relative overflow-hidden border-t border-[#E8E2D5] bg-white">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-[#D4AF37]/30 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">
                Just Released
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif text-[#1C1A17]">
              New Arrivals
            </h2>
            <p className="text-sm text-[#6E685E] mt-2 font-light max-w-lg">
              Fresh additions to our curated portfolio. Be the first to acquire the season&apos;s newest masterworks.
            </p>
          </div>

          <Link
            href="/shop"
            className="group inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-[#8C6D2B] hover:text-[#1C1A17] transition-colors"
          >
            <span>Explore All Additions</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform text-[#C5A059]" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => router.push(`/products/${product.id}`)}
              className="floating-card bg-white rounded-2xl border border-[#E8E2D5] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
            >
              <div className="relative aspect-square bg-[#FAF8F5] overflow-hidden flex items-center justify-center p-6 border-b border-[#E8E2D5]">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="text-xs font-bold uppercase tracking-widest text-[#9E988D]">
                    {product.brand}
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  <span className="bg-[#1C1A17] text-[#D4AF37] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    New Arrival
                  </span>
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({
                        id: Number(product.id) || 101,
                        name: product.name,
                        base_price: product.price,
                        category_id: 1,
                        brand_id: 1,
                        sku: `SKU-${product.id}`,
                        description: product.description || "",
                        stock_quantity: product.stock,
                        weight: 1,
                        is_seasonal: false,
                        seasonal_start_date: new Date(),
                        seasonal_end_date: new Date(),
                      });
                    }}
                    className="p-3 rounded-full bg-[#1C1A17] text-white hover:bg-[#C5A059] transition-colors shadow-lg"
                    title="Add to Cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
                    className="p-3 rounded-full bg-white text-[#1C1A17] hover:bg-[#FAF8F5] transition-colors shadow-lg"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B] block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#1C1A17] mb-2 line-clamp-1 group-hover:text-[#C5A059] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#6E685E] line-clamp-2 mb-4 font-light">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D5]">
                  <span className="text-lg font-serif font-bold text-[#1C1A17]">
                    ৳{Math.round(product.price)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/products/${product.id}`);
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] transition-colors"
                  >
                    Details &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
