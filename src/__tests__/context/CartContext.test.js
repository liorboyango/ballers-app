/**
 * Tests for CartContext — shopping cart state management.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';
import api from '../../services/api';

jest.mock('../../services/api');

// Mock product
const mockProduct = {
  _id: 'prod123',
  name: 'Brazil Home Kit',
  price: 129.99,
  images: ['/uploads/brazil-home.jpg'],
  team: { name: 'Brazil' },
  slug: 'brazil-home-kit',
};

// Test component
const TestCartComponent = () => {
  const { items, totalItems, totalPrice, addToCart, removeFromCart, updateCartItem, clearCart } = useCart();

  return (
    <div>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="total-price">{totalPrice.toFixed(2)}</div>
      <div data-testid="items-count">{items.length}</div>
      <button
        onClick={() => addToCart(mockProduct, 1, { size: 'M', number: '10', name: 'VINI JR' })}
        data-testid="add-btn"
      >
        Add to Cart
      </button>
      <button
        onClick={() => items[0] && removeFromCart(items[0]._id)}
        data-testid="remove-btn"
      >
        Remove
      </button>
      <button onClick={clearCart} data-testid="clear-btn">
        Clear
      </button>
    </div>
  );
};

const renderWithProviders = () => {
  // Mock auth as unauthenticated for guest cart tests
  api.get.mockRejectedValue(new Error('No token'));

  return render(
    <AuthProvider>
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    </AuthProvider>
  );
};

describe('CartContext (Guest)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('starts with empty cart', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('0');
      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });
  });

  it('adds item to guest cart', async () => {
    renderWithProviders();
    await waitFor(() => screen.getByTestId('add-btn'));

    await act(async () => {
      userEvent.click(screen.getByTestId('add-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
      expect(screen.getByTestId('total-price')).toHaveTextContent('129.99');
    });

    // Verify localStorage persistence
    const stored = JSON.parse(localStorage.getItem('ballers_guest_cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].product.name).toBe('Brazil Home Kit');
  });

  it('removes item from guest cart', async () => {
    renderWithProviders();
    await waitFor(() => screen.getByTestId('add-btn'));

    // Add item first
    await act(async () => {
      userEvent.click(screen.getByTestId('add-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    });

    // Remove item
    await act(async () => {
      userEvent.click(screen.getByTestId('remove-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    });
  });

  it('clears the cart', async () => {
    renderWithProviders();
    await waitFor(() => screen.getByTestId('add-btn'));

    await act(async () => {
      userEvent.click(screen.getByTestId('add-btn'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    });

    await act(async () => {
      userEvent.click(screen.getByTestId('clear-btn'));
    });

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    expect(screen.getByTestId('total-price')).toHaveTextContent('0.00');
  });

  it('throws error when useCart is used outside CartProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestCartComponent />)).toThrow(
      'useCart must be used within a CartProvider'
    );
    consoleError.mockRestore();
  });
});
