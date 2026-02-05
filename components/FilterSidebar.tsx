// Advanced Filter Sidebar Component
'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import './FilterSidebar.css';

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  materials: string[];
  regions: string[];
  sizes: string[];
  sortBy: string;
}

interface FilterSidebarProps {
  categories: { id: string; name: string }[];
  materials: string[];
  regions: string[];
  sizes: string[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterSidebar({
  categories,
  materials,
  regions,
  sizes,
  filters,
  onFilterChange,
  onClearAll,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'categories',
    'price',
    'material',
    'region',
    'size',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePriceChange = (min: number, max: number) => {
    onFilterChange({ ...filters, priceRange: [min, max] });
  };

  const handleMaterialToggle = (material: string) => {
    const newMaterials = filters.materials.includes(material)
      ? filters.materials.filter((m) => m !== material)
      : [...filters.materials, material];
    onFilterChange({ ...filters, materials: newMaterials });
  };

  const handleRegionToggle = (region: string) => {
    const newRegions = filters.regions.includes(region)
      ? filters.regions.filter((r) => r !== region)
      : [...filters.regions, region];
    onFilterChange({ ...filters, regions: newRegions });
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: newSizes });
  };

  const activeFilterCount =
    filters.categories.length +
    filters.materials.length +
    filters.regions.length +
    filters.sizes.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ? 1 : 0);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="filter-overlay" onClick={onClose} />}

      <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="filter-header">
          <div className="filter-title">
            <SlidersHorizontal size={20} />
            <h3>Filters</h3>
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Sort By */}
        <div className="filter-section">
          <label className="sort-label">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="featured">Featured</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Categories */}
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('categories')}
          >
            <span>Categories</span>
            {expandedSections.includes('categories') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.includes('categories') && (
            <div className="section-content">
              {categories.map((category) => (
                <label key={category.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  <span className="checkmark" />
                  <span className="label-text">{category.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('price')}
          >
            <span>Price Range</span>
            {expandedSections.includes('price') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.includes('price') && (
            <div className="section-content">
              <div className="price-inputs">
                <div className="price-input-group">
                  <label>Min</label>
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                      handlePriceChange(Number(e.target.value), filters.priceRange[1])
                    }
                    min="0"
                    max={filters.priceRange[1]}
                  />
                </div>
                <span className="price-separator">-</span>
                <div className="price-input-group">
                  <label>Max</label>
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      handlePriceChange(filters.priceRange[0], Number(e.target.value))
                    }
                    min={filters.priceRange[0]}
                  />
                </div>
              </div>
              <div className="price-presets">
                {[
                  { label: 'Under $100', min: 0, max: 100 },
                  { label: '$100 - $500', min: 100, max: 500 },
                  { label: '$500 - $1000', min: 500, max: 1000 },
                  { label: 'Over $1000', min: 1000, max: 10000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    className={`preset-btn ${
                      filters.priceRange[0] === preset.min &&
                      filters.priceRange[1] === preset.max
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => handlePriceChange(preset.min, preset.max)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Materials */}
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('material')}
          >
            <span>Material</span>
            {expandedSections.includes('material') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.includes('material') && (
            <div className="section-content">
              {materials.map((material) => (
                <label key={material} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.materials.includes(material)}
                    onChange={() => handleMaterialToggle(material)}
                  />
                  <span className="checkmark" />
                  <span className="label-text">{material}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Regions */}
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('region')}
          >
            <span>Region</span>
            {expandedSections.includes('region') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.includes('region') && (
            <div className="section-content">
              {regions.map((region) => (
                <label key={region} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.regions.includes(region)}
                    onChange={() => handleRegionToggle(region)}
                  />
                  <span className="checkmark" />
                  <span className="label-text">{region}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Sizes */}
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('size')}
          >
            <span>Size</span>
            {expandedSections.includes('size') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.includes('size') && (
            <div className="section-content">
              {sizes.map((size) => (
                <label key={size} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.sizes.includes(size)}
                    onChange={() => handleSizeToggle(size)}
                  />
                  <span className="checkmark" />
                  <span className="label-text">{size}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Clear All */}
        <div className="filter-footer">
          <button className="clear-btn" onClick={onClearAll}>
            Clear All Filters
          </button>
        </div>
      </aside>
    </>
  );
}

