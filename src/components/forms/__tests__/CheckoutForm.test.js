/**
 * CheckoutForm tests — Airwallex Hosted Checkout (redirect flow).
 *
 * Covers:
 *   - Rendering: form fields, branding, no card UI
 *   - Validation: required fields, email format
 *   - Submit flow: createCheckoutSession + window.location.assign(redirectUrl)
 *   - Error handling: API failure surfaces as banner; no redirect happens
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../../services/ordersApi', () => ({
  createCheckoutSession: jest.fn(),
}));

import CheckoutForm from '../CheckoutForm';
import { createCheckoutSession } from '../../../services/ordersApi';

const renderForm = (props = {}) =>
  render(
    <BrowserRouter>
      <CheckoutForm {...props} />
    </BrowserRouter>
  );

async function fillRequiredFields(user) {
  await user.type(screen.getByLabelText(/first name/i), 'John');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
  await user.type(screen.getByLabelText(/street address/i), '123 Main St');
  await user.type(screen.getByLabelText(/city/i), 'New York');
  await user.type(screen.getByLabelText(/zip/i), '10001');
  await user.selectOptions(screen.getByLabelText(/country/i), 'US');
}

describe('CheckoutForm', () => {
  let assignSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    // Stub window.location.assign — jsdom navigation isn't supported.
    assignSpy = jest.fn();
    delete window.location;
    window.location = { assign: assignSpy, href: 'http://localhost/checkout' };
  });

  describe('Rendering', () => {
    it('renders all contact info fields', () => {
      renderForm();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    it('renders all shipping address fields', () => {
      renderForm();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    it('renders the Airwallex security badge', () => {
      renderForm();
      expect(screen.getByText(/secured by/i)).toBeInTheDocument();
      expect(screen.getByText('Airwallex')).toBeInTheDocument();
    });

    it('explains that the user will be redirected to Airwallex', () => {
      renderForm();
      expect(screen.getByText(/redirected to airwallex/i)).toBeInTheDocument();
    });

    it('does NOT render any card-collection UI', () => {
      renderForm();
      expect(screen.queryByTestId('airwallex-card-element')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
    });

    it('shows order total in submit button when provided', () => {
      renderForm({ orderTotal: 89.99 });
      expect(screen.getByText(/continue to payment.*89\.99/i)).toBeInTheDocument();
    });

    it('shows generic Continue to Payment text when no total provided', () => {
      renderForm();
      expect(
        screen.getByRole('button', { name: /continue to payment/i })
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation errors when submitting empty form', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
      expect(createCheckoutSession).not.toHaveBeenCalled();
    });

    it('shows email validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
      fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Submit flow', () => {
    it('calls createCheckoutSession with shippingAddress, then redirects to Airwallex', async () => {
      const user = userEvent.setup();
      createCheckoutSession.mockResolvedValueOnce({
        checkoutId: 'ck_abc',
        redirectUrl: 'https://checkout.airwallex.com/?token=ck_abc',
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(createCheckoutSession).toHaveBeenCalledWith({
          shippingAddress: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            address: '123 Main St',
            city: 'New York',
            zip: '10001',
            country: 'US',
          }),
        });
      });

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledWith(
          'https://checkout.airwallex.com/?token=ck_abc'
        );
      });
    });

    it('omits phone from shippingAddress when blank', async () => {
      const user = userEvent.setup();
      createCheckoutSession.mockResolvedValueOnce({
        checkoutId: 'ck_1',
        redirectUrl: 'https://x',
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(createCheckoutSession).toHaveBeenCalled();
      });
      const call = createCheckoutSession.mock.calls[0][0];
      expect(call.shippingAddress).not.toHaveProperty('phone');
    });

    it('includes phone when filled', async () => {
      const user = userEvent.setup();
      createCheckoutSession.mockResolvedValueOnce({
        checkoutId: 'ck_1',
        redirectUrl: 'https://x',
      });

      renderForm();
      await fillRequiredFields(user);
      await user.type(screen.getByLabelText(/phone/i), '+15550001111');
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(createCheckoutSession).toHaveBeenCalledWith(
          expect.objectContaining({
            shippingAddress: expect.objectContaining({ phone: '+15550001111' }),
          })
        );
      });
    });
  });

  describe('Error handling', () => {
    it('shows error banner and does NOT redirect when createCheckoutSession fails', async () => {
      const user = userEvent.setup();
      createCheckoutSession.mockRejectedValueOnce({ message: 'Cart is empty' });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/cart is empty/i);
      });
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it('falls back to a generic message when the error has no message', async () => {
      const user = userEvent.setup();
      createCheckoutSession.mockRejectedValueOnce({});

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to start checkout/i);
      });
    });

    it('re-enables the submit button after an error', async () => {
      const user = userEvent.setup();
      createCheckoutSession.mockRejectedValueOnce({ message: 'Server down' });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /continue to payment/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(
        screen.getByRole('button', { name: /continue to payment/i })
      ).not.toBeDisabled();
    });
  });
});
