/**
 * Header Component
 * Persistent navigation header with cart icon, user menu, and mobile hamburger.
 * Sticky with blur-backdrop on scroll.
 */
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import { useToast } from '../context/ToastContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm uppercase tracking-wider font-semibold transition-colors ${
      isActive ? 'text-gold' : 'text-ballers-muted hover:text-white'
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-navy/95 backdrop-blur-md shadow-lg' : 'bg-navy'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile: hamburger */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="font-bebas text-3xl text-gold tracking-wide hover:text-gold-hover transition-colors">
            BALLERS
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            <NavLink to="/teams" className={navLinkClass}>Teams</NavLink>
            <NavLink to="/products" className={navLinkClass}>Shop</NavLink>
            <span className="text-sm uppercase tracking-wider font-semibold text-ballers-muted">WC2026</span>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-ballers-muted hover:text-white transition-colors"
              aria-label={`Cart, ${totalItems} items`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-navy text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 text-ballers-muted hover:text-white transition-colors p-2"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-navy-deep border border-ballers-border flex items-center justify-center">
                    <span className="text-gold text-sm font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-navy-surface border border-ballers-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-3 border-b border-ballers-border">
                    <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-ballers-muted text-xs truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-ballers-muted text-sm hover:text-white hover:bg-navy-deep transition-colors rounded-b-xl"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-semibold text-ballers-muted hover:text-white transition-colors p-2"
                aria-label="Login"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-navy-surface border-t border-ballers-border" role="navigation" aria-label="Mobile navigation">
          <div className="px-4 py-4 space-y-3">
            {[['/', 'Home'], ['/teams', 'Teams'], ['/products', 'Shop'], ['/cart', `Cart (${totalItems})`]].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="block text-ballers-muted hover:text-white text-sm uppercase tracking-wider font-semibold py-2 transition-colors"
              >
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="block w-full text-left text-ballers-muted hover:text-white text-sm uppercase tracking-wider font-semibold py-2 transition-colors">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-ballers-muted hover:text-white text-sm uppercase tracking-wider font-semibold py-2 transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
