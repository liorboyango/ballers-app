/**
 * Footer — light theme site footer matching design mocks.
 * Columns: Brand · Company · Support · Newsletter
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const companyLinks = [
    { to: '/about', label: t('footer.links.about') },
    { to: '/careers', label: t('footer.links.careers') },
    { to: '/press', label: t('footer.links.press') },
  ];

  const supportLinks = [
    { to: '/shipping', label: t('footer.links.shipping') },
    { to: '/returns', label: t('footer.links.returns') },
    { to: '/contact', label: t('footer.links.contact') },
  ];

  const legalLinks = [
    { to: '/privacy', label: t('footer.links.privacy') },
    { to: '/terms', label: t('footer.links.terms') },
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
              {t('brand.name')}
            </Link>
            <p className="mt-3 text-sm text-ink-muted leading-relaxed">
              {t('footer.rights', { year: currentYear, brand: t('brand.name') })}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">{t('footer.company')}</h3>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">{t('footer.support')}</h3>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">{t('footer.newsletter')}</h3>
            <p className="text-sm text-ink-muted mb-3">{t('footer.newsletterCopy')}</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
              className="flex gap-2"
            >
              <label htmlFor="footer-email" className="sr-only">{t('footer.emailLabel')}</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.newsletterPlaceholder')}
                className="input-field flex-1 text-sm"
                required
              />
              <button type="submit" className="btn-primary text-sm py-2.5 px-4">
                {t('footer.newsletterSubmit')}
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
            {t('footer.tagline')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
