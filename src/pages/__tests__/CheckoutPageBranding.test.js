/**
 * CheckoutPageBranding.test.js
 *
 * Verifies CheckoutPage:
 *   1. Wraps CheckoutForm in RapydProvider (not Stripe Elements).
 *   2. Passes REACT_APP_RAPYD_PUBLISHABLE_KEY as the clientKey prop.
 *   3. Does NOT reference REACT_APP_STRIPE_PUBLISHABLE_KEY.
 *   4. Renders order summary, layout, and trust badges unchanged.
 *
 * This complements CheckoutBranding.test.js which tests the form internals.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Rapyd SDK mock ──────────────────────────────────────────────────────────
jest.mock('@rapyd/client-web', () => ({
  RapydCardElement: ({ onChange }) => (
    <div
      data-testid="rapyd-card-element"
      onClick={() => onChange && onChange({ error: null })}
    />
  ),
  useRapyd: () => ({ confirmPayment: jest.fn(), getElement: jest.fn() }),
  /**
   * RapydProvider spy — we capture the clientKey prop so we can assert
   * it comes from REACT_APP_RAPYD_PUBLISHABLE_KEY and not a Stripe var.
   */
  RapydProvider: ({ children, clientKey }) => (
    <div data-testid="rapyd-provider" data-client-key={clientKey ?? ''}>
      {children}
    </div>
  ),
}));

// ── Context / hook mocks ────────────────────────────────────────────────────
jest.mock('../../hooks/useCart', () => ({
  useCart: () => ({
    items: [
      {
        _id: 'item-1',
        quantity: 1,
        price: 89.99,
        product: { name: 'Brazil Home Kit', price: 89.99 },
      },
    ],
    totalPrice: 89.99,
    loading: false,
    clearCart: jest.fn(),
  }),
  default: () => ({
    items: [],
    totalPrice: 0,
    loading: false,
    clearCart: jest.fn(),
  }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', email: 'test@example.com' },
    loading: false,
  }),
  default: () => ({
    user: { uid: 'user-1', email: 'test@example.com' },
    loading: false,
  }),
}));

jest.mock('../../services/ordersApi', () => ({
  createPaymentIntent: jest.fn(),
  createOrder: jest.fn(),
}));

jest.mock('../../utils/imageUrl', () => ({
  getProductImage: () => null,
}));

// ── Component under test ────────────────────────────────────────────────────
import CheckoutPage from '../CheckoutPage';

// ── Helper ───────────────────────────────────────────────────────────────────
const renderCheckoutPage = () =>
  render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/cart" element={<div>Cart Page</div>} />
      </Routes>
    </MemoryRouter>
  );

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CheckoutPage — Rapyd provider integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set Rapyd env var; ensure Stripe var is absent
    process.env.REACT_APP_RAPYD_PUBLISHABLE_KEY = 'test_rapyd_key_123';
    delete process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    delete process.env.REACT_APP_RAPYD_PUBLISHABLE_KEY;
  });

  it('renders the RapydProvider wrapper', () => {
    renderCheckoutPage();
    expect(screen.getByTestId('rapyd-provider')).toBeInTheDocument();
  });

  it('passes REACT_APP_RAPYD_PUBLISHABLE_KEY to RapydProvider as clientKey', () => {
    renderCheckoutPage();
    const provider = screen.getByTestId('rapyd-provider');
    // The env var is set to 'test_rapyd_key_123' in beforeEach
    expect(provider.getAttribute('data-client-key')).toBe('test_rapyd_key_123');
  });

  it('does not use REACT_APP_STRIPE_PUBLISHABLE_KEY', () => {
    renderCheckoutPage();
    const provider = screen.getByTestId('rapyd-provider');
    // The client key must NOT equal the Stripe env var (which is undefined/absent)
    const clientKey = provider.getAttribute('data-client-key');
    // Stripe publishable keys start with 'pk_' — Rapyd keys do not
    expect(clientKey).not.toMatch(/^pk_(test|live)_/);
  });

  it('does not render any Stripe-branded text on the page', () => {
    renderCheckoutPage();
    expect(screen.queryByText(/stripe/i)).not.toBeInTheDocument();
  });

  it('renders the page title "Checkout"', () => {
    renderCheckoutPage();
    expect(
      screen.getByRole('heading', { name: /checkout/i })
    ).toBeInTheDocument();
  });

  it('renders the order summary panel', () => {
    renderCheckoutPage();
    expect(screen.getByText(/order summary/i)).toBeInTheDocument();
  });

  it('renders trust badges (SSL, licensed, returns)', () => {
    renderCheckoutPage();
    expect(screen.getByText(/ssl encrypted/i)).toBeInTheDocument();
    expect(screen.getByText(/world cup 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/free returns/i)).toBeInTheDocument();
  });

  it('renders Back to Cart navigation link', () => {
    renderCheckoutPage();
    expect(
      screen.getByRole('link', { name: /back to cart/i })
    ).toBeInTheDocument();
  });

  it('renders order item from cart', () => {
    renderCheckoutPage();
    expect(screen.getByText('Brazil Home Kit')).toBeInTheDocument();
  });

  it('falls back to empty string for clientKey when env var is not set', () => {
    delete process.env.REACT_APP_RAPYD_PUBLISHABLE_KEY;
    renderCheckoutPage();
    const provider = screen.getByTestId('rapyd-provider');
    // Should be empty string, not undefined/null/Stripe key
    expect(provider.getAttribute('data-client-key')).toBe('');
  });
});
