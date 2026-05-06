/**
 * Footer — site-wide footer with navigation links, social links, and copyright.
 */
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const shopLinks = [
    { to: '/teams', label: 'Teams' },
    { to: '/products', label: 'New Arrivals' },
    { to: '/products?sale=true', label: 'Sale' },
  ];

  const helpLinks = [
    { to: '/faq', label: 'FAQ' },
    { to: '/size-guide', label: 'Size Guide' },
    { to: '/returns', label: 'Returns' },
  ];

  const aboutLinks = [
    { to: '/about', label: 'Our Story' },
    { to: '/wc2026', label: 'WC 2026' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <footer className="bg-[#16213E] border-t border-[#2A3550] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="text-2xl font-black tracking-widest text-[#E8C547] hover:text-[#D4A800] transition-colors"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              BALLERS
            </Link>
            <p className="mt-3 text-sm text-[#A8B2C1] leading-relaxed">
              Official replica kits for the 2026 World Cup. Wear the game.
            </p>
            {/* Social links */}
            <div className="flex gap-4 mt-4">
              {[
                { label: 'Instagram', href: '#', icon: 'IG' },
                { label: 'Twitter/X', href: '#', icon: 'X' },
                { label: 'TikTok', href: '#', icon: 'TT' },
              ].map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  className="w-9 h-9 rounded-full bg-[#0F3460] border border-[#2A3550] flex items-center justify-center text-xs font-bold text-[#A8B2C1] hover:text-[#E8C547] hover:border-[#E8C547] transition-colors"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Shop</h3>
            <ul className="space-y-2">
              {shopLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-[#A8B2C1] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Help</h3>
            <ul className="space-y-2">
              {helpLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-[#A8B2C1] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">About</h3>
            <ul className="space-y-2">
              {aboutLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-[#A8B2C1] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#2A3550] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#A8B2C1]">
            &copy; {currentYear} Ballers. All rights reserved.
          </p>
          <p className="text-xs text-[#A8B2C1]">
            Official World Cup 2026 Licensed Merchandise
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
