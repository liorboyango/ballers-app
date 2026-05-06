/**
 * AdminOverview — Dashboard Overview screen.
 * KPIs, sales chart, and recent orders pulled live from the backend.
 */
import React, { useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency, formatDate } from '../../utils/formatters';

const LOW_STOCK_THRESHOLD = 10;
const ACTIVE_STATUSES = new Set(['pending', 'processing', 'paid', 'confirmed']);

const inferStock = (p) => {
  if (typeof p.stock === 'number') return p.stock;
  if (typeof p.stockQuantity === 'number') return p.stockQuantity;
  if (Array.isArray(p.sizes)) {
    return p.sizes.reduce((sum, s) => sum + (s.stock || s.quantity || 0), 0);
  }
  return p.inStock === false ? 0 : 100;
};

const orderTotal = (o) =>
  typeof o.totalAmount === 'number'
    ? o.totalAmount
    : typeof o.total === 'number'
    ? o.total
    : 0;

const orderDate = (o) => {
  const raw = o.createdAt || o.created_at || o.date || o.placedAt;
  return raw ? new Date(raw) : null;
};

const orderCustomer = (o) => {
  const a = o.shippingAddress;
  if (a?.firstName || a?.lastName) {
    return `${a.firstName || ''} ${a.lastName || ''}`.trim();
  }
  return o.user?.name || a?.email || o.email || '—';
};

const orderStatusLabel = (s) => {
  if (!s) return 'Processing';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const STATUS_TONE = {
  Processing: 'bg-brand-50 text-brand',
  Pending: 'bg-brand-50 text-brand',
  Paid: 'bg-brand-50 text-brand',
  Confirmed: 'bg-brand-50 text-brand',
  Shipped: 'bg-blue-50 text-blue-700',
  Delivered: 'bg-surface-sunken text-ink-soft',
  Cancelled: 'bg-red-50 text-accent-danger',
};

function MiniChart({ buckets }) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const width = 660;
  const height = 110;
  const stepX = buckets.length > 1 ? width / (buckets.length - 1) : 0;

  const points = buckets.map((b, i) => [
    Math.round(i * stepX),
    Math.round(height - (b.value / max) * (height - 10) - 5),
  ]);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = points.length
    ? `${path} L ${points[points.length - 1][0]} ${height} L 0 ${height} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1F6E3A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1F6E3A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill="url(#g1)" />}
      {path && (
        <path
          d={path}
          fill="none"
          stroke="#1F6E3A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r="4"
          fill="#1F6E3A"
        />
      )}
    </svg>
  );
}

function AdminOverview() {
  const [chartView, setChartView] = useState('Revenue');

  const { orders, loading: ordersLoading, error: ordersError } = useOrders({
    page: 1,
    limit: 100,
    sort: '-createdAt',
  });
  const { products, loading: productsLoading } = useProducts({ page: 1, limit: 100 });

  const lowStockCount = useMemo(
    () => products.filter((p) => inferStock(p) <= LOW_STOCK_THRESHOLD).length,
    [products]
  );

  const { mtdSales, activeOrders, recentOrders, chartBuckets, chartRangeLabel } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let mtd = 0;
    let active = 0;
    for (const o of orders) {
      const d = orderDate(o);
      if (d && d >= monthStart) mtd += orderTotal(o);
      const s = (o.status || '').toLowerCase();
      if (ACTIVE_STATUSES.has(s)) active += 1;
    }

    const sorted = [...orders].sort((a, b) => {
      const da = orderDate(a)?.getTime() || 0;
      const db = orderDate(b)?.getTime() || 0;
      return db - da;
    });

    const recents = sorted.slice(0, 5);

    const days = 30;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1 - i));
      return { date: d, value: 0 };
    });

    for (const o of orders) {
      const d = orderDate(o);
      if (!d) continue;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const idx = buckets.findIndex((b) => b.date.getTime() === dayStart);
      if (idx >= 0) {
        buckets[idx].value += chartView === 'Units' ? 1 : orderTotal(o);
      }
    }

    const fmtShort = (d) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const rangeLabel =
      buckets.length > 0
        ? `${fmtShort(buckets[0].date)} – ${fmtShort(buckets[buckets.length - 1].date)}`
        : '';

    return {
      mtdSales: mtd,
      activeOrders: active,
      recentOrders: recents,
      chartBuckets: buckets,
      chartRangeLabel: rangeLabel,
    };
  }, [orders, chartView]);

  const kpis = [
    {
      label: 'Total Sales (MTD)',
      value: ordersLoading ? '—' : formatCurrency(mtdSales),
      delta: ordersLoading ? ' ' : `${orders.length} order${orders.length === 1 ? '' : 's'} in window`,
      deltaTone: 'text-ink-muted',
      icon: '$',
    },
    {
      label: 'Active Orders',
      value: ordersLoading ? '—' : String(activeOrders),
      delta: ordersLoading ? ' ' : 'Pending or processing',
      deltaTone: 'text-ink-muted',
      icon: '🚚',
    },
    {
      label: 'Low Stock Alerts',
      value: productsLoading ? '—' : `${lowStockCount} Item${lowStockCount === 1 ? '' : 's'}`,
      delta: productsLoading ? ' ' : '→ Requires immediate restock',
      deltaTone: 'text-accent-danger',
      valueTone: 'text-accent-danger',
      icon: '⚠',
    },
  ];

  return (
    <AdminLayout
      title="Dashboard Overview"
      subtitle="Real-time performance metrics and recent activity."
      actions={
        <button className="btn-primary py-2.5 px-4 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v8m0 0l-3-3m3 3l3-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Export Report
        </button>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between">
              <span className="text-sm text-ink-muted">{k.label}</span>
              <span className="text-ink-faint text-lg" aria-hidden="true">{k.icon}</span>
            </div>
            <p className={`text-3xl font-bold mt-2 ${k.valueTone || 'text-ink'}`}>{k.value}</p>
            <p className={`text-xs mt-2 ${k.deltaTone}`}>{k.delta}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink">Sales Overview (Last 30 Days)</h2>
          <div className="inline-flex rounded-lg border border-line overflow-hidden text-xs">
            {['Revenue', 'Units'].map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`px-3 py-1.5 font-semibold transition-colors ${
                  chartView === v ? 'bg-ink text-white' : 'bg-white text-ink-soft hover:bg-surface-muted'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <MiniChart buckets={chartBuckets} />
        <div className="flex justify-between text-xs text-ink-muted mt-2 px-2">
          <span>{chartRangeLabel}</span>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink">Recent Orders</h2>
          <button className="text-sm text-brand font-semibold hover:underline">View All</button>
        </div>
        {ordersError && (
          <div className="px-3 py-2 mb-3 bg-red-50 text-accent-danger text-xs rounded-md">
            {ordersError}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-muted border-b border-line">
                <th className="py-2.5 pr-4 font-semibold">Order ID</th>
                <th className="py-2.5 pr-4 font-semibold">Customer</th>
                <th className="py-2.5 pr-4 font-semibold">Date</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pl-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading && recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-muted text-sm">
                    Loading orders…
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-muted text-sm">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const id = o._id || o.id;
                  const date = orderDate(o);
                  const statusLabel = orderStatusLabel(o.status);
                  return (
                    <tr key={id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4 font-medium text-ink font-mono text-xs">
                        #{(id || '').toString().slice(-8).toUpperCase()}
                      </td>
                      <td className="py-3 pr-4 text-ink-soft">{orderCustomer(o)}</td>
                      <td className="py-3 pr-4 text-ink-soft">
                        {date
                          ? formatDate(date, { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                            STATUS_TONE[statusLabel] || 'bg-surface-sunken text-ink-soft'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right font-semibold text-ink">
                        {formatCurrency(orderTotal(o))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOverview;
