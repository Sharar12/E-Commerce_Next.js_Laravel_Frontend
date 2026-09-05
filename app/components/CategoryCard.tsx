import React from 'react';
import { Category } from '../types/category';
import { ChevronRight, Star, Eye } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  layout: 'grid' | 'masonry' | 'featured';
  showDescription: boolean;
  showProductCount: boolean;
  onCategoryClick: (category: Category) => void;
  onQuickView: (category: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  layout,
  showDescription,
  showProductCount,
  onCategoryClick,
  onQuickView
}) => {
  const isFeatured = layout === 'featured' && category.featured;
  const isMasonry = layout === 'masonry';

  const cardClasses = `
    group relative overflow-hidden rounded-2xl border border-[#E8E2D5] hover:border-[#C5A059] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between h-full bg-white/90 backdrop-blur-md
    ${isFeatured ? 'md:col-span-2 md:row-span-2' : ''}
    ${isMasonry ? 'break-inside-avoid mb-6' : ''}
  `;

  const imageClasses = `
    w-full bg-gradient-to-br from-[#FAF8F5] to-[#EFECE6] transition-all duration-700 group-hover:scale-105
    ${isFeatured ? 'h-80' : 'h-52'}
    ${isMasonry ? 'h-52' : ''}
  `;

  return (
    <div className={cardClasses}>
      {/* Category Artwork Image */}
      <div className="relative overflow-hidden">
        <div className={imageClasses}>
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <span className="text-[#9E988D] text-xs font-semibold uppercase tracking-widest text-center">{category.name} Gallery</span>
            </div>
          )}
        </div>
        
        {/* Ambient Fog Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Featured Badge */}
        {category.featured && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-[#1C1A17] text-[#D4AF37] border border-[#1C1A17] px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5">
              <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
              Crown Selection
            </div>
          </div>
        )}

        {/* Quick View Floating Action */}
        <button
          onClick={() => onQuickView(category)}
          className="absolute top-3 right-3 bg-white/90 text-[#1C1A17] rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#1C1A17] hover:text-[#D4AF37] shadow-lg z-10"
          title="Quick View"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Product Count Pill Badge */}
        {showProductCount && (
          <div className="absolute bottom-3 left-3 z-10">
            <div className="bg-white/90 backdrop-blur-md text-[#8C6D2B] border border-[#C5A059]/40 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">
              {category.productCount} Curated Pieces
            </div>
          </div>
        )}
      </div>

      {/* Category Info */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-serif font-semibold text-lg text-[#1C1A17] group-hover:text-[#8C6D2B] transition-colors duration-200">
              {category.name}
            </h3>
          </div>
          
          {showDescription && category.description && (
            <p className="text-[#6E685E] text-xs font-light leading-relaxed mb-4 line-clamp-2">
              {category.description}
            </p>
          )}
          
          {/* Subcategories Tags */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {category.subcategories.slice(0, 3).map(subcategory => (
                <span
                  key={subcategory.id}
                  className="inline-block bg-[#FAF8F5] text-[#7A7468] border border-[#E8E2D5] px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wide hover:border-[#C5A059] hover:text-[#1C1A17] transition-colors cursor-pointer"
                >
                  {subcategory.name}
                </span>
              ))}
              {category.subcategories.length > 3 && (
                <span className="inline-block bg-[#FAF8F5] text-[#9E988D] border border-[#E8E2D5] px-2 py-0.5 rounded-md text-[10px] font-medium">
                  +{category.subcategories.length - 3} More
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="pt-4 border-t border-[#E8E2D5]">
          <button
            onClick={() => onCategoryClick(category)}
            className="w-full inline-flex items-center justify-between px-4 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl"
          >
            <span>Explore Department</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;