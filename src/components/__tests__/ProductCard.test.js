import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { CartContext } from '../../context/CartContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockAddToCart = jest.fn();

const mockCartContext = {
  cart: { items: [], totalItems: 0, totalPrice: 0 },
  loading: false,
  error: '',
  addToCart: mockAddToCart,
  updateCartItem: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
  fetchCart: jest.fn(),
  totalItems: 0,
};

const mockProduct = {
  _id: 'prod123',
  name: 'Brazil Home Kit',
  price: 129.99,
  images: ['/uploads/brazil-home.jpg'],
  team: { _id: 'team1', name: 'Brazil', country: 'Brazil' },
  kitType: 'home',
  isNew: true,
  onSale: false,
  inStock: true,
  slug: 'brazil-home-kit',
};

const renderProductCard = (product = mockProduct) => {
  return render(
    <BrowserRouter>
      <CartContext.Provider value={mockCartContext}>
        <ProductCard product={product} />
      </CartContext.Provider>
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product name and price', () => {
    renderProductCard();
    expect(screen.getByText('Brazil Home Kit')).toBeInTheDocument();
    expect(screen.getByText('$129.99')).toBeInTheDocument();
  });

  it('renders NEW badge for new products', () => {
    renderProductCard();
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not render NEW badge for non-new products', () => {
    renderProductCard({ ...mockProduct, isNew: false });
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('renders OUT OF STOCK badge and disables button when out of stock', () => {
    renderProductCard({ ...mockProduct, inStock: false });
    expect(screen.getByText('OUT OF STOCK')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
  });

  it('renders size selector buttons', () => {
    renderProductCard();
    ['XS', 'S', 'M', 'L', 'XL', 'XXL'].forEach((size) => {
      expect(screen.getByRole('button', { name: `Size ${size}` })).toBeInTheDocument();
    });
  });

  it('shows error when adding to cart without selecting size', async () => {
    renderProductCard();
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);
    await waitFor(() => {
      expect(screen.getByText('Please select a size')).toBeInTheDocument();
    });
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it('calls addToCart with correct params when size is selected', async () => {
    mockAddToCart.mockResolvedValueOnce();
    renderProductCard();

    // Select size M
    fireEvent.click(screen.getByRole('button', { name: 'Size M' }));

    // Click add to cart
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith({
        productId: 'prod123',
        quantity: 1,
        customization: { size: 'M' },
      });
    });
  });

  it('navigates to product detail on card click', () => {
    renderProductCard();
    const card = screen.getByRole('article');
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/product/prod123');
  });

  it('renders team name', () => {
    renderProductCard();
    expect(screen.getByText(/brazil/i)).toBeInTheDocument();
  });

  it('returns null when no product provided', () => {
    const { container } = render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContext}>
          <ProductCard product={null} />
        </CartContext.Provider>
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});
