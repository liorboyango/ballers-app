/**
 * AdminOverview — Dashboard Overview screen.
 * Matches admin_panel_overview_screen.png: KPI cards, sales chart, recent orders.
 */
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

const KPIS = [
  {
    label: 'Total Sales (MTD)',
    value: '$142,590',
    delta: '↗ +12.5% vs last month',
    deltaTone: 'text-brand',
    icon: '$',
  },
  {
    label: 'Active Orders',
    value: '348',
    delta: '⏱ 42 pending fulfillment',
    deltaTone: 'text-ink-muted',
    icon: '🚚',
  },
  {
    label: 'Low Stock Alerts',
    value: '12 Items',
    delta: '→ Requires immediate restock',
    deltaTone: 'text-accent-danger',
    valueTone: 'text-accent-danger',
    icon: '⚠',
  },
];

const RECENT_ORDERS = [
  { id: '#ORD-9082', customer: 'Marcus Johnson', date: 'Today, 10:42 AM', status: 'Processing', amount: 245.00 },
  { id: '#ORD-9081', customer: 'Sofia Rodriguez', date: 'Today, 9:15 AM', status: 'Shipped', amount: 189.50 },
  { id: '#ORD-9080', customer: 'James Patel', date: 'Yesterday, 6:30 PM', status: 'Delivered', amount: 320.00 },
  { id: '#ORD-9079', customer: 'Emma Chen', date: 'Yesterday, 4:12 PM', status: 'Processing', amount: 95.00 },
  { id: '#ORD-9078', customer: 'David Kim', date: 'May 4, 8:55 AM', status: 'Shipped', amount: 410.75 },
];

const STATUS_TONE = {
  Processing: 'bg-brand-50 text-brand',
  Shipped: 'bg-blue-50 text-blue-700',
  Delivered: 'bg-surface-sunken text-ink-soft',
};

function MiniChart() {
  // Simple inline SVG line chart (decorative)
  const points = [
    [0, 70], [50, 65], [110, 78], [170, 50], [230, 60], [290, 40],
    [350, 45], [410, 32], [470, 36], [530, 22], [590, 28], [650, 25],
  ];
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = `${path} L 650 100 L 0 100 Z`;
  return (
    <svg viewBox="0 0 660 110" className="w-full h-56" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1F6E3A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1F6E3A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g1)" />
      <path d={path} fill="none" stroke="#1F6E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="530" cy="22" r="4" fill="#1F6E3A" />
    </svg>
  );
}

function AdminOverview() {
  const [chartView, setChartView] = useState('Revenue');

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
        {KPIS.map((k) => (
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
        <MiniChart />
        <div className="flex justify-between text-xs text-ink-muted mt-2 px-2">
          <span>Oct 1</span>
          <span>Oct 8</span>
          <span>Oct 15</span>
          <span>Oct 22</span>
          <span>Oct 30</span>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink">Recent Orders</h2>
          <button className="text-sm text-brand font-semibold hover:underline">View All</button>
        </div>
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
              {RECENT_ORDERS.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 font-medium text-ink">{o.id}</td>
                  <td className="py-3 pr-4 text-ink-soft">{o.customer}</td>
                  <td className="py-3 pr-4 text-ink-soft">{o.date}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_TONE[o.status] || 'bg-surface-sunken text-ink-soft'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right font-semibold text-ink">${o.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOverview;
