/**
 * Cart Page — matches cart_screen design.
 * Two-column layout: items + Shipping/Order Summary panel with stepper.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTranslation } from '../context/LanguageContext';

function Stepper({ step }) {
  const { t } = useTranslation();
  const steps = [
    { n: 1, label: t('cart.stepShipping') },
    { n: 2, label: t('cart.stepPayment') },
  ];
  return (
    <div className="flex items-center gap-3 mb-5">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                step >= s.n ? 'bg-brand text-white' : 'bg-surface-sunken text-ink-muted'
              }`}
            >
              {s.n}
            </span>
            <span
              className={`text-xs font-medium ${
                step >= s.n ? 'text-ink' : 'text-ink-muted'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span className="flex-1 h-px bg-line" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function CartItemRow({ item }) {
  const cart = useCart();
  const { t } = useTranslation();
  const updateQuantity = cart.updateQuantity || cart.updateItem || (() => {});
  const removeItem = cart.removeFromCart || cart.removeItem || (() => {});
  const key = item.cartKey || item._id;
  const lineTotal = (item.price || 0) * (item.quantity || 1);

  return (
    <div className="flex gap-4 py-5 border-b border-line last:border-0">
      <div className="w-20 h-24 rounded-lg flex-shrink-0 overflow-hidden bg-yellow-200 flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
        ) : (
          <span className="text-3xl" aria-hidden="true">👕</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink text-sm truncate">{item.name || t('cart.productFallback')}</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {t('cart.itemAttributes', { size: item.size || 'L', color: item.color || 'Yellow' })}
            </p>
          </div>
          <button
            onClick={() => removeItem(key)}
            className="text-ink-faint hover:text-accent-danger transition-colors"
            aria-label={t('cart.removeAria', { name: item.name || t('cart.productFallback') })}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="inline-flex items-center border border-line rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => updateQuantity(key, Math.max(1, (item.quantity || 1) - 1))}
              className="px-2.5 py-1 text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
              aria-label={t('cart.decreaseQty')}
            >
              −
            </button>
            <span className="px-3 py-1 text-sm text-ink border-x border-line min-w-[2rem] text-center" aria-live="polite">
              {item.quantity || 1}
            </span>
            <button
              onClick={() => updateQuantity(key, (item.quantity || 1) + 1)}
              className="px-2.5 py-1 text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
              aria-label={t('cart.increaseQty')}
            >
              +
            </button>
          </div>

          <span className="font-bold text-ink">${lineTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function CartPage() {
  const cart = useCart();
  const { t } = useTranslation();
  const items = cart.items || [];
  const itemCount = cart.itemCount ?? cart.totalItems ?? items.length;
  const subtotal = cart.subtotal ?? cart.totalPrice ?? items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const [shipping, setShipping] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
  });
  const onChange = (k) => (e) => setShipping((p) => ({ ...p, [k]: e.target.value }));

  const estShipping = 0;
  const total = subtotal + estShipping;

  if (items.length === 0) {
    return (
      <div className="page-enter min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-5" aria-hidden="true">🛒</div>
          <h1 className="text-display text-3xl text-ink mb-3">{t('cart.emptyTitle')}</h1>
          <p className="text-ink-muted mb-6">{t('cart.emptySubtitle')}</p>
          <Link to="/teams" className="btn-primary px-6 py-3">
            {t('cart.shopKits')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen">
      <div className="container-ballers py-8">
        <div className="mb-6">
          <h1 className="text-display text-3xl text-ink">{t('cart.title')}</h1>
          <p className="text-sm text-ink-muted mt-1">{t('cart.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 card p-5">
            <div role="list" aria-label={t('cart.itemsAria')}>
              {items.map((item) => (
                <div key={item.cartKey || item._id} role="listitem">
                  <CartItemRow item={item} />
                </div>
              ))}
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand mt-4"
            >
              <span aria-hidden="true">←</span> {t('cart.continueShopping')}
            </Link>
          </div>

          {/* Shipping + summary */}
          <div className="card p-5 lg:p-6 self-start">
            <Stepper step={1} />

            <h2 className="text-base font-bold text-ink mt-1">{t('cart.shippingDetails')}</h2>

            <div className="space-y-3 mt-3">
              <div>
                <label className="text-xs text-ink-muted">{t('cart.email')}</label>
                <input
                  type="email"
                  value={shipping.email}
                  onChange={onChange('email')}
                  placeholder={t('cart.emailPlaceholder')}
                  className="input-field mt-1 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-ink-muted">{t('cart.firstName')}</label>
                  <input
                    type="text"
                    value={shipping.firstName}
                    onChange={onChange('firstName')}
                    placeholder={t('cart.firstNamePlaceholder')}
                    className="input-field mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-muted">{t('cart.lastName')}</label>
                  <input
                    type="text"
                    value={shipping.lastName}
                    onChange={onChange('lastName')}
                    placeholder={t('cart.lastNamePlaceholder')}
                    className="input-field mt-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-muted">{t('cart.streetAddress')}</label>
                <input
                  type="text"
                  value={shipping.address}
                  onChange={onChange('address')}
                  placeholder={t('cart.streetPlaceholder')}
                  className="input-field mt-1 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-line mt-5 pt-4">
              <h3 className="text-sm font-bold text-ink mb-3">{t('cart.orderSummary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>{t('cart.subtotalItems', { count: itemCount })}</span>
                  <span className="text-ink">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>{t('cart.estShipping')}</span>
                  <span className="text-accent-success font-medium">{t('cart.free')}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-line">
                <span className="text-sm font-bold text-ink">{t('cart.total')}</span>
                <span className="text-xl font-bold text-ink">${total.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="btn-primary w-full mt-5 py-3.5 text-base"
            >
              {t('cart.continueToPayment')} <span aria-hidden="true">→</span>
            </Link>
            <p className="text-center text-xs text-ink-muted mt-2">
              <span aria-hidden="true">🔒</span> {t('cart.secureCheckout')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
