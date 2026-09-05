import React from 'react';
import { Product } from '../types/shop';
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';
import { getImageUrl, getProductImageUrl } from '../common/http';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onQuickView, onAddToWishlist, viewMode = 'grid' }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-3.5 h-3.5 ${
          index < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (viewMode === 'list') {
    return (
      <div className="floating-card bg-white rounded-2xl border border-[#E8E2D5] shadow-sm overflow-hidden flex flex-col sm:flex-row p-4 sm:p-5 gap-6 group">
        {/* Product Image */}
        <div className="relative w-full sm:w-56 h-48 sm:h-auto flex-shrink-0 bg-[#FAF8F5] rounded-xl overflow-hidden flex items-center justify-center border border-[#E8E2D5]">
          {product.image && product.image !== '/api/placeholder/300/300' && product.image !== '/api/placeholder/400/400' ? (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-wider">Product Image</span>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.isNew && (
              <span className="bg-[#1C1A17] text-[#D4AF37] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                New
              </span>
            )}
            {product.isBestseller && (
              <span className="bg-[#C5A059] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Bestseller
              </span>
            )}
            {product.discount && (
              <span className="bg-red-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shadow-sm">
                -{product.discount}%
              </span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">
                {product.brand}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                product.stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock (0)'}
              </span>
            </div>

            <h3 className="text-lg font-serif font-bold text-[#1C1A17] mb-2 hover:text-[#C5A059] cursor-pointer transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">{renderStars(product.rating)}</div>
              <span className="text-xs text-[#6E685E]">({product.reviewCount} reviews)</span>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-[#FAF8F5] text-[#7A7468] border border-[#E8E2D5] px-2 py-0.5 rounded-md font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E8E2D5]">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#1C1A17]">৳{Math.round(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-[#9E988D] line-through font-light">
                  ৳{Math.round(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
                className="p-2.5 rounded-xl border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                title="Quick View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                disabled={product.stock === 0}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 ${
                  product.stock === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                    : 'bg-[#1C1A17] text-white hover:bg-[#C5A059]'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="floating-card bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-[#E8E2D5] hover:border-[#C5A059] shadow-sm group flex flex-col justify-between h-full">
      <div className="relative overflow-hidden">
        {/* Product Image */}
        <div className="aspect-[4/5] bg-[#EFECE6] relative overflow-hidden">
          {product.image && product.image !== '/api/placeholder/300/300' && product.image !== '/api/placeholder/400/400' ? (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] flex items-center justify-center">
              <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-widest">Masterpiece Artwork</span>
            </div>
          )}
          
          {/* Ambient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.isNew && (
              <span className="bg-[#1C1A17] text-[#D4AF37] border border-[#1C1A17] px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm">
                New Release
              </span>
            )}
            {product.isBestseller && (
              <span className="bg-[#C5A059] text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm">
                Crown Selection
              </span>
            )}
            {product.discount && (
              <span className="bg-rose-900 text-white px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.15em] shadow-sm">
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="absolute top-3 right-3 z-10">
            {product.stock > 0 ? (
              <span className="bg-white/90 backdrop-blur-md text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                In Stock ({product.stock})
              </span>
            ) : (
              <span className="bg-white/90 backdrop-blur-md text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                Out of Stock (0)
              </span>
            )}
          </div>

          {/* Quick Action Floating Bar */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              disabled={product.stock === 0}
              className="bg-white text-[#1C1A17] rounded-full p-3 shadow-xl hover:bg-[#1C1A17] hover:text-[#D4AF37] transition-all transform hover:scale-110 disabled:opacity-50"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
              className="bg-white text-[#1C1A17] rounded-full p-3 shadow-xl hover:bg-[#1C1A17] hover:text-[#D4AF37] transition-all transform hover:scale-110"
              title="Quick View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToWishlist) onAddToWishlist(product);
              }}
              className="bg-white text-[#1C1A17] rounded-full p-3 shadow-xl hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand */}
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] mb-1">
            {product.brand}
          </p>
          
          {/* Product Name */}
          <h3 className="font-serif font-semibold text-base text-[#1C1A17] mb-2 line-clamp-1 group-hover:text-[#8C6D2B] transition-colors">
            {product.name}
          </h3>

          {/* Rating & Sold Count */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">{renderStars(product.rating)}</div>
              <span className="text-[11px] font-mono text-[#8C6D2B]">({product.reviewCount})</span>
            </div>
            <span className="text-[10px] font-bold text-[#8C6D2B] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E2D5]">
              {product.salesCount || 0} Sold
            </span>
          </div>
        </div>

        <div>
          {/* Price & Action */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#E8E2D5]">
            <div>
              <span className="text-[9px] text-[#7A7468] uppercase font-bold tracking-widest block -mb-0.5">
                Valuation
              </span>
              <div className="flex flex-col">
                <span className="text-xl font-serif font-bold text-[#1C1A17]">৳{Math.round(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xs text-[#9E988D] line-through font-light -mt-0.5">
                    ৳{Math.round(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              disabled={product.stock === 0}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm flex items-center gap-1.5 ${
                product.stock === 0
                  ? 'bg-[#E8E2D5] text-[#9E988D] cursor-not-allowed'
                  : 'bg-[#1C1A17] text-white hover:bg-[#C5A059]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{product.stock === 0 ? 'Sold Out' : 'Acquire'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;