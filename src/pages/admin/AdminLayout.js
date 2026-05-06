/**
 * AdminLayout — sidebar shell for the admin panel.
 * Matches the layout in admin_panel_overview_screen.png and admin_panel_inventory_screen.png.
 */
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Overview', end: true, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeLinejoin="round" />
    </svg>
  ) },
  { to: '/admin/inventory', label: 'Inventory', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ) },
  { to: '/admin/orders', label: 'Orders', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6l1 4H8l1-4zM5 9h14l-1 11H6L5 9z" />
    </svg>
  ) },
  { to: '/admin/customers', label: 'Customers', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21a7 7 0 0114 0" />
    </svg>
  ) },
  { to: '/admin/settings', label: 'Settings', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12a7 7 0 00-.1-1.1l2-1.5-2-3.5-2.4.8a7 7 0 00-1.9-1.1L14 3h-4l-.6 2.6a7 7 0 00-1.9 1.1l-2.4-.8-2 3.5 2 1.5A7 7 0 005 12c0 .4 0 .7.1 1.1l-2 1.5 2 3.5 2.4-.8c.6.5 1.2.8 1.9 1.1L10 21h4l.6-2.6c.7-.3 1.3-.6 1.9-1.1l2.4.8 2-3.5-2-1.5c.1-.4.1-.7.1-1.1z" />
    </svg>
  ) },
];

function AdminLayout({ title, subtitle, actions, children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface-muted flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-surface-subtle border-r border-line flex flex-col min-h-screen">
        <div className="px-5 pt-5 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center font-extrabold text-display">B</span>
            <div className="min-w-0">
              <div className="text-base font-bold text-ink leading-tight">Admin Panel</div>
              <div className="text-xs text-ink-muted">{user?.name ? user.name : 'Ballers HQ'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
                }`
              }
            >
              {n.icon}
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-line space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-line bg-white text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" />
            </svg>
            View Storefront
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-surface-sunken hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9m0-9H5a2 2 0 00-2 2v14a2 2 0 002 2h4" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-display text-3xl text-ink">{title}</h1>
            {subtitle && <p className="text-sm text-ink-muted mt-1 max-w-xl">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
