/**
 * Header Component
 * Persistent navigation header with logo, nav links, cart icon, and user menu.
 * Responsive: hamburger menu on mobile, full nav on desktop.
 * Sticky with blur-backdrop on scroll.
 */
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NAV_LINKS } from '../utils/constants';

/**
 * Cart icon with item count badge.
 */
function CartIcon({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-white hover:text-gold transition-colors duration-200"
      aria-label={`Shopping cart with ${count} items`}
    >
      {/* Cart SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {/* Badge */}
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-gold text-navy text-xs font-bold
                     rounded-full h-5 w-5 flex items-center justify-center
                     animate-pulse-gold"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * User menu icon.
 */
function UserIcon({ isAuthenticated, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!isAuthenticated) {
            navigate('/login');
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="p-2 text-white hover:text-gold transition-colors duration-200"
        aria-label={isAuthenticated ? 'User menu' : 'Login'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isAuthenticated && isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-navy-surface border border-ballers-border
                     rounded-lg shadow-xl z-50 animate-fade-in"
        >
          <Link
            to="/account"
            className="block px-4 py-3 text-sm text-white hover:bg-navy-deep
                       hover:text-gold transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            My Account
          </Link>
          <Link
            to="/orders"
            className="block px-4 py-3 text-sm text-white hover:bg-navy-deep
                       hover:text-gold transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            My Orders
          </Link>
          <hr className="border-ballers-border" />
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-3 text-sm text-ballers-red
                       hover:bg-navy-deep transition-colors duration-150"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Main Header component.
 */
function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { itemCount, toggleDrawer } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Track scroll position for sticky blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-navy/95 backdrop-blur-md shadow-lg border-b border-ballers-border'
          : 'bg-navy'
      }`}
      role="banner"
    >
      <div className="container-ballers">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile: Hamburger */}
          <button
            className="lg:hidden p-2 text-white hover:text-gold transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
            className="font-bebas text-3xl lg:text-4xl text-gold tracking-wider
                       hover:text-gold-hover transition-colors duration-200"
            aria-label="Ballers - Home"
          >
            BALLERS
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" role="navigation" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium uppercase tracking-widest transition-colors duration-200 ${
                    isActive ? 'text-gold' : 'text-white hover:text-gold'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <CartIcon count={itemCount} onClick={handleCartClick} />
            <UserIcon isAuthenticated={isAuthenticated} onLogout={logout} />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden bg-navy-surface border-t border-ballers-border animate-fade-in"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="container-ballers py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm font-medium uppercase tracking-widest
                   rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-gold bg-navy-deep'
                      : 'text-white hover:text-gold hover:bg-navy-deep'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <hr className="border-ballers-border my-2" />
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  handleNavClick();
                }}
                className="block px-4 py-3 text-sm font-medium uppercase tracking-widest
                           text-ballers-red hover:bg-navy-deep rounded-lg transition-colors"
              >
                Logout
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={handleNavClick}
                className="block px-4 py-3 text-sm font-medium uppercase tracking-widest
                           text-white hover:text-gold hover:bg-navy-deep rounded-lg transition-colors"
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
