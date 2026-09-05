import React from 'react';
import { BestSellerProduct } from '../types/best-sellers';
import { Star, Heart, ShoppingCart, Eye, TrendingUp, TrendingDown, Minus, Award, Zap } from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '../common/http';

interface BestSellerCardProps {
  product: BestSellerProduct;
  viewMode: 'grid' | 'list' | 'ranked';
  onAddToCart: (product: BestSellerProduct) => void;
  onQuickView: (product: BestSellerProduct) => void;
  onAddToWishlist: (product: BestSellerProduct) => void;
}

const BestSellerCard: React.FC<BestSellerCardProps> = ({
  product,
  viewMode,
  onAddToCart,
  onQuickView,
  onAddToWishlist
}) => {
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRankChangeIcon = () => {
    switch (product.rankChange) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'new':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRankChangeText = () => {
    switch (product.rankChange) {
      case 'up':
        return `↑ from #${product.previousRank}`;
      case 'down':
        return `↓ from #${product.previousRank}`;
      case 'new':
        return 'New to chart';
      default:
        return 'No change';
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onAddToWishlist(product);
  };

  // Ranked View (for ranked layout)
  if (viewMode === 'ranked') {
    return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] hover:border-[#C5A059] shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            
            {/* Left Info Group */}
            <div className="flex items-start sm:items-center gap-6 flex-1 min-w-0">
              
              {/* Rank Badge */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-md
                  ${product.rank <= 3 ? 'bg-gradient-to-br from-[#D4AF37] via-[#C5A059] to-[#8C6D2B]' : 'bg-[#1C1A17] text-[#D4AF37] border border-[#1C1A17]'}
                `}>
                  #{product.rank}
                </div>
              </div>

              {/* Product Artwork Frame */}
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#EFECE6] border border-[#E8E2D5] relative">
                {product.image ? (
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] flex items-center justify-center">
                    <span className="text-[#9E988D] text-[10px] font-semibold uppercase tracking-widest text-center px-1">Masterpiece</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] mb-1">{product.brand}</p>
                <h3 className="font-serif font-semibold text-lg text-[#1C1A17] group-hover:text-[#8C6D2B] transition-colors truncate mb-1">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex gap-0.5">{renderStars(product.rating)}</div>
                  <span className="text-[11px] font-mono text-[#8C6D2B]">({product.reviewCount})</span>
                  <span className="text-xs text-[#9E988D]">•</span>
                  <span className="text-xs text-[#7A7468] font-medium">{product.category}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    product.stock > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock (0)'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] text-[#8C6D2B] border border-[#E8E2D5]">
                    {product.salesCount || 0} Sold
                  </span>
                </div>
              </div>

            </div>

            {/* Right Action & Price Group */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#E8E2D5] flex-shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[9px] text-[#7A7468] uppercase font-bold tracking-widest block -mb-0.5">
                  Valuation
                </span>
                <div className="flex flex-col">
                  <span className="text-2xl font-serif font-bold text-[#1C1A17]">৳{Math.round(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-[#9E988D] line-through font-light -mt-0.5">
                      ৳{Math.round(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleWishlist}
                  className={`p-2.5 rounded-xl border border-[#E8E2D5] transition-colors ${
                    isWishlisted ? 'bg-rose-50 text-rose-600 border-rose-200' : 'text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5]'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleQuickView}
                  className="p-2.5 rounded-xl border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                  title="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm flex items-center gap-1.5 ${
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
      </Link>
    );
  }

  // List View
  if (viewMode === 'list') {
    return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] hover:border-[#C5A059] shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Product Image */}
            <div className="md:w-56 md:h-56 w-full h-48 relative flex-shrink-0 bg-[#EFECE6] rounded-xl overflow-hidden border border-[#E8E2D5]">
              {product.image ? (
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] flex items-center justify-center">
                  <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-widest">Masterpiece</span>
                </div>
              )}
              
              {/* Rank Badge */}
              <div className="absolute top-3 left-3 z-10">
                <div className={`
                  flex items-center gap-1 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm tracking-wider
                  ${product.rank <= 3 ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059]' : 'bg-[#1C1A17] text-[#D4AF37] border border-[#1C1A17]'}
                `}>
                  <Award className="w-3.5 h-3.5" />
                  <span>RANK #{product.rank}</span>
                </div>
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
            </div>

            {/* Product Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] mb-1">{product.brand}</p>
                    <h3 className="font-serif font-semibold text-xl text-[#1C1A17] group-hover:text-[#8C6D2B] transition-colors mb-2">
                      {product.name}
                    </h3>
                  </div>
                  <button
                    onClick={handleWishlist}
                    className={`p-2.5 rounded-xl border border-[#E8E2D5] transition-colors ${
                      isWishlisted ? 'bg-rose-50 text-rose-600 border-rose-200' : 'text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5]'
                    }`}
                    title="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <p className="text-[#6E685E] text-xs font-light mb-4 line-clamp-2 leading-relaxed">{product.description}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">{renderStars(product.rating)}</div>
                    <span className="text-xs font-mono text-[#8C6D2B]">({product.reviewCount})</span>
                  </div>
                  <span className="text-xs text-[#7A7468] font-medium">{product.category}</span>
                </div>

                {/* Sold Amount Badge */}
                <div className="inline-flex items-center gap-2 p-2 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl text-xs font-semibold mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] text-[#8C6D2B] border border-[#E8E2D5]">
                    {product.salesCount || 0} Sold
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D5]">
                <div>
                  <span className="text-[9px] text-[#7A7468] uppercase font-bold tracking-widest block -mb-0.5">
                    Valuation
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-serif font-bold text-[#1C1A17]">৳{Math.round(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-[#9E988D] line-through font-light -mt-0.5">
                        ৳{Math.round(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQuickView}
                    className="p-2.5 rounded-xl border border-[#E8E2D5] text-[#1C1A17] hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all"
                    title="Quick View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm flex items-center gap-1.5 ${
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
        </div>
      </Link>
    );
  }

  // Grid View (default)
  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-[#E8E2D5] hover:border-[#C5A059] shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer h-full flex flex-col justify-between">
        {/* Product Image */}
        <div className="relative aspect-[4/5] bg-[#EFECE6] overflow-hidden">
          {product.image ? (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] flex items-center justify-center">
              <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-widest">Masterpiece Creation</span>
            </div>
          )}
          
          {/* Subtle Vignette Fog */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Rank Badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className={`
              flex items-center gap-1 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm tracking-wider
              ${product.rank <= 3 ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A059]' : 'bg-[#1C1A17] text-[#D4AF37] border border-[#1C1A17]'}
            `}>
              <Award className="w-3.5 h-3.5" />
              <span>RANK #{product.rank}</span>
            </div>
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

          {/* Discount Badge */}
          {product.discount && (
            <div className="absolute bottom-3 left-3 z-10 bg-rose-900 text-white px-2.5 py-1 rounded-full text-[9px] font-bold tracking-[0.15em] shadow-sm">
              -{product.discount}% OFF
            </div>
          )}

          {/* Quick Action Floating Bar */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="bg-white text-[#1C1A17] rounded-full p-3 shadow-xl hover:bg-[#1C1A17] hover:text-[#D4AF37] transition-all transform hover:scale-110 disabled:opacity-50"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              onClick={handleQuickView}
              className="bg-white text-[#1C1A17] rounded-full p-3 shadow-xl hover:bg-[#1C1A17] hover:text-[#D4AF37] transition-all transform hover:scale-110"
              title="Quick View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleWishlist}
              className={`rounded-full p-3 shadow-xl transition-all transform hover:scale-110 ${
                isWishlisted
                  ? 'bg-rose-700 text-white'
                  : 'bg-white text-[#1C1A17] hover:bg-rose-700 hover:text-white'
              }`}
              title="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] mb-1">{product.brand}</p>
            <h3 className="font-serif font-semibold text-base text-[#1C1A17] mb-2 line-clamp-1 group-hover:text-[#8C6D2B] transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">{renderStars(product.rating)}</div>
              <span className="text-[11px] font-mono text-[#8C6D2B]">({product.reviewCount})</span>
            </div>

            {/* Sales Stats Bar */}
            <div className="flex items-center justify-between text-xs mb-4 p-2.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl">
              <div className="flex items-center gap-1 text-[#2E7D32] font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{product.salesCount.toLocaleString()} Sold</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D5]">
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
            
            <button
              onClick={handleAddToCart}
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
    </Link>
  );
};

export default BestSellerCard;