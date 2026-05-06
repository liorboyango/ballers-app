/**
 * AdminInventory — Inventory Management screen.
 * Matches admin_panel_inventory_screen.png.
 */
import React, { useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';

const PRODUCTS = [
  { id: 'p1', name: "Brazil Home Kit '24", sub: 'Authentic Edition', sku: 'BRA-H24-AUTH-L', stock: 425, max: 500, price: 160, status: 'In Stock', icon: '🟡' },
  { id: 'p2', name: "France Away Kit '24", sub: 'Replica Edition', sku: 'FRA-A24-REP-M', stock: 12, max: 500, price: 95, status: 'Low Stock', icon: '🔵' },
  { id: 'p3', name: "Argentina Home Kit '24", sub: 'Player Issue', sku: 'ARG-H24-PLY-XL', stock: 0, max: 500, price: 180, status: 'Out of Stock', icon: '🔵' },
  { id: 'p4', name: "Japan Away Kit '24", sub: 'Authentic Edition', sku: 'JPN-A24-AUTH-S', stock: 118, max: 500, price: 160, status: 'In Stock', icon: '⚪' },
];

function StockBar({ stock, max, status }) {
  const pct = Math.min(100, (stock / max) * 100);
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
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <AdminLayout
      title="Inventory Management"
      subtitle="Manage your World Cup kits, track stock levels, and update pricing."
      actions={
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
          <button className="btn-primary py-2.5 px-4 text-sm">
            <span className="text-base leading-none">+</span> Add New Product
          </button>
        </>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <span className="text-sm text-ink-muted">Total SKUs</span>
            <span className="text-ink-faint" aria-hidden="true">📋</span>
          </div>
          <p className="text-3xl font-bold text-ink mt-2">1,248</p>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <span className="text-sm text-ink-muted">Low Stock Alerts</span>
            <span className="text-ink-faint" aria-hidden="true">⚠</span>
          </div>
          <p className="text-3xl font-bold text-accent-danger mt-2">14</p>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <span className="text-sm text-ink-muted">Inventory Value</span>
            <span className="text-ink-faint" aria-hidden="true">💼</span>
          </div>
          <p className="text-3xl font-bold text-ink mt-2">$452.8k</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
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
              {filtered.map((p) => (
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
                  <td className="py-3 px-4 font-semibold text-ink">${p.price.toFixed(2)}</td>
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-line">
          <span className="text-xs text-ink-muted">
            Showing 1 to {filtered.length} of 1,248 entries
          </span>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-line bg-white text-ink-soft hover:text-ink hover:bg-surface-muted" aria-label="Previous page">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-line bg-white text-ink-soft hover:text-ink hover:bg-surface-muted" aria-label="Next page">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminInventory;
