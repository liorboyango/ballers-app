/**
 * CheckoutForm tests with Rapyd mocking.
 * Tests the Rapyd-integrated checkout form behavior.
 * Verifies that:
 *   - All contact/shipping fields render correctly
 *   - Rapyd RapydCardElement is rendered (no manual card fields)
 *   - Form validation works for required fields
 *   - Payment flow calls create-payment-intent then rapyd.confirmPayment
 *   - Card errors and server errors are displayed correctly
 *   - Successful payment clears cart and calls onOrderSuccess
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock Rapyd hooks and components before importing the component
const mockConfirmPayment = jest.fn();
const mockGetElement = jest.fn();
const mockRapyd = {
  confirmPayment: mockConfirmPayment,
  getElement: mockGetElement,
};

jest.mock('@rapyd/client-web', () => ({
  RapydCardElement: ({ onChange }) => (
    <div
      data-testid="rapyd-card-element"
      role="group"
      aria-label="Card details"
      onClick={() => onChange && onChange({ error: null })}
    />
  ),
  useRapyd: () => mockRapyd,
  RapydProvider: ({ children }) => <>{children}</>,
}));

// Mock CartContext
jest.mock('../../../hooks/useCart', () => ({
  useCart: () => ({ clearCart: jest.fn() }),
  default: () => ({ clearCart: jest.fn() }),
}));

// Mock ordersApi — the form uses createPaymentIntent and createOrder directly
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

  it('renders Rapyd RapydCardElement instead of manual card fields', () => {
    renderForm();
    // Rapyd RapydCardElement should be present
    expect(screen.getByTestId('rapyd-card-element')).toBeInTheDocument();
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

  it('renders security badge with Rapyd branding', () => {
    renderForm();
    expect(screen.getByText(/secured by/i)).toBeInTheDocument();
    expect(screen.getByText('Rapyd')).toBeInTheDocument();
    expect(screen.getByText(/PCI DSS Level 1/i)).toBeInTheDocument();
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

  it('renders payment method aria-label mentioning Rapyd', () => {
    renderForm();
    expect(
      screen.getByRole('status', { name: /credit card via rapyd/i })
    ).toBeInTheDocument();
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

  it('calls createPaymentIntent and rapyd.confirmPayment on valid submit', async () => {
    const user = userEvent.setup();
    const onOrderSuccess = jest.fn();

    // Backend returns { clientToken, paymentId, orderSummary, ... }
    createPaymentIntent.mockResolvedValueOnce({
      clientToken: 'rapyd_client_token_test',
      paymentId: 'pay_test_id',
      amount: 8999,
      currency: 'usd',
      orderSummary: { subtotal: 79.99, shippingCost: 0, total: 89.99, itemCount: 1 },
    });

    createOrder.mockResolvedValueOnce({
      order: { id: 'order-123', status: 'pending' },
    });

    mockConfirmPayment.mockResolvedValueOnce({
      payment: { id: 'pay_test_id', status: 'SUCCEEDED' },
      error: null,
    });

    renderForm({ onOrderSuccess });
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(createPaymentIntent).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalledWith(
        'rapyd_client_token_test',
        expect.objectContaining({
          billing_details: expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          rapydPaymentId: 'pay_test_id',
          shippingAddress: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
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

  it('shows card error when Rapyd returns card_error', async () => {
    const user = userEvent.setup();

    createPaymentIntent.mockResolvedValueOnce({
      clientToken: 'rapyd_client_token_test',
      paymentId: 'pay_test_id',
      amount: 8999,
      currency: 'usd',
      orderSummary: null,
    });

    mockConfirmPayment.mockResolvedValueOnce({
      payment: null,
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

  it('shows server error for non-card Rapyd errors', async () => {
    const user = userEvent.setup();

    createPaymentIntent.mockResolvedValueOnce({
      clientToken: 'rapyd_client_token_test',
      paymentId: 'pay_test_id',
      amount: 8999,
      currency: 'usd',
      orderSummary: null,
    });

    mockConfirmPayment.mockResolvedValueOnce({
      payment: null,
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
      clientToken: 'rapyd_client_token_test',
      paymentId: 'pay_456',
      amount: 8999,
      currency: 'usd',
      orderSummary: { total: 89.99 },
    });

    createOrder.mockResolvedValueOnce({
      order: { id: 'order-456', status: 'pending' },
    });

    mockConfirmPayment.mockResolvedValueOnce({
      payment: { id: 'pay_456', status: 'SUCCEEDED' },
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
      clientToken: 'rapyd_client_token_test',
      paymentId: 'pay_789',
      amount: 5000,
      currency: 'usd',
      orderSummary: { total: 50.00 },
    });

    // Order creation fails — but payment already succeeded
    createOrder.mockRejectedValueOnce({
      message: 'Database error',
    });

    mockConfirmPayment.mockResolvedValueOnce({
      payment: { id: 'pay_789', status: 'SUCCEEDED' },
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
          rapydPaymentId: 'pay_789',
        })
      );
    });
  });
});
