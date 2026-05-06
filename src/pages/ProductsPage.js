/**
 * Products Page — light theme product grid with filter sidebar.
 * Products and their imagery come from the backend via useProducts.
 */
import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KIT_TYPES, SIZES } from '../utils/constants';
import { useProducts } from '../hooks/useProducts';
import { getProductImage } from '../utils/imageUrl';

function ProductCard({ product }) {
  const id = product._id || product.id;
  const img = getProductImage(product);
  const teamName =
    (typeof product.team === 'object' && product.team?.name) ||
    product.teamName ||
    '';

  return (
    <div className="card overflow-hidden flex flex-col group hover:shadow-card-hover transition-shadow">
      <div className="relative aspect-[4/5] bg-surface-sunken overflow-hidden">
        {product.isNew && (
          <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-brand text-white">
            NEW
          </span>
        )}
        {product.isSale && (
          <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-danger text-white">
            SALE
          </span>
        )}

        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl" aria-hidden="true">👕</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {teamName && <p className="text-[11px] uppercase tracking-wider text-ink-muted">{teamName}</p>}
        <h3 className="font-semibold text-ink leading-tight mt-1">
          <Link to={`/product/${id}`} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>
        <p className="font-bold text-ink mt-1">${Number(product.price ?? 0).toFixed(2)}</p>

        <Link
          to={`/product/${id}`}
          className="mt-4 text-sm font-semibold py-2 rounded-lg bg-surface-muted hover:bg-surface-sunken text-ink-soft transition-colors text-center"
        >
          View & Customize
        </Link>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/5] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 rounded skeleton" />
        <div className="h-4 w-2/3 rounded skeleton" />
        <div className="h-9 w-full rounded skeleton" />
      </div>
    </div>
  );
}

function FiltersSidebar({ filters, onFilterChange }) {
  return (
    <aside className="w-full lg:w-60 flex-shrink-0">
      <div className="bg-white border border-line rounded-xl p-5 sticky top-20">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">Filters</h2>

        <div className="mb-5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
            Kit Type
          </h3>
          <div className="space-y-1">
            <label className="flex items-center gap-2.5 cursor-pointer py-1">
              <input
                type="radio"
                name="kitType"
                value=""
                checked={!filters.kitType}
                onChange={() => onFilterChange('kitType', '')}
                className="w-4 h-4 border-line text-brand focus:ring-brand/40"
              />
              <span className="text-sm text-ink-soft">All Types</span>
            </label>
            {KIT_TYPES.map((type) => (
              <label key={type.value} className="flex items-center gap-2.5 cursor-pointer py-1">
                <input
                  type="radio"
                  name="kitType"
                  value={type.value}
                  checked={filters.kitType === type.value}
                  onChange={() => onFilterChange('kitType', type.value)}
                  className="w-4 h-4 border-line text-brand focus:ring-brand/40"
                />
                <span className="text-sm text-ink-soft">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
            Size
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onFilterChange('size', filters.size === size ? '' : size)}
                className={`size-btn text-xs ${filters.size === size ? 'size-btn-selected' : ''}`}
                aria-pressed={filters.size === size}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
            Price Range
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted">${filters.minPrice}</span>
            <input
              type="range"
              min="0"
              max="300"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', Number(e.target.value))}
              className="flex-1 accent-brand"
              aria-label="Maximum price"
            />
            <span className="text-xs text-ink-muted">${filters.maxPrice}</span>
          </div>
        </div>

        <button
          onClick={() => onFilterChange('reset', null)}
          className="btn-secondary w-full mt-5 text-sm py-2"
        >
          Clear Filters
        </button>
      </div>
    </aside>
  );
}

function ProductsPage() {
  const { teamId } = useParams();
  const [filters, setFilters] = useState({ kitType: '', size: '', minPrice: 0, maxPrice: 300 });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const apiParams = useMemo(() => {
    const p = { limit: 24 };
    if (teamId) p.teamId = teamId;
    if (filters.kitType) p.kitType = filters.kitType;
    if (filters.size) p.size = filters.size;
    if (filters.minPrice) p.minPrice = filters.minPrice;
    if (filters.maxPrice && filters.maxPrice < 300) p.maxPrice = filters.maxPrice;
    return p;
  }, [teamId, filters]);

  const { products, loading, error } = useProducts(apiParams);

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({ kitType: '', size: '', minPrice: 0, maxPrice: 300 });
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const teamName = teamId
    ? (products || []).find((p) => (p._id || p.id) === teamId)?.team?.name ||
      (products || []).find((p) => (p._id || p.id) === teamId)?.teamName
    : null;
  const heading = teamName ? `${teamName} Kits` : 'All Kits';

  return (
    <div className="page-enter min-h-screen">
      <div className="container-ballers py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block">
            <FiltersSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-display text-3xl text-ink">{heading}</h1>
                <p className="text-sm text-ink-muted mt-1">
                  {loading ? 'Loading…' : `${(products || []).length} product${(products || []).length === 1 ? '' : 's'}`}
                </p>
              </div>

              <button
                onClick={() => setIsFilterDrawerOpen((v) => !v)}
                className="lg:hidden btn-secondary text-sm py-2 px-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
                </svg>
                Filters
              </button>
            </div>

            {isFilterDrawerOpen && (
              <div className="lg:hidden mb-6">
                <FiltersSidebar filters={filters} onFilterChange={handleFilterChange} />
              </div>
            )}

            {error ? (
              <div className="card p-10 text-center">
                <p className="text-accent-danger text-sm">
                  {typeof error === 'string' ? error : 'Failed to load products.'}
                </p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : (products || []).length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-ink-muted">No products match your filters.</p>
                <button onClick={() => handleFilterChange('reset', null)} className="btn-secondary mt-4">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {(products || []).map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
