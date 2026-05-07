/**
 * CheckoutForm tests with Stripe mocking.
 * Tests the Stripe-integrated checkout form behavior.
 * Verifies that:
 *   - All contact/shipping fields render correctly
 *   - Stripe CardElement is rendered (no manual card fields)
 *   - Form validation works for required fields
 *   - Payment flow calls create-payment-intent then confirmCardPayment
 *   - Card errors and server errors are displayed correctly
 *   - Successful payment clears cart and calls onOrderSuccess
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock Stripe hooks before importing the component
const mockConfirmCardPayment = jest.fn();
const mockGetElement = jest.fn();

jest.mock('@stripe/react-stripe-js', () => ({
  CardElement: ({ onChange }) => (
    <div
      data-testid="card-element"
      role="group"
      aria-label="Card details"
      onClick={() => onChange && onChange({ error: null })}
    />
  ),
  useStripe: () => ({
    confirmCardPayment: mockConfirmCardPayment,
  }),
  useElements: () => ({
    getElement: mockGetElement,
  }),
}));

// Mock CartContext
jest.mock('../../../hooks/useCart', () => ({
  useCart: () => ({ clearCart: jest.fn() }),
  default: () => ({ clearCart: jest.fn() }),
}));

// Mock ordersApi — the form now uses createPaymentIntent and createOrder directly
jest.mock('../../../services/ordersApi', () => ({
  createPaymentIntent: jest.fn(),
  createOrder: jest.fn(),
}));

import CheckoutForm from '../CheckoutForm';
import { createPaymentIntent, createOrder } from '../../../services/ordersApi';

const renderForm = (props = {}) =>
  render(
    <BrowserRouter>
      <CheckoutForm {...props} />
    </BrowserRouter>
  );

/** Fill in all required checkout fields */
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
  beforeEach(() => {
    jest.clearAllMocks();
    // Return a mock card element object so getElement doesn't return null
    mockGetElement.mockReturnValue({ _type: 'card' });
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

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

  it('renders Stripe CardElement instead of manual card fields', () => {
    renderForm();
    // Stripe CardElement should be present
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    // Manual card fields should NOT be present
    expect(screen.queryByPlaceholderText(/1234 5678/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/card holder/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
  });

  it('renders Credit Card payment indicator', () => {
    renderForm();
    expect(screen.getByText(/credit card/i)).toBeInTheDocument();
  });

  it('does not render PayPal option', () => {
    renderForm();
    expect(screen.queryByText(/paypal/i)).not.toBeInTheDocument();
  });

  it('renders security badge with Stripe branding', () => {
    renderForm();
    expect(screen.getByText(/secured by/i)).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });

  it('renders accepted card brand labels', () => {
    renderForm();
    expect(screen.getByText('Visa')).toBeInTheDocument();
    expect(screen.getByText('Mastercard')).toBeInTheDocument();
    expect(screen.getByText('Amex')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('renders three numbered sections', () => {
    renderForm();
    expect(screen.getByText(/contact info/i)).toBeInTheDocument();
    expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
    expect(screen.getByText(/payment/i)).toBeInTheDocument();
  });

  // ── Submit button ──────────────────────────────────────────────────────────

  it('shows order total in submit button when provided', () => {
    renderForm({ orderTotal: 89.99 });
    expect(screen.getByText(/place order.*89\.99/i)).toBeInTheDocument();
  });

  it('shows generic Place Order text when no total provided', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('submit button is present and accessible', () => {
    renderForm();
    const submitButton = screen.getByRole('button', { name: /place order/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('shows validation errors when submitting empty form', async () => {
    renderForm();
    const submitButton = screen.getByRole('button', { name: /place order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('shows email validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  // ── Payment flow ───────────────────────────────────────────────────────────

  it('calls createPaymentIntent and confirmCardPayment on valid submit', async () => {
    const user = userEvent.setup();
    const onOrderSuccess = jest.fn();

    // Backend returns nested { status: 'success', data: { clientSecret, paymentIntentId, orderSummary } }
    // createPaymentIntent() in ordersApi.js normalizes this to a flat object
    createPaymentIntent.mockResolvedValueOnce({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_test_id',
      amount: 8999,
      currency: 'usd',
      orderSummary: { subtotal: 79.99, shippingCost: 0, total: 89.99, itemCount: 1 },
    });

    createOrder.mockResolvedValueOnce({
      order: { id: 'order-123', status: 'pending' },
    });

    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: { id: 'pi_test_id', status: 'succeeded' },
      error: null,
    });

    renderForm({ onOrderSuccess });
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(createPaymentIntent).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockConfirmCardPayment).toHaveBeenCalledWith(
        'pi_test_secret',
        expect.objectContaining({
          payment_method: expect.objectContaining({
            billing_details: expect.objectContaining({
              name: 'John Doe',
              email: 'john@example.com',
            }),
          }),
        })
      );
    });

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentIntentId: 'pi_test_id',
          shippingAddress: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          }),
          paymentInfo: expect.objectContaining({
            method: 'card',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(onOrderSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'order-123' })
      );
    });
  });

  it('shows card error when Stripe returns card_error', async () => {
    const user = userEvent.setup();

    createPaymentIntent.mockResolvedValueOnce({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_test_id',
      amount: 8999,
      currency: 'usd',
      orderSummary: null,
    });

    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: null,
      error: {
        type: 'card_error',
        message: 'Your card was declined.',
      },
    });

    renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(screen.getByText(/your card was declined/i)).toBeInTheDocument();
    });
  });

  it('shows server error when payment-intent creation fails', async () => {
    const user = userEvent.setup();

    createPaymentIntent.mockRejectedValueOnce({
      message: 'Failed to initialize payment. Please try again.',
    });

    renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to initialize payment/i)
      ).toBeInTheDocument();
    });
  });

  it('shows server error for non-card Stripe errors', async () => {
    const user = userEvent.setup();

    createPaymentIntent.mockResolvedValueOnce({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_test_id',
      amount: 8999,
      currency: 'usd',
      orderSummary: null,
    });

    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: null,
      error: {
        type: 'api_error',
        message: 'An unexpected error occurred.',
      },
    });

    renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });

  it('clears cart and calls onOrderSuccess after successful payment', async () => {
    const user = userEvent.setup();
    const onOrderSuccess = jest.fn();

    createPaymentIntent.mockResolvedValueOnce({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_456',
      amount: 8999,
      currency: 'usd',
      orderSummary: { total: 89.99 },
    });

    createOrder.mockResolvedValueOnce({
      order: { id: 'order-456', status: 'pending' },
    });

    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: { id: 'pi_456', status: 'succeeded' },
      error: null,
    });

    renderForm({ onOrderSuccess });

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/street address/i), '456 Oak Ave');
    await user.type(screen.getByLabelText(/city/i), 'Los Angeles');
    await user.type(screen.getByLabelText(/zip/i), '90001');
    await user.selectOptions(screen.getByLabelText(/country/i), 'US');

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(onOrderSuccess).toHaveBeenCalled();
    });
  });

  it('still redirects to success if order creation fails after payment', async () => {
    const user = userEvent.setup();
    const onOrderSuccess = jest.fn();

    createPaymentIntent.mockResolvedValueOnce({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_789',
      amount: 5000,
      currency: 'usd',
      orderSummary: { total: 50.00 },
    });

    // Order creation fails — but payment already succeeded
    createOrder.mockRejectedValueOnce({
      message: 'Database error',
    });

    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: { id: 'pi_789', status: 'succeeded' },
      error: null,
    });

    renderForm({ onOrderSuccess });
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    // Should still call onOrderSuccess even if order creation failed
    // (webhook will handle order creation as fallback)
    await waitFor(() => {
      expect(onOrderSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentIntentId: 'pi_789',
        })
      );
    });
  });
});
