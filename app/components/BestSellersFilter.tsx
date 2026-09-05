import React, { useState, useEffect } from 'react';
import { FilterState, FilterOptions } from '../types/best-sellers';
import { Star, X, Filter, Award, ChevronDown, ChevronRight } from 'lucide-react';
import { apiUrl } from '../common/http';

interface CategoryNode {
  id: number | string;
  name: string;
  children?: CategoryNode[];
}

interface BestSellersFilterProps {
  filters: FilterState;
  filterOptions: FilterOptions;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const BestSellersFilter: React.FC<BestSellersFilterProps> = ({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
  isOpen,
  onClose
}) => {
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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

  const handleAvailabilityChange = (availability: FilterState['availability']) => {
    onFilterChange({ ...filters, availability });
  };

  const handleTimeFrameChange = (timeFrame: FilterState['timeFrame']) => {
    onFilterChange({ ...filters, timeFrame });
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

  const renderCategoryTreeNode = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedCategories[String(node.id)];
    const isChecked = filters.categories.includes(node.name);

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between py-1 px-1 rounded hover:bg-gray-50 transition-colors text-xs text-gray-700 cursor-pointer ${
            isChecked ? 'font-bold text-yellow-600 bg-yellow-50/50' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => handleCategoryChange(node.name)}
        >
          <div className="flex items-center gap-2 overflow-hidden pr-1">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => {}}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="truncate">{node.name}</span>
          </div>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1 border-l border-gray-100 ml-3">
            {node.children!.map((child) => renderCategoryTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.ratings.length > 0 ||
    filters.tags.length > 0 ||
    filters.priceRange[0] > filterOptions.priceRange.min ||
    filters.priceRange[1] < filterOptions.priceRange.max ||
    filters.availability !== 'all' ||
    filters.timeFrame !== 'all-time';

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
              <Award className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Best Sellers</h2>
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

          {/* Time Frame */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Time Frame</h3>
            <div className="space-y-2">
              {(['all-time', 'monthly', 'weekly', 'daily'] as const).map(timeFrame => (
                <label key={timeFrame} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFrame"
                    checked={filters.timeFrame === timeFrame}
                    onChange={() => handleTimeFrameChange(timeFrame)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">
                    {timeFrame === 'all-time' ? 'All Time' : 
                     timeFrame === 'monthly' ? 'This Month' :
                     timeFrame === 'weekly' ? 'This Week' : 'Today'}
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

          {/* Categories */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Categories</h3>
            {categoryTree.length > 0 ? (
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {categoryTree.map((node) => renderCategoryTreeNode(node))}
              </div>
            ) : (
              <div className="space-y-2">
                {(filterOptions.categories || []).map((category: string) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            )}
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
            <h3 className="font-medium mb-3">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(filterOptions.tags || []).map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BestSellersFilter;