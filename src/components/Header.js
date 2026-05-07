/**
 * Header — light theme top navigation matching design mocks.
 *
 * Features:
 *  - White surface, green Ballers logo
 *  - Nav: Shop · National Teams · Custom Kits · Dashboard (admin-only)
 *  - Cart icon + count badge (animates on item add), opens CartDrawer on click
 *  - Account icon (login or user menu)
 *  - Mobile hamburger
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { success: showSuccess } = useToast();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [prevTotalItems, setPrevTotalItems] = useState(totalItems);
  const [cartBadgeAnimate, setCartBadgeAnimate] = useState(false);
  const userMenuRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  // Animate badge when item count increases
  useEffect(() => {
    if (totalItems > prevTotalItems) {
      setCartBadgeAnimate(true);
      const timer = setTimeout(() => setCartBadgeAnimate(false), 600);
      setPrevTotalItems(totalItems);
      return () => clearTimeout(timer);
    }
    setPrevTotalItems(totalItems);
  }, [totalItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    showSuccess('You have been logged out.');
    navigate('/');
  };

  const navLinks = [
    { to: '/products', label: 'Shop' },
    { to: '/teams', label: 'National Teams' },
    { to: '/custom-kits', label: 'Custom Kits' },
    ...(isAdmin ? [{ to: '/admin', label: 'Dashboard' }] : []),
  ];

  const navLinkClass = ({ isActive }) =>
    `text-[15px] font-medium transition-colors ${
      isActive ? 'text-brand' : 'text-ink-soft hover:text-brand'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-ink-soft hover:text-ink p-2 -ml-2"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo + nav */}
          <div className="flex items-center gap-10">
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tight text-brand hover:text-brand-dark transition-colors text-display"
              aria-label="Ballers - Home"
            >
              Ballers
            </Link>

            <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} className={navLinkClass} end={to === '/'}>
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Cart button — opens CartDrawer, shows item count badge */}
            <button
              onClick={openCart}
              className="relative p-2 text-ink-soft hover:text-brand transition-colors"
              aria-label={`Shopping cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>

              {/* Badge: only shown when cart has items */}
              {totalItems > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                    bg-brand text-white text-[10px] font-bold rounded-full
                    flex items-center justify-center transition-transform duration-200
                    ${cartBadgeAnimate ? 'scale-125' : 'scale-100'}`}
                  aria-hidden="true"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* User menu / login */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 text-ink-soft hover:text-brand transition-colors"
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand/20 flex items-center justify-center text-sm font-bold text-brand">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-line rounded-xl shadow-elevated py-1 z-50"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-line">
                      <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                      <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand">
                          Admin
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
                        role="menuitem"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
                      role="menuitem"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 text-ink-soft hover:text-brand transition-colors"
                aria-label="Sign in"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden bg-white border-t border-line px-4 py-4"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand'
                      : 'text-ink-soft hover:text-ink hover:bg-surface-muted'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <NavLink
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-[15px] font-medium text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
              >
                Sign In
              </NavLink>
            )}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2.5 rounded-lg text-[15px] font-medium text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
              >
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
