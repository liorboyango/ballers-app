/**
 * Header — persistent navigation bar.
 *
 * Features:
 *  - Sticky with blur backdrop on scroll
 *  - Logo linking to home
 *  - Desktop nav links
 *  - Cart icon with item count badge (animated)
 *  - User menu (login/logout)
 *  - Mobile hamburger menu
 *  - Accessible keyboard navigation
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [prevTotalItems, setPrevTotalItems] = useState(totalItems);
  const [cartBadgeAnimate, setCartBadgeAnimate] = useState(false);
  const userMenuRef = useRef(null);

  // Scroll detection for sticky blur effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate cart badge when item count increases
  useEffect(() => {
    if (totalItems > prevTotalItems) {
      setCartBadgeAnimate(true);
      const timer = setTimeout(() => setCartBadgeAnimate(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevTotalItems(totalItems);
  }, [totalItems, prevTotalItems]);

  // Close user menu on outside click
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
    { to: '/teams', label: 'Teams' },
    { to: '/products', label: 'Shop' },
  ];

  return (
    <header
      className={`
        sticky top-0 z-40 transition-all duration-300
        ${
          isScrolled
            ? 'bg-[#1A1A2E]/95 backdrop-blur-md shadow-lg shadow-black/20'
            : 'bg-[#1A1A2E]'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile: hamburger */}
          <button
            className="lg:hidden text-[#A8B2C1] hover:text-white p-2 -ml-2"
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

          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-black tracking-widest text-[#E8C547] hover:text-[#D4A800] transition-colors"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            aria-label="Ballers - Home"
          >
            BALLERS
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm font-medium uppercase tracking-widest transition-colors ${
                    isActive
                      ? 'text-[#E8C547]'
                      : 'text-[#A8B2C1] hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative p-2 text-[#A8B2C1] hover:text-white transition-colors"
              aria-label={`Shopping cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {totalItems > 0 && (
                <span
                  className={`
                    absolute -top-1 -right-1 min-w-[20px] h-5 px-1
                    bg-[#E8C547] text-[#1A1A2E] text-xs font-bold
                    rounded-full flex items-center justify-center
                    transition-transform
                    ${cartBadgeAnimate ? 'scale-125' : 'scale-100'}
                  `}
                  aria-hidden="true"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-2 text-[#A8B2C1] hover:text-white transition-colors"
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0F3460] border border-[#2A3550] flex items-center justify-center text-sm font-bold text-[#E8C547]">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-[#16213E] border border-[#2A3550] rounded-xl shadow-2xl py-1 z-50"
                    role="menu"
                  >
                    <div className="px-4 py-2 border-b border-[#2A3550]">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-[#A8B2C1] truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-[#A8B2C1] hover:text-white hover:bg-[#0F3460] transition-colors"
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
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#A8B2C1] hover:text-white transition-colors uppercase tracking-wider"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden bg-[#16213E] border-t border-[#2A3550] px-4 py-4"
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
                  `px-3 py-2 rounded-lg text-sm font-medium uppercase tracking-widest transition-colors ${
                    isActive
                      ? 'bg-[#0F3460] text-[#E8C547]'
                      : 'text-[#A8B2C1] hover:text-white hover:bg-[#0F3460]'
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
                className="px-3 py-2 rounded-lg text-sm font-medium uppercase tracking-widest text-[#A8B2C1] hover:text-white hover:bg-[#0F3460] transition-colors"
              >
                Login
              </NavLink>
            )}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2 rounded-lg text-sm font-medium uppercase tracking-widest text-[#A8B2C1] hover:text-white hover:bg-[#0F3460] transition-colors"
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
