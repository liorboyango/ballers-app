/**
 * CheckoutForm tests with Stripe mocking.
 * Tests the Stripe-integrated checkout form behavior.
 * Verifies that:
 *   - All contact/shipping fields render correctly
 *   - Stripe CardElement is rendered (no manual card fields)
 *   - Form validation works for required fields
 *   - Payment flow calls create-payment-intent then confirmCardPayment
 *   - Card errors and server errors are displayed correctly
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

// Mock API
jest.mock('../../../services/api', () => ({
  default: {
    post: jest.fn(),
  },
}));

import CheckoutForm from '../CheckoutForm';
import api from '../../../services/api';

const renderForm = (props = {}) =>
  render(
    <BrowserRouter>
      <CheckoutForm {...props} />
    </BrowserRouter>
  );

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

  it('calls create-payment-intent and confirmCardPayment on valid submit', async () => {
    const user = userEvent.setup();
    const onOrderSuccess = jest.fn();

    api.post
      .mockResolvedValueOnce({ data: { client_secret: 'pi_test_secret' } }) // create-payment-intent
      .mockResolvedValueOnce({ data: { order: { id: 'order-123' } } }); // create order

    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: { id: 'pi_test', status: 'succeeded' },
      error: null,
    });

    renderForm({ onOrderSuccess });

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/street address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.type(screen.getByLabelText(/zip/i), '10001');

    // Select country from dropdown
    const countrySelect = screen.getByLabelText(/country/i);
    await user.selectOptions(countrySelect, 'US');

    const submitButton = screen.getByRole('button', { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/orders/create-payment-intent',
        expect.objectContaining({
          shippingAddress: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          }),
        })
      );
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
      expect(onOrderSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'order-123' })
      );
    });
  });

  it('shows card error when Stripe returns card_error', async () => {
    const user = userEvent.setup();

    api.post.mockResolvedValueOnce({ data: { client_secret: 'pi_test_secret' } });
    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: null,
      error: {
        type: 'card_error',
        message: 'Your card was declined.',
      },
    });

    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/street address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.type(screen.getByLabelText(/zip/i), '10001');
    const countrySelect = screen.getByLabelText(/country/i);
    await user.selectOptions(countrySelect, 'US');

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(screen.getByText(/your card was declined/i)).toBeInTheDocument();
    });
  });

  it('shows server error when payment-intent creation fails', async () => {
    const user = userEvent.setup();

    api.post.mockRejectedValueOnce({
      message: 'Failed to initialize payment. Please try again.',
    });

    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/street address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.type(screen.getByLabelText(/zip/i), '10001');
    const countrySelect = screen.getByLabelText(/country/i);
    await user.selectOptions(countrySelect, 'US');

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to initialize payment/i)
      ).toBeInTheDocument();
    });
  });

  it('shows server error for non-card Stripe errors', async () => {
    const user = userEvent.setup();

    api.post.mockResolvedValueOnce({ data: { client_secret: 'pi_test_secret' } });
    mockConfirmCardPayment.mockResolvedValueOnce({
      paymentIntent: null,
      error: {
        type: 'api_error',
        message: 'An unexpected error occurred.',
      },
    });

    renderForm();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/street address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.type(screen.getByLabelText(/zip/i), '10001');
    const countrySelect = screen.getByLabelText(/country/i);
    await user.selectOptions(countrySelect, 'US');

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
    const clearCart = jest.fn();

    // Override the useCart mock for this test
    jest.doMock('../../../hooks/useCart', () => ({
      useCart: () => ({ clearCart }),
      default: () => ({ clearCart }),
    }));

    api.post
      .mockResolvedValueOnce({ data: { client_secret: 'pi_test_secret' } })
      .mockResolvedValueOnce({ data: { order: { id: 'order-456' } } });

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
    const countrySelect = screen.getByLabelText(/country/i);
    await user.selectOptions(countrySelect, 'US');

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(onOrderSuccess).toHaveBeenCalled();
    });
  });
});
