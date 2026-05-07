/**
 * CheckoutCompletePage tests — handles return from Rapyd Hosted Checkout.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockClearCart = jest.fn();
jest.mock('../../hooks/useCart', () => ({
  useCart: () => ({ clearCart: mockClearCart }),
  default: () => ({ clearCart: mockClearCart }),
}));

jest.mock('../../services/ordersApi', () => ({
  finalizeCheckout: jest.fn(),
}));

import CheckoutCompletePage from '../CheckoutCompletePage';
import { finalizeCheckout } from '../../services/ordersApi';

function renderAt(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/checkout/complete" element={<CheckoutCompletePage />} />
        <Route
          path="/order-success/:id"
          element={<div data-testid="order-success">Order Success</div>}
        />
        <Route
          path="/order-success"
          element={<div data-testid="order-success-noid">Order Success No ID</div>}
        />
        <Route path="/checkout" element={<div>Checkout</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CheckoutCompletePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a confirming spinner while finalizing', () => {
    finalizeCheckout.mockReturnValue(new Promise(() => {})); // never resolves

    renderAt('/checkout/complete?checkoutId=ck_1');

    expect(screen.getByRole('status')).toHaveTextContent(/confirming your payment/i);
  });

  it('calls finalizeCheckout with the checkoutId from the URL', async () => {
    finalizeCheckout.mockResolvedValueOnce({ id: 'order-1', status: 'paid' });

    renderAt('/checkout/complete?checkoutId=ck_abc');

    await waitFor(() => {
      expect(finalizeCheckout).toHaveBeenCalledWith({ checkoutId: 'ck_abc' });
    });
  });

  it('clears the cart and navigates to /order-success/:id on success', async () => {
    finalizeCheckout.mockResolvedValueOnce({ id: 'order-99', status: 'paid' });

    renderAt('/checkout/complete?checkoutId=ck_ok');

    await waitFor(() => {
      expect(screen.getByTestId('order-success')).toBeInTheDocument();
    });
    expect(mockClearCart).toHaveBeenCalled();
  });

  it('navigates to /order-success (no id) when the order has no id', async () => {
    finalizeCheckout.mockResolvedValueOnce({ status: 'pending' });

    renderAt('/checkout/complete?checkoutId=ck_pend');

    await waitFor(() => {
      expect(screen.getByTestId('order-success-noid')).toBeInTheDocument();
    });
  });

  it('shows an error and a retry link when finalizeCheckout fails', async () => {
    finalizeCheckout.mockRejectedValueOnce({ message: 'Payment not completed' });

    renderAt('/checkout/complete?checkoutId=ck_bad');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/payment not completed/i);
    });
    expect(screen.getByRole('link', { name: /try again/i })).toHaveAttribute(
      'href',
      '/checkout'
    );
    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it('shows an error when checkoutId is missing from the URL', async () => {
    renderAt('/checkout/complete');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/missing checkout reference/i);
    });
    expect(finalizeCheckout).not.toHaveBeenCalled();
  });

  it('accepts checkout_id (snake_case) as an alternative param name', async () => {
    finalizeCheckout.mockResolvedValueOnce({ id: 'order-snake', status: 'paid' });

    renderAt('/checkout/complete?checkout_id=ck_snake');

    await waitFor(() => {
      expect(finalizeCheckout).toHaveBeenCalledWith({ checkoutId: 'ck_snake' });
    });
  });
});
