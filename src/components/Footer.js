/**
 * Footer Component
 * Persistent footer with navigation links, social media, and copyright.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { FOOTER_LINKS, SOCIAL_LINKS } from '../utils/constants';

/**
 * Social media icon component.
 */
function SocialIcon({ icon }) {
  const icons = {
    instagram: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    twitter: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    tiktok: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  };

  return icons[icon] || null;
}

/**
 * Main Footer component.
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-surface border-t border-ballers-border mt-auto" role="contentinfo">
      <div className="container-ballers py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="font-bebas text-3xl text-gold tracking-wider hover:text-gold-hover
                         transition-colors duration-200"
            >
              BALLERS
            </Link>
            <p className="mt-3 text-ballers-muted text-sm leading-relaxed">
              Official World Cup 2026 soccer kits. Customize your jersey with your name and number.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ballers-muted hover:text-gold transition-colors duration-200"
                  aria-label={social.label}
                >
                  <SocialIcon icon={social.icon} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-bebas text-lg text-white tracking-wider mb-4">SHOP</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-ballers-muted text-sm hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-bebas text-lg text-white tracking-wider mb-4">HELP</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-ballers-muted text-sm hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="font-bebas text-lg text-white tracking-wider mb-4">ABOUT</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.about.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-ballers-muted text-sm hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-ballers-border flex flex-col sm:flex-row
                        items-center justify-between gap-4">
          <p className="text-ballers-muted text-sm">
            &copy; {currentYear} Ballers. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-ballers-muted text-sm hover:text-gold transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-ballers-muted text-sm hover:text-gold transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
