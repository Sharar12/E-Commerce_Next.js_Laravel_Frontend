import React from 'react';
import { SaleProduct, CountdownTimer } from '../types/sale';
import { Star, Heart, ShoppingCart, Eye, Clock, Zap, Flame, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '../common/http';

interface SaleProductCardProps {
  product: SaleProduct;
  viewMode: 'grid' | 'list' | 'compact';
  onAddToCart: (product: SaleProduct) => void;
  onQuickView: (product: SaleProduct) => void;
  onAddToWishlist: (product: SaleProduct) => void;
  countdownTimer?: CountdownTimer;
}

const SaleProductCard: React.FC<SaleProductCardProps> = ({
  product,
  viewMode,
  onAddToCart,
  onQuickView,
  onAddToWishlist,
  countdownTimer
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

  const getDiscountTierIcon = () => {
    switch (product.discountTier) {
      case 'hot':
        return <Flame className="w-3 h-3" />;
      case 'popular':
        return <Zap className="w-3 h-3" />;
      case 'ending-soon':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getDiscountTierColor = () => {
    switch (product.discountTier) {
      case 'hot':
        return 'bg-red-500 text-white';
      case 'popular':
        return 'bg-orange-500 text-white';
      case 'ending-soon':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getDiscountTierText = () => {
    switch (product.discountTier) {
      case 'hot':
        return 'Hot Deal';
      case 'popular':
        return 'Popular';
      case 'ending-soon':
        return 'Ending Soon';
      default:
        return 'On Sale';
    }
  };

  const calculateSavings = () => {
    return product.originalPrice - product.price;
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

  // ... rest of the component remains the same (just using Flame instead of Fire)
  // Compact View
  if (viewMode === 'compact') {
    return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-300 group cursor-pointer">
          <div className="flex items-center p-3">
            {/* Product Image */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 mr-4 border border-[#E8E2D5] bg-[#EFECE6]">
              {product.image ? (
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">Image</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                  {product.name}
                </h3>
                <button
                  onClick={handleWishlist}
                  className={`ml-2 p-1 rounded transition-colors flex-shrink-0 ${
                    isWishlisted
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex flex-col mb-1">
                <span className="text-lg font-bold text-gray-900">৳{Math.round(product.price)}</span>
                <span className="text-sm text-gray-500 line-through">৳{Math.round(product.originalPrice)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex">{renderStars(product.rating)}</div>
                <span>({product.reviewCount})</span>
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
        <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <div className="flex flex-col md:flex-row">
            {/* Product Image */}
            <div className="md:w-64 md:h-64 w-full h-48 relative flex-shrink-0 bg-[#EFECE6] overflow-hidden border-r border-[#E8E2D5]">
              {product.image ? (
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">Product Image</span>
                </div>
              )}
              
              {/* Discount Badge */}
              <div className="absolute top-3 left-3">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{product.discount}%
                </div>
              </div>

              {/* Discount Tier Badge */}
              <div className="absolute top-3 right-3">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDiscountTierColor()}`}>
                  {getDiscountTierIcon()}
                  {getDiscountTierText()}
                </div>
              </div>

              {/* Stock Status */}
              <div className="absolute bottom-3 left-3">
                {product.stock > 0 ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded text-xs font-semibold">
                    In Stock ({product.stock})
                  </span>
                ) : (
                  <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-1 rounded text-xs font-semibold">
                    Out of Stock (0)
                  </span>
                )}
              </div>

              {/* Countdown Timer */}
              {countdownTimer && (
                <div className="absolute bottom-3 right-3">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    countdownTimer.isEndingSoon 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{countdownTimer.hours}h {countdownTimer.minutes}m</span>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 p-6">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        {product.name}
                      </h3>
                    </div>
                    <button
                      onClick={handleWishlist}
                      className={`p-2 rounded-lg transition-colors ${
                        isWishlisted
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(product.rating)}</div>
                      <span className="text-sm text-gray-600">({product.reviewCount})</span>
                    </div>
                    <span className="text-sm text-gray-500">{product.category}</span>
                  </div>

                  {/* Savings Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-700">Save ৳{Math.round(calculateSavings())}</div>
                      <div className="text-sm text-green-600">You Save</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-700">{product.unitsSold.toLocaleString()}</div>
                      <div className="text-sm text-blue-600">Sold</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-gray-900">৳{Math.round(product.price)}</span>
                      <span className="text-lg text-gray-500 line-through">
                        ৳{Math.round(product.originalPrice)}
                      </span>
                    </div>
                    <div className="text-sm text-red-600 font-medium">
                      Save {product.discount}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleQuickView}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        product.stock === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
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
              <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-widest">Salon Concession</span>
            </div>
          )}
          
          {/* Subtle Vignette Fog */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Discount Badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-rose-900 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] shadow-sm">
              -{product.discount}% CONCESSION
            </div>
          </div>

          {/* Stock Status */}
          <div className="absolute bottom-3 left-3 z-10">
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

          {/* Countdown Timer */}
          {countdownTimer && (
            <div className="absolute bottom-3 right-3 z-10">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                countdownTimer.isEndingSoon 
                  ? 'bg-amber-500/90 text-white' 
                  : 'bg-white/90 text-[#8C6D2B] border border-[#C5A059]/40'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{countdownTimer.hours}h {countdownTimer.minutes}m</span>
              </div>
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

            {/* Savings & Sales Info Bar */}
            <div className="flex items-center justify-between text-xs mb-4 p-2.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl">
              <span className="text-[#2E7D32] font-semibold">
                Save ৳{Math.round(calculateSavings())}
              </span>
              <span className="text-[#8C6D2B] font-mono text-[11px] font-bold">
                {product.unitsSold.toLocaleString()} Sold
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D5]">
            <div>
              <span className="text-[9px] text-[#7A7468] uppercase font-bold tracking-widest block -mb-0.5">
                Concession
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

export default SaleProductCard;