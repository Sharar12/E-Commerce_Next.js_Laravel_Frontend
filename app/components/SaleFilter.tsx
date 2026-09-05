import React, { useState, useEffect } from 'react';
import { FilterState, FilterOptions } from '../types/sale';
import { Star, X, Filter, Tag, Zap, AlertTriangle, Flame, ChevronDown, ChevronRight } from 'lucide-react';
import { apiUrl } from '../common/http';

interface CategoryNode {
  id: number | string;
  name: string;
  children?: CategoryNode[];
}

interface SaleFilterProps {
  filters: FilterState;
  filterOptions: FilterOptions;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const SaleFilter: React.FC<SaleFilterProps> = ({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
  isOpen,
  onClose
}) => {
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Fetch full category tree from API
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch(`${apiUrl}/categories/tree`);
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          setCategoryTree(data);
          setExpandedCategories({});
        }
      } catch (err) {
        console.error("Failed to load category tree:", err);
      }
    };
    fetchTree();
  }, []);

  const toggleExpand = (catId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [String(catId)]: !prev[String(catId)],
    }));
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleBrandChange = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    
    onFilterChange({ ...filters, brands: newBrands });
  };

  const handleRatingChange = (rating: number) => {
    const newRatings = filters.ratings.includes(rating)
      ? filters.ratings.filter(r => r !== rating)
      : [...filters.ratings, rating];
    
    onFilterChange({ ...filters, ratings: newRatings });
  };

  const handleTagChange = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFilterChange({ ...filters, tags: newTags });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    onFilterChange({ ...filters, priceRange: [min, max] });
  };

  const handleDiscountRangeChange = (min: number, max: number) => {
    onFilterChange({ ...filters, discountRange: [min, max] });
  };

  const handleAvailabilityChange = (availability: FilterState['availability']) => {
    onFilterChange({ ...filters, availability });
  };

  const handleDiscountTypeChange = (type: 'percentage' | 'fixed' | 'clearance') => {
    const newTypes = filters.discountType.includes(type)
      ? filters.discountType.filter(t => t !== type)
      : [...filters.discountType, type];
    
    onFilterChange({ ...filters, discountType: newTypes });
  };

  const handleSaleTypeChange = (saleType: FilterState['saleType']) => {
    onFilterChange({ ...filters, saleType });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.ratings.length > 0 ||
    filters.tags.length > 0 ||
    filters.priceRange[0] > filterOptions.priceRange.min ||
    filters.priceRange[1] < filterOptions.priceRange.max ||
    filters.discountRange[0] > filterOptions.discountRange.min ||
    filters.discountRange[1] < filterOptions.discountRange.max ||
    filters.availability !== 'all' ||
    filters.discountType.length < 3 ||
    filters.saleType !== 'all';

  // Render tree node with expand/collapse toggle for sub & child categories
  const renderCategoryNode = (node: CategoryNode, depth: number = 0) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = !!expandedCategories[String(node.id)];
    const isChecked = filters.categories.includes(node.name);

    return (
      <div key={String(node.id)} className="space-y-1">
        <div className={`flex items-center justify-between py-1 rounded-md hover:bg-gray-50 px-1 ${depth === 1 ? 'ml-3' : depth >= 2 ? 'ml-6' : ''}`}>
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleCategoryChange(node.name)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm ${depth === 0 ? 'font-medium text-[#1C1A17]' : 'text-gray-700'}`}>
              {node.name}
            </span>
          </label>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-1 text-gray-500 hover:text-black hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#8C6D2B]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#8C6D2B]" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1 border-l border-gray-200 ml-2 pl-1">
            {node.children!.map((child) => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-full lg:h-auto w-80 lg:w-64 bg-white z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto lg:overflow-visible border-r border-gray-200
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Sale Filters</h2>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sale Type */}
<div className="mb-6">
  <h3 className="font-medium mb-3">Sale Type</h3>
  <div className="space-y-2">
    {([
      { value: 'all', label: 'All Sales', icon: Tag },
      { value: 'flash-sale', label: 'Flash Sale', icon: Zap },
      { value: 'clearance', label: 'Clearance', icon: AlertTriangle }
    ] as const).map(({ value, label, icon: Icon }) => (
      <label key={value} className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="saleType"
          checked={filters.saleType === value}
          onChange={() => handleSaleTypeChange(value)}
          className="text-blue-600 focus:ring-blue-500"
        />
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </label>
    ))}
  </div>
</div>

          {/* Discount Type */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Discount Type</h3>
            <div className="space-y-2">
              {(['percentage', 'fixed', 'clearance'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.discountType.includes(type)}
                    onChange={() => handleDiscountTypeChange(type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">
                    {type === 'fixed' ? 'Fixed Amount' : type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Price Range</h3>
            <div className="space-y-4">
              <input
                type="range"
                min={filterOptions.priceRange.min}
                max={filterOptions.priceRange.max}
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceRangeChange(filters.priceRange[0], parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Discount Range */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Discount Range</h3>
            <div className="space-y-4">
              <input
                type="range"
                min={filterOptions.discountRange.min}
                max={filterOptions.discountRange.max}
                value={filters.discountRange[1]}
                onChange={(e) => handleDiscountRangeChange(filters.discountRange[0], parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{filters.discountRange[0]}%</span>
                <span>{filters.discountRange[1]}%</span>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Availability</h3>
            <div className="space-y-2">
              {(['all', 'in-stock', 'out-of-stock'] as const).map(availability => (
                <label key={availability} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.availability === availability}
                    onChange={() => handleAvailabilityChange(availability)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">
                    {availability === 'in-stock' ? 'In Stock' : 
                     availability === 'out-of-stock' ? 'Out of Stock' : 'All Products'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories with Expand/Collapse Sub & Child Categories */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Categories</h3>
            <div className="space-y-1">
              {categoryTree.length > 0 ? (
                categoryTree.map((cat) => renderCategoryNode(cat, 0))
              ) : (
                (filterOptions.categories || []).map((category: string) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Brands */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Brands</h3>
            <div className="space-y-2">
              {(filterOptions.brands || []).map((brand: string) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => handleBrandChange(brand)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Customer Ratings</h3>
            <div className="space-y-2">
              {[5, 4, 3].map(rating => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.ratings.includes(rating)}
                    onChange={() => handleRatingChange(rating)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    {renderStars(rating)}
                    <span className="text-sm text-gray-600">& Up</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Sale Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(filterOptions.tags || []).map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SaleFilter;