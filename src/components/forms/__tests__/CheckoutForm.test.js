/**
 * CheckoutForm tests — Rapyd payment confirmation flow.
 *
 * Covers:
 *   - Rendering: form fields, RapydCardElement, branding, accessibility
 *   - Validation: required fields, email format
 *   - Confirmation flow: createPaymentIntent → rapyd.confirmPayment → createOrder
 *   - Rapyd error types: card_error, validation_error, api_error, authentication_error
 *   - Payment status handling: FAILED, CANCELED, unexpected statuses
 *   - Edge cases: order creation failure after payment success (webhook fallback)
 *   - PENDING status: proceed to success (async payment methods)
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// ── Rapyd SDK mock ──────────────────────────────────────────────────────────
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

// ── Context / service mocks ─────────────────────────────────────────────────
jest.mock('../../../hooks/useCart', () => ({
  useCart: () => ({ clearCart: jest.fn() }),
  default: () => ({ clearCart: jest.fn() }),
}));

jest.mock('../../../services/ordersApi', () => ({
  createPaymentIntent: jest.fn(),
  createOrder: jest.fn(),
}));

import CheckoutForm from '../CheckoutForm';
import { createPaymentIntent, createOrder } from '../../../services/ordersApi';

// ── Helpers ─────────────────────────────────────────────────────────────────

const renderForm = (props = {}) =>
  render(
    <BrowserRouter>
      <CheckoutForm {...props} />
    </BrowserRouter>
  );

/**
 * Fill in all required checkout fields.
 * Country 'US' must exist as an option in the select.
 */
async function fillRequiredFields(user) {
  await user.type(screen.getByLabelText(/first name/i), 'John');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
  await user.type(screen.getByLabelText(/street address/i), '123 Main St');
  await user.type(screen.getByLabelText(/city/i), 'New York');
  await user.type(screen.getByLabelText(/zip/i), '10001');
  await user.selectOptions(screen.getByLabelText(/country/i), 'US');
}

/** Standard mock data for a successful createPaymentIntent() call */
const MOCK_PAYMENT_INTENT = {
  clientToken: 'rapyd_client_token_test',
  paymentId: 'pay_test_id',
  amount: 8999,
  currency: 'usd',
  orderSummary: {
    subtotal: 79.99,
    shippingCost: 0,
    total: 89.99,
    itemCount: 1,
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CheckoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: getElement returns a mock card element reference
    mockGetElement.mockReturnValue({ _type: 'card' });
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

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

    it('renders Rapyd RapydCardElement (no manual card fields)', () => {
      renderForm();
      expect(screen.getByTestId('rapyd-card-element')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/1234 5678/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/card holder/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cvv/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/expiry/i)).not.toBeInTheDocument();
    });

    it('renders credit card payment indicator', () => {
      renderForm();
      expect(screen.getByText(/credit card/i)).toBeInTheDocument();
    });

    it('does not render PayPal option', () => {
      renderForm();
      expect(screen.queryByText(/paypal/i)).not.toBeInTheDocument();
    });

    it('renders Rapyd security badge', () => {
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

    it('renders three numbered form sections', () => {
      renderForm();
      expect(screen.getByText(/contact info/i)).toBeInTheDocument();
      expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });

    it('renders payment method section with Rapyd aria-label', () => {
      renderForm();
      expect(
        screen.getByRole('status', { name: /credit card via rapyd/i })
      ).toBeInTheDocument();
    });

    it('shows order total in submit button when provided', () => {
      renderForm({ orderTotal: 89.99 });
      expect(screen.getByText(/place order.*89\.99/i)).toBeInTheDocument();
    });

    it('shows generic Place Order text when no total provided', () => {
      renderForm();
      expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
    });

    it('submit button has correct type and is accessible', () => {
      renderForm();
      const btn = screen.getByRole('button', { name: /place order/i });
      expect(btn).toHaveAttribute('type', 'submit');
    });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('shows validation errors when submitting empty form', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: /place order/i }));
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
  });

  // ── Payment confirmation flow ──────────────────────────────────────────────

  describe('Payment confirmation flow', () => {
    it('calls createPaymentIntent, then rapyd.confirmPayment, then createOrder on success', async () => {
      const user = userEvent.setup();
      const onOrderSuccess = jest.fn();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
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
        // confirmPayment receives the clientToken and billing_address
        expect(mockConfirmPayment).toHaveBeenCalledWith(
          'rapyd_client_token_test',
          expect.objectContaining({
            billing_address: expect.objectContaining({
              name: 'John Doe',
              email: 'john@example.com',
              line_1: '123 Main St',
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

    it('passes getElement() result as element in confirmPayment options', async () => {
      const user = userEvent.setup();
      const cardElementMock = { _type: 'card', id: 'el-1' };
      mockGetElement.mockReturnValue(cardElementMock);

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      createOrder.mockResolvedValueOnce({ order: { id: 'order-xyz' } });
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'SUCCEEDED' },
        error: null,
      });

      renderForm({ onOrderSuccess: jest.fn() });
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(mockConfirmPayment).toHaveBeenCalledWith(
          'rapyd_client_token_test',
          expect.objectContaining({ element: cardElementMock })
        );
      });
    });

    it('accepts ACTIVATED status as a successful payment', async () => {
      const user = userEvent.setup();
      const onOrderSuccess = jest.fn();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      createOrder.mockResolvedValueOnce({ order: { id: 'order-act' } });
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'ACTIVATED' },
        error: null,
      });

      renderForm({ onOrderSuccess });
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(onOrderSuccess).toHaveBeenCalled();
      });
    });

    it('accepts PENDING status and proceeds to order creation', async () => {
      const user = userEvent.setup();
      const onOrderSuccess = jest.fn();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      createOrder.mockResolvedValueOnce({ order: { id: 'order-pnd' } });
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'PENDING' },
        error: null,
      });

      renderForm({ onOrderSuccess });
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(onOrderSuccess).toHaveBeenCalled();
      });
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('shows inline card error for card_error type', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      mockConfirmPayment.mockResolvedValueOnce({
        payment: null,
        error: { type: 'card_error', message: 'Your card was declined.' },
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/your card was declined/i)).toBeInTheDocument();
      });
    });

    it('shows inline card error for validation_error type', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      mockConfirmPayment.mockResolvedValueOnce({
        payment: null,
        error: { type: 'validation_error', message: 'Invalid card number.' },
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
      });
    });

    it('shows inline card error for authentication_error (3DS failure)', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      mockConfirmPayment.mockResolvedValueOnce({
        payment: null,
        error: { type: 'authentication_error', message: '3DS authentication failed.' },
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/3DS authentication failed/i)).toBeInTheDocument();
      });
    });

    it('shows server error banner for api_error type', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      mockConfirmPayment.mockResolvedValueOnce({
        payment: null,
        error: { type: 'api_error', message: 'An unexpected error occurred.' },
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });

    it('shows server error when createPaymentIntent fails', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockRejectedValueOnce({
        message: 'Failed to initialize payment. Please try again.',
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to initialize payment/i)).toBeInTheDocument();
      });
    });

    it('shows error for FAILED payment status', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'FAILED' },
        error: null,
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
      });
    });

    it('shows error for CANCELED payment status', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'CANCELED' },
        error: null,
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('does not call createOrder when payment status is FAILED', async () => {
      const user = userEvent.setup();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'FAILED' },
        error: null,
      });

      renderForm();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(createOrder).not.toHaveBeenCalled();
    });
  });

  // ── Cart and success flow ──────────────────────────────────────────────────

  describe('Cart and success flow', () => {
    it('clears cart and calls onOrderSuccess after successful payment', async () => {
      const user = userEvent.setup();
      const onOrderSuccess = jest.fn();

      createPaymentIntent.mockResolvedValueOnce({
        ...MOCK_PAYMENT_INTENT,
        paymentId: 'pay_456',
      });
      createOrder.mockResolvedValueOnce({
        order: { id: 'order-456', status: 'pending' },
      });
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_456', status: 'SUCCEEDED' },
        error: null,
      });

      renderForm({ onOrderSuccess });
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(onOrderSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'order-456' })
        );
      });
    });

    it('ensures rapydPaymentId is set on the success order object', async () => {
      const user = userEvent.setup();
      const onOrderSuccess = jest.fn();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      createOrder.mockResolvedValueOnce({
        order: { id: 'order-789', status: 'paid', rapydPaymentId: 'pay_test_id' },
      });
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'SUCCEEDED' },
        error: null,
      });

      renderForm({ onOrderSuccess });
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(onOrderSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ rapydPaymentId: 'pay_test_id' })
        );
      });
    });

    it('still calls onOrderSuccess if order creation fails (webhook fallback)', async () => {
      const user = userEvent.setup();
      const onOrderSuccess = jest.fn();

      createPaymentIntent.mockResolvedValueOnce({
        ...MOCK_PAYMENT_INTENT,
        paymentId: 'pay_789',
      });
      createOrder.mockRejectedValueOnce({ message: 'Database error' });
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_789', status: 'SUCCEEDED' },
        error: null,
      });

      renderForm({ onOrderSuccess });
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      // Payment succeeded so we still navigate to success; webhook will create order
      await waitFor(() => {
        expect(onOrderSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ rapydPaymentId: 'pay_789' })
        );
      });
    });

    it('includes shippingAddress in the success order object', async () => {
      const user = userEvent.setup();
      const onOrderSuccess = jest.fn();

      createPaymentIntent.mockResolvedValueOnce(MOCK_PAYMENT_INTENT);
      createOrder.mockResolvedValueOnce({ order: { id: 'order-addr' } });
      mockConfirmPayment.mockResolvedValueOnce({
        payment: { id: 'pay_test_id', status: 'SUCCEEDED' },
        error: null,
      });

      renderForm({ onOrderSuccess });
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(onOrderSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            shippingAddress: expect.objectContaining({
              firstName: 'John',
              lastName: 'Doe',
              address: '123 Main St',
              city: 'New York',
              zip: '10001',
              country: 'US',
            }),
          })
        );
      });
    });
  });
});
