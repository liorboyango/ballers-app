/**
 * AdminInventory — Inventory Management screen.
 * Pulls live products from GET /api/products.
 * Includes tabs: Products (existing), Import from Yupoo (new).
 */
import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import ProductFormModal from './ProductFormModal';
import YupooImportPage from './YupooImportPage';
import { useProducts } from '../../hooks/useProducts';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

const PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 10;

const TABS = ['products', 'yupoo-import'];

const KIT_ICON = {
  home: '🟢',
  away: '🔵',
  third: '🟣',
  goalkeeper: '🟡',
};

const teamLabel = (team) =>
  typeof team === 'object' ? team?.name || team?.country || '—' : team || '—';

const inferStock = (p) => {
  if (typeof p.stock === 'number') return p.stock;
  if (typeof p.stockQuantity === 'number') return p.stockQuantity;
  if (Array.isArray(p.sizes)) {
    return p.sizes.reduce((sum, s) => sum + (s.stock || s.quantity || 0), 0);
  }
  return p.inStock === false ? 0 : 100;
};

const inferSku = (p) => {
  if (p.sku) return p.sku;
  const team = teamLabel(p.team).slice(0, 3).toUpperCase();
  const kit = (p.kitType || '').slice(0, 1).toUpperCase();
  const tail = (p._id || p.id || '').slice(-4).toUpperCase();
  return [team, kit, tail].filter(Boolean).join('-');
};

const stockStatus = (stock) => {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= LOW_STOCK_THRESHOLD) return 'Low Stock';
  return 'In Stock';
};

function StockBar({ stock, max, status }) {
  const pct = Math.min(100, (stock / Math.max(1, max)) * 100);
  const tone =
    status === 'In Stock'
      ? 'bg-brand'
      : status === 'Low Stock'
      ? 'bg-accent-danger'
      : 'bg-line-strong';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} aria-hidden="true" />
      </div>
      <span className={`text-sm font-semibold ${status === 'Low Stock' ? 'text-accent-danger' : 'text-ink'}`}>
        {stock}
      </span>
    </div>
  );
}

function StatusPill({ status }) {
  if (status === 'In Stock') return <span className="badge-instock">In Stock</span>;
  if (status === 'Low Stock') return <span className="badge-lowstock">Low Stock</span>;
  return <span className="badge-outstock">Out of Stock</span>;
}

function AdminInventory() {
  const [activeTab, setActiveTab] = useState('products');
  const [hasUsedImport, setHasUsedImport] = useState(() => {
    return localStorage.getItem('ballers_yupoo_import_used') === 'true';
  });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const toast = useToast();

  const { products, pagination, loading, error, setParams, refetch } = useProducts({
    page: 1,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    const params = { page, limit: PAGE_SIZE };
    if (debouncedQuery.trim()) params.search = debouncedQuery.trim();
    setParams(params);
  }, [page, debouncedQuery, setParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'yupoo-import' && !hasUsedImport) {
      setHasUsedImport(true);
      localStorage.setItem('ballers_yupoo_import_used', 'true');
    }
  };

  const rows = useMemo(
    () =>
      products.map((p) => {
        const stock = inferStock(p);
        const status = stockStatus(stock);
        return {
          id: p._id || p.id,
          name: p.name,
          sub: [teamLabel(p.team), p.kitType && p.kitType.replace(/^./, (c) => c.toUpperCase())]
            .filter(Boolean)
            .join(' · '),
          sku: inferSku(p),
          stock,
          max: 500,
          price: typeof p.price === 'number' ? p.price : 0,
          status,
          icon: KIT_ICON[p.kitType] || '⚪',
        };
      }),
    [products]
  );

  const totalSkus = pagination?.total ?? rows.length;
  const lowStockCount = rows.filter((r) => r.status !== 'In Stock').length;
  const inventoryValue = rows.reduce((sum, r) => sum + r.price * r.stock, 0);

  const totalPages = pagination?.totalPages ?? pagination?.pages ?? 1;
  const showingFrom = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = (page - 1) * PAGE_SIZE + rows.length;

  return (
    <AdminLayout
      title="Inventory Management"
      subtitle="Manage your World Cup kits, track stock levels, and update pricing."
      actions={
        activeTab === 'products' ? (
          <>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SKU or Team..."
                className="input-field pl-9 w-64 text-sm"
                aria-label="Search inventory"
              />
            </div>
            <button className="btn-secondary py-2.5 px-3.5 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filter
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary py-2.5 px-4 text-sm"
            >
              <span className="text-base leading-none">+</span> Add New Product
            </button>
          </>
        ) : null
      }
    >
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-line mb-6" role="tablist" aria-label="Inventory tabs">
        <button
          role="tab"
          aria-selected={activeTab === 'products'}
          aria-controls="tab-panel-products"
          id="tab-products"
          onClick={() => handleTabChange('products')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-md border-b-2 transition-colors -mb-px ${
            activeTab === 'products'
              ? 'border-brand text-brand bg-brand-50/40'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
          }`}
        >
          Products
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'yupoo-import'}
          aria-controls="tab-panel-yupoo"
          id="tab-yupoo"
          onClick={() => handleTabChange('yupoo-import')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-md border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
            activeTab === 'yupoo-import'
              ? 'border-brand text-brand bg-brand-50/40'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
          }`}
        >
          Import from Yupoo
          {!hasUsedImport && (
            <span className="ml-0.5 text-[10px] bg-brand text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              New
            </span>
          )}
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div
          id="tab-panel-products"
          role="tabpanel"
          aria-labelledby="tab-products"
        >
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card p-5">
              <div className="flex items-start justify-between">
                <span className="text-sm text-ink-muted">Total SKUs</span>
                <span className="text-ink-faint" aria-hidden="true">📋</span>
              </div>
              <p className="text-3xl font-bold text-ink mt-2">
                {loading ? '—' : totalSkus.toLocaleString()}
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-start justify-between">
                <span className="text-sm text-ink-muted">Low Stock Alerts</span>
                <span className="text-ink-faint" aria-hidden="true">⚠</span>
              </div>
              <p className="text-3xl font-bold text-accent-danger mt-2">
                {loading ? '—' : lowStockCount}
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-start justify-between">
                <span className="text-sm text-ink-muted">Inventory Value (page)</span>
                <span className="text-ink-faint" aria-hidden="true">💼</span>
              </div>
              <p className="text-3xl font-bold text-ink mt-2">
                {loading ? '—' : formatCurrency(inventoryValue)}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {error && (
              <div className="px-5 py-3 bg-red-50 text-accent-danger text-sm border-b border-line">
                {error}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-ink-muted bg-surface-muted border-b border-line">
                    <th className="py-3 px-5 font-semibold">Team Product</th>
                    <th className="py-3 px-4 font-semibold">SKU</th>
                    <th className="py-3 px-4 font-semibold">Stock Level</th>
                    <th className="py-3 px-4 font-semibold">Price</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-ink-muted text-sm">
                        Loading products…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-ink-muted text-sm">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface-muted/50">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-lg bg-surface-sunken flex items-center justify-center text-base">
                              {p.icon}
                            </span>
                            <div>
                              <div className="font-semibold text-ink">{p.name}</div>
                              <div className="text-xs text-ink-muted">{p.sub}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-ink-soft font-mono text-xs">{p.sku}</td>
                        <td className="py-3 px-4">
                          <StockBar stock={p.stock} max={p.max} status={p.status} />
                        </td>
                        <td className="py-3 px-4 font-semibold text-ink">{formatCurrency(p.price)}</td>
                        <td className="py-3 px-4">
                          <StatusPill status={p.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-ink-faint hover:text-ink p-1" aria-label="Actions">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="5" cy="12" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="19" cy="12" r="1.5" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-line">
              <span className="text-xs text-ink-muted">
                {rows.length === 0
                  ? 'No entries'
                  : `Showing ${showingFrom} to ${showingTo} of ${totalSkus.toLocaleString()} entries`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-line bg-white text-ink-soft hover:text-ink hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-ink-muted px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-line bg-white text-ink-soft hover:text-ink hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yupoo Import Tab */}
      {activeTab === 'yupoo-import' && (
        <div
          id="tab-panel-yupoo"
          role="tabpanel"
          aria-labelledby="tab-yupoo"
        >
          <YupooImportPage />
        </div>
      )}

      <ProductFormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(p) => {
          toast.success(`Product "${p?.name || 'New product'}" created.`);
          setPage(1);
          refetch();
        }}
      />
    </AdminLayout>
  );
}

export default AdminInventory;
