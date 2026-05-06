import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartSummary from '../CartSummary';
import { CartContext } from '../../context/CartContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockCartItems = [
  {
    _id: 'item1',
    product: {
      _id: 'prod1',
      name: 'Brazil Home Kit',
      images: ['/uploads/brazil.jpg'],
      team: { name: 'Brazil' },
    },
    quantity: 1,
    price: 129.99,
    customization: { size: 'M', number: '10', name: 'VINI JR' },
  },
  {
    _id: 'item2',
    product: {
      _id: 'prod2',
      name: 'Argentina Away Kit',
      images: [],
      team: { name: 'Argentina' },
    },
    quantity: 2,
    price: 119.99,
    customization: { size: 'L', number: '7', name: 'ALVAREZ' },
  },
];

const createCartContext = (overrides = {}) => ({
  cart: {
    items: mockCartItems,
    totalItems: 3,
    totalPrice: 369.97,
  },
  loading: false,
  error: '',
  addToCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
  fetchCart: jest.fn(),
  totalItems: 3,
  ...overrides,
});

const renderCartSummary = (contextOverrides = {}, props = {}) => {
  return render(
    <BrowserRouter>
      <CartContext.Provider value={createCartContext(contextOverrides)}>
        <CartSummary {...props} />
      </CartContext.Provider>
    </BrowserRouter>
  );
};

describe('CartSummary', () => {
  it('renders cart items', () => {
    renderCartSummary();
    expect(screen.getByText('Brazil Home Kit')).toBeInTheDocument();
    expect(screen.getByText('Argentina Away Kit')).toBeInTheDocument();
  });

  it('shows empty cart message when no items', () => {
    renderCartSummary({
      cart: { items: [], totalItems: 0, totalPrice: 0 },
      totalItems: 0,
    });
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    renderCartSummary({ loading: true });
    expect(screen.getByLabelText('Loading cart')).toBeInTheDocument();
  });

  it('shows error message when error occurs', () => {
    renderCartSummary({ error: 'Network error', loading: false });
    expect(screen.getByText('Failed to load cart')).toBeInTheDocument();
  });

  it('displays subtotal correctly', () => {
    renderCartSummary();
    expect(screen.getByText('$369.97')).toBeInTheDocument();
  });

  it('shows free shipping for orders over $100', () => {
    renderCartSummary();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows shipping cost for orders under $100', () => {
    renderCartSummary({
      cart: {
        items: [mockCartItems[0]],
        totalItems: 1,
        totalPrice: 49.99,
      },
    });
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('renders checkout button when showCheckoutButton is true', () => {
    renderCartSummary({}, { showCheckoutButton: true });
    expect(
      screen.getByRole('button', { name: /proceed to checkout/i })
    ).toBeInTheDocument();
  });

  it('does not render checkout button when showCheckoutButton is false', () => {
    renderCartSummary({}, { showCheckoutButton: false });
    expect(
      screen.queryByRole('button', { name: /proceed to checkout/i })
    ).not.toBeInTheDocument();
  });
});
