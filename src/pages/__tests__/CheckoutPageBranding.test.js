/**
 * CheckoutPage tests — page chrome and structure.
 *
 *   - Page title, order summary, trust badges, back-to-cart link all render.
 *   - No Stripe-branded text on the page.
 *   - No client-side payment provider context wraps the form (Hosted Checkout
 *     is a redirect — no provider needed).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

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
  createCheckoutSession: jest.fn(),
}));

jest.mock('../../utils/imageUrl', () => ({
  getProductImage: () => null,
}));

import CheckoutPage from '../CheckoutPage';

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

describe('CheckoutPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the page title', () => {
    renderCheckoutPage();
    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
  });

  it('renders the order summary panel', () => {
    renderCheckoutPage();
    expect(screen.getByText(/order summary/i)).toBeInTheDocument();
  });

  it('renders trust badges', () => {
    renderCheckoutPage();
    expect(screen.getByText(/ssl encrypted/i)).toBeInTheDocument();
    expect(screen.getByText(/free returns/i)).toBeInTheDocument();
  });

  it('renders Back to Cart navigation link', () => {
    renderCheckoutPage();
    expect(screen.getByRole('link', { name: /back to cart/i })).toBeInTheDocument();
  });

  it('renders order item from cart', () => {
    renderCheckoutPage();
    expect(screen.getByText('Brazil Home Kit')).toBeInTheDocument();
  });

  it('does not render any Stripe-branded text', () => {
    renderCheckoutPage();
    expect(screen.queryByText(/stripe/i)).not.toBeInTheDocument();
  });

  it('does not wrap the form in any payment-provider context (Hosted Checkout uses redirect)', () => {
    renderCheckoutPage();
    expect(screen.queryByTestId('airwallex-provider')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stripe-provider')).not.toBeInTheDocument();
  });
});
