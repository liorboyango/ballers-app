/**
 * CheckoutBranding tests — guards against regressions in payment branding.
 *
 *   - No Stripe references (text, aria-labels, test-ids)
 *   - Airwallex security badge present
 *   - No client-side card collection (Hosted Checkout owns that)
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../../services/ordersApi', () => ({
  createCheckoutSession: jest.fn(),
}));

import CheckoutForm from '../CheckoutForm';

const renderCheckoutForm = (props = {}) =>
  render(
    <BrowserRouter>
      <CheckoutForm {...props} />
    </BrowserRouter>
  );

describe('Checkout branding & payment surface', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Stripe branding must be absent', () => {
    it('does not render any text containing "Stripe"', () => {
      renderCheckoutForm();
      expect(screen.queryByText(/stripe/i)).not.toBeInTheDocument();
    });

    it('does not render aria-label referencing Stripe', () => {
      const { container } = renderCheckoutForm();
      const labels = Array.from(container.querySelectorAll('[aria-label]')).map((el) =>
        el.getAttribute('aria-label').toLowerCase()
      );
      expect(labels.some((l) => l.includes('stripe'))).toBe(false);
    });

    it('does not render any PayPal option', () => {
      renderCheckoutForm();
      expect(screen.queryByText(/paypal/i)).not.toBeInTheDocument();
    });
  });

  describe('Airwallex branding must be present', () => {
    it('renders "Secured by Airwallex"', () => {
      renderCheckoutForm();
      expect(screen.getByText(/secured by/i)).toBeInTheDocument();
      expect(screen.getByText('Airwallex')).toBeInTheDocument();
    });

    it('payment indicator aria-label says "via Airwallex"', () => {
      renderCheckoutForm();
      const indicator = screen.getByRole('status', {
        name: /credit card via airwallex/i,
      });
      const label = indicator.getAttribute('aria-label').toLowerCase();
      expect(label).toContain('airwallex');
      expect(label).not.toContain('stripe');
    });

    it('explains the redirect to Airwallex', () => {
      renderCheckoutForm();
      expect(screen.getByText(/redirected to airwallex/i)).toBeInTheDocument();
    });
  });

  describe('No client-side card collection', () => {
    it('does not render a card number input', () => {
      renderCheckoutForm();
      expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/1234 5678/i)).not.toBeInTheDocument();
    });

    it('does not render a CVV/CVC input', () => {
      renderCheckoutForm();
      expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cvc/i)).not.toBeInTheDocument();
    });

    it('does not render a card expiry input', () => {
      renderCheckoutForm();
      expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/expiration/i)).not.toBeInTheDocument();
    });

    it('does not render any embedded card element', () => {
      renderCheckoutForm();
      expect(screen.queryByTestId('airwallex-card-element')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stripe-card-element')).not.toBeInTheDocument();
    });
  });
});
