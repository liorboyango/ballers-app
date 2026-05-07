/**
 * Footer — light theme site footer matching design mocks.
 * Columns: Brand · Company · Support · Newsletter
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const companyLinks = [
    { to: '/about', label: 'About Us' },
    { to: '/careers', label: 'Careers' },
    { to: '/press', label: 'Press' },
  ];

  const supportLinks = [
    { to: '/shipping', label: 'Shipping Info' },
    { to: '/returns', label: 'Returns' },
    { to: '/contact', label: 'Contact Us' },
  ];

  const legalLinks = [
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
  ];

  return (
    <footer className="bg-surface-subtle border-t border-line mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tight text-brand hover:text-brand-dark transition-colors text-display"
            >
              Ballers
            </Link>
            <p className="mt-3 text-sm text-ink-muted leading-relaxed">
              © {currentYear} Ballers Soccer Store. All rights reserved.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-ink-muted hover:text-brand transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">Support</h3>
            <ul className="space-y-2.5">
              {supportLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-ink-muted hover:text-brand transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">Newsletter</h3>
            <p className="text-sm text-ink-muted mb-3">Get the latest kits & offers in your inbox.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
              className="flex gap-2"
            >
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="input-field flex-1 text-sm"
                required
              />
              <button type="submit" className="btn-primary text-sm py-2.5 px-4">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <ul className="flex items-center gap-5">
            {legalLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-xs text-ink-muted hover:text-brand transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-muted">
            Official Licensed Soccer Merchandise
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
