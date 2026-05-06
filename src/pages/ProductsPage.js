/**
 * Products Page
 * Displays products with optional team filter.
 * Includes sidebar filters for kit type, size, and price range.
 */
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KIT_TYPES, SIZES } from '../utils/constants';

/**
 * Product Card component.
 */
function ProductCard({ product }) {
  const [selectedSize, setSelectedSize] = useState('');

  return (
    <div className="card p-0 overflow-hidden group">
      {/* Image container */}
      <div className="relative aspect-[3/4] bg-navy-deep overflow-hidden">
        {/* Badge */}
        {product.isNew && (
          <span className="badge-new absolute top-3 left-3 z-10">NEW</span>
        )}
        {product.isSale && (
          <span className="badge-sale absolute top-3 left-3 z-10">SALE</span>
        )}

        {/* Product image */}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl" aria-hidden="true">👕</span>
          </div>
        )}

        {/* Quick add overlay */}
        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100
                        transition-opacity duration-200 flex items-end justify-center pb-4">
          <Link
            to={`/product/${product.id}`}
            className="btn-primary text-sm py-2 px-4"
          >
            Quick View
          </Link>
        </div>
      </div>

      {/* Product info */}
      <div className="p-4">
        <p className="text-ballers-muted text-xs uppercase tracking-widest mb-1">
          {product.teamName}
        </p>
        <h3 className="font-semibold text-white text-base leading-tight">{product.name}</h3>
        <p className="text-gold font-bold text-lg mt-1">${product.price.toFixed(2)}</p>

        {/* Size selector */}
        <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="Select size">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`size-btn text-xs px-2 py-1 ${
                selectedSize === size ? 'size-btn-selected' : ''
              }`}
              aria-pressed={selectedSize === size}
              aria-label={`Size ${size}`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Add to cart */}
        <Link
          to={`/product/${product.id}`}
          className="btn-primary w-full mt-4 text-sm py-2.5 text-center block"
        >
          View & Customize
        </Link>
      </div>
    </div>
  );
}

/**
 * Skeleton product card.
 */
function ProductCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="skeleton aspect-[3/4]" aria-hidden="true" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-1/3 rounded" aria-hidden="true" />
        <div className="skeleton h-5 w-3/4 rounded" aria-hidden="true" />
        <div className="skeleton h-6 w-1/4 rounded" aria-hidden="true" />
        <div className="flex gap-1.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton h-7 w-10 rounded" aria-hidden="true" />
          ))}
        </div>
        <div className="skeleton h-10 w-full rounded-md" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * Filters sidebar component.
 */
function FiltersSidebar({ filters, onFilterChange }) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0" aria-label="Product filters">
      <div className="bg-navy-surface border border-ballers-border rounded-xl p-6 sticky top-24">
        <h2 className="font-bebas text-xl text-white tracking-wider mb-6">FILTERS</h2>

        {/* Kit Type */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            Kit Type
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="kitType"
                value=""
                checked={!filters.kitType}
                onChange={() => onFilterChange('kitType', '')}
                className="accent-gold"
              />
              <span className="text-ballers-muted text-sm">All Types</span>
            </label>
            {KIT_TYPES.map((type) => (
              <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="kitType"
                  value={type.value}
                  checked={filters.kitType === type.value}
                  onChange={() => onFilterChange('kitType', type.value)}
                  className="accent-gold"
                />
                <span className="text-ballers-muted text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            Size
          </h3>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onFilterChange('size', filters.size === size ? '' : size)}
                className={`size-btn ${
                  filters.size === size ? 'size-btn-selected' : ''
                }`}
                aria-pressed={filters.size === size}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            Price Range
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-ballers-muted text-sm">${filters.minPrice}</span>
            <input
              type="range"
              min="0"
              max="300"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', Number(e.target.value))}
              className="flex-1 accent-gold"
              aria-label="Maximum price"
            />
            <span className="text-ballers-muted text-sm">${filters.maxPrice}</span>
          </div>
        </div>

        {/* Clear filters */}
        <button
          onClick={() => onFilterChange('reset', null)}
          className="btn-secondary w-full mt-6 text-sm py-2"
        >
          Clear Filters
        </button>
      </div>
    </aside>
  );
}

/**
 * Products Page - main component.
 */
function ProductsPage() {
  const { teamId } = useParams();
  const [filters, setFilters] = useState({
    kitType: '',
    size: '',
    minPrice: 0,
    maxPrice: 300,
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Placeholder products - will be replaced with API data in task 5
  const products = [
    { id: '1', name: 'Brazil Home Kit 2026', teamName: 'Brazil', price: 129.99, isNew: true, isSale: false, image: '' },
    { id: '2', name: 'Brazil Away Kit 2026', teamName: 'Brazil', price: 119.99, isNew: false, isSale: true, image: '' },
    { id: '3', name: 'Argentina Home Kit 2026', teamName: 'Argentina', price: 129.99, isNew: true, isSale: false, image: '' },
    { id: '4', name: 'France Home Kit 2026', teamName: 'France', price: 134.99, isNew: true, isSale: false, image: '' },
    { id: '5', name: 'England Home Kit 2026', teamName: 'England', price: 124.99, isNew: false, isSale: false, image: '' },
    { id: '6', name: 'Germany Home Kit 2026', teamName: 'Germany', price: 129.99, isNew: true, isSale: false, image: '' },
  ];

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({ kitType: '', size: '', minPrice: 0, maxPrice: 300 });
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  // Team name for display
  const teamName = teamId ? products.find(p => p.id === teamId)?.teamName || 'Team' : null;

  return (
    <div className="page-enter min-h-screen">
      {/* Page Header */}
      <div className="bg-navy-surface border-b border-ballers-border py-8">
        <div className="container-ballers">
          <div className="flex items-center gap-4">
            {teamId && (
              <Link
                to="/teams"
                className="text-ballers-muted hover:text-gold transition-colors text-sm"
                aria-label="Back to teams"
              >
                ← Back
              </Link>
            )}
            <div>
              <h1 className="font-bebas text-section text-white">
                {teamName ? `${teamName.toUpperCase()} KITS` : 'ALL KITS'}
              </h1>
              <p className="text-ballers-muted text-sm mt-1">
                {products.length} products
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden bg-navy border-b border-ballers-border py-3">
        <div className="container-ballers">
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="btn-secondary text-sm py-2 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {isFilterDrawerOpen && (
        <div className="lg:hidden bg-navy border-b border-ballers-border p-4">
          <div className="container-ballers">
            <FiltersSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container-ballers py-8">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FiltersSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Products grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
