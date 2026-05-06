/**
 * Unit tests for CheckoutForm component.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CheckoutForm from '../CheckoutForm';

jest.mock('../../../hooks/useCart', () => ({
  useCart: () => ({
    cart: { items: [], totalPrice: 0 },
    clearCart: jest.fn(),
  }),
}));

jest.mock('../../../services/api', () => ({
  post: jest.fn(),
}));

const api = require('../../../services/api');

const renderCheckoutForm = (props = {}) =>
  render(
    <MemoryRouter>
      <CheckoutForm {...props} />
    </MemoryRouter>
  );

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText(/first name/i), 'John');
  await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
  await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
  await userEvent.type(screen.getByLabelText(/street address/i), '123 Main St');
  await userEvent.type(screen.getByLabelText(/city/i), 'New York');
  await userEvent.type(screen.getByLabelText(/zip/i), '10001');
  // Select country
  fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } });
  // Card fields
  await userEvent.type(screen.getByLabelText(/card number/i), '4111111111111111');
  await userEvent.type(screen.getByLabelText(/card holder/i), 'JOHN DOE');
  await userEvent.type(screen.getByLabelText(/month/i), '12');
  await userEvent.type(screen.getByLabelText(/year/i), '28');
  await userEvent.type(screen.getByLabelText(/cvv/i), '123');
};

describe('CheckoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all three sections', () => {
    renderCheckoutForm();
    expect(screen.getByText(/contact info/i)).toBeInTheDocument();
    expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
    expect(screen.getByText(/payment/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    renderCheckoutForm();
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('shows card fields when credit card is selected', () => {
    renderCheckoutForm();
    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
  });

  it('switches to PayPal view when PayPal is selected', async () => {
    renderCheckoutForm();
    fireEvent.click(screen.getByRole('button', { name: /paypal/i }));
    await waitFor(() => {
      expect(screen.getByText(/redirected to paypal/i)).toBeInTheDocument();
    });
  });

  it('calls api.post on valid form submission', async () => {
    api.post.mockResolvedValueOnce({
      data: { order: { id: 'order-123', status: 'pending' } },
    });
    const onOrderSuccess = jest.fn();
    renderCheckoutForm({ onOrderSuccess });

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/orders/create',
        expect.objectContaining({
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
  });

  it('shows server error on failed order', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Payment declined' } },
    });
    renderCheckoutForm();

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(screen.getByText(/payment declined/i)).toBeInTheDocument();
    });
  });
});
